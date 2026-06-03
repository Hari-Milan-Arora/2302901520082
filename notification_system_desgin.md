# Stage 1

## Goal
Design a clean REST API contract for a campus notification platform that supports notifications, unread views, filtering, and real-time delivery.

## Core REST Resources

### `GET /api/v1/notifications`
Returns notifications for the logged-in student.

Query parameters:
- `limit`
- `page`
- `notification_type`

### `GET /api/v1/notifications/unread`
Returns only unread notifications.

### `POST /api/v1/notifications`
Creates a notification record for a student or a group of students.

### `PATCH /api/v1/notifications/:id/read`
Marks a notification as read.

### `POST /api/v1/notifications/broadcast`
Creates one notification and fans it out to many students.

## Headers

```http
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

## JSON Request Shape

```json
{
  "studentId": 1042,
  "notificationType": "Placement",
  "title": "Placement drive update",
  "message": "New company visit scheduled for Friday",
  "priority": "high",
  "metadata": {
    "company": "CSX Corporation"
  }
}
```

## JSON Response Shape

```json
{
  "data": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "studentId": 1042,
      "notificationType": "Placement",
      "title": "Placement drive update",
      "message": "New company visit scheduled for Friday",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "unreadCount": 1
  }
}
```

## Real-Time Mechanism

Use a hybrid delivery model:
- Persist notification first in the database.
- Emit a real-time event through WebSocket or Server-Sent Events.
- Fallback to polling for clients that reconnect late.

This gives reliable storage and fast UI updates at the same time.

# Stage 2

## Storage Choice

Use PostgreSQL.

Why:
- Notification data is relational and benefits from ACID guarantees.
- We need joins between students, notifications, delivery state, and read state.
- Filtering by student, type, read state, and time range is a strong fit for indexed relational queries.

## Suggested Schema

```sql
CREATE TABLE students (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  roll_no TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('Event', 'Result', 'Placement')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_recipients (
  id UUID PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Indexes

```sql
CREATE INDEX idx_notification_recipients_student_read_created
  ON notification_recipients (student_id, is_read, created_at DESC);

CREATE INDEX idx_notifications_type_created
  ON notifications (notification_type, created_at DESC);

CREATE INDEX idx_notification_recipients_unread
  ON notification_recipients (student_id, created_at DESC)
  WHERE is_read = FALSE;
```

## Growth Problems and Fixes

- Problem: table scans become expensive as notifications grow.
- Fix: add selective composite and partial indexes.

- Problem: old data makes the table large.
- Fix: archive or partition by time.

- Problem: hot read traffic on unread notifications.
- Fix: cache unread counts and recent lists in Redis.

- Problem: write spikes during bulk announcements.
- Fix: batch inserts and queue delivery jobs.

## Example Queries

```sql
-- Unread notifications for one student
SELECT n.id, n.notification_type, n.title, n.message, nr.created_at
FROM notification_recipients nr
JOIN notifications n ON n.id = nr.notification_id
WHERE nr.student_id = 1042
  AND nr.is_read = FALSE
ORDER BY nr.created_at DESC
LIMIT 20;

-- Placement notifications from the last 7 days
SELECT id, notification_type, title, message, created_at
FROM notifications
WHERE notification_type = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

# Stage 3

## Analysis of the Given Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

It is logically correct if the schema columns are named that way, but it is slow for a growing table because:
- It uses `SELECT *`, which fetches unnecessary columns.
- It may scan many rows if the table is not indexed properly.
- `ORDER BY createdAt ASC` adds more work if the filter is not selective enough.

## Better Approach

- Select only required columns.
- Add a composite or partial index on `(student_id, is_read, created_at DESC)`.
- Fetch the newest unread notifications first.

## Why Adding Indexes on Every Column Is Not Good

- Every index slows inserts and updates.
- Low-selectivity columns do not help much.
- Too many indexes increase storage and maintenance cost.

## Query for Placement Notifications in the Last 7 Days

```sql
SELECT id, notification_type, title, message, created_at
FROM notifications
WHERE notification_type IN ('Placement')
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

If the schema stores enum values in a different column name, use that field consistently.

# Stage 4

## Problem

Notifications are fetched on every page load, which overloads the database and hurts user experience.

## Recommended Strategy

Use a layered approach:

1. Cache the first page and unread count in Redis.
2. Use pagination or cursor-based loading.
3. Revalidate data in the background.
4. Push live updates over WebSocket or SSE.

## Tradeoffs

- Caching:
  - Pros: very fast reads, reduced DB load.
  - Cons: stale data if invalidation is weak.

- Pagination:
  - Pros: smaller payloads, faster initial load.
  - Cons: user may need more requests to see older items.

- WebSockets/SSE:
  - Pros: near real-time UX.
  - Cons: more operational complexity.

- Read replicas:
  - Pros: offload reads from primary DB.
  - Cons: replication lag.

## Practical Improvement Plan

- Cache the latest unread notifications per student.
- Invalidate the cache when a notification is created or marked read.
- Load only the first page initially.
- Keep older notifications behind paginated fetches.

# Stage 5

## Shortcomings of the Given Implementation

The loop-based design is not reliable or scalable because:
- It performs work sequentially for 50,000 students.
- A single failure can interrupt the rest of the batch.
- It mixes email delivery, DB writes, and app push logic in one flow.
- There is no retry strategy or dead-letter handling.
- It does not support idempotency.

## Better Design

Use an asynchronous job queue with workers.

Flow:
1. Create notification records in the database.
2. Enqueue delivery jobs for email and in-app notifications.
3. Workers process jobs independently.
4. Retry transient failures with backoff.
5. Mark permanent failures for later inspection.

## Should DB Save and Email Happen Together?

No, not in a single transaction with the email service.

Reason:
- Database writes are transactional.
- Email delivery is an external side effect.
- The right pattern is the outbox pattern or a saga-like workflow.

## Revised Pseudocode

```text
function notify_all(student_ids, message):
    notification_id = create_notification_record(message)

    for student_id in student_ids:
        enqueue_job("deliver_notification", {
            notification_id,
            student_id,
            message
        })

worker deliver_notification(job):
    try:
        send_email(job.student_id, job.message)
        save_to_db(job.student_id, job.notification_id, job.message)
        push_to_app(job.student_id, job.message)
        mark_job_success(job)
    except transient_error:
        retry_with_backoff(job)
    except permanent_error:
        mark_job_failed(job)
```

## If 200 Emails Fail Midway

- Retry only failed jobs.
- Preserve already completed work.
- Do not rerun the whole batch.
- Use idempotency keys so duplicate retries do not create duplicate notifications.

# Stage 6

## Priority Rules

Priority is based on:
- Notification type weight:
  - `Placement` highest
  - `Result` next
  - `Event` lowest
- Recency as a tiebreaker

## Efficient Top-N Approach

Keep a min-heap of size `N`.
- For each notification:
  - compute score from type weight and timestamp
  - push into heap
  - if heap size exceeds `N`, remove the lowest item

This avoids sorting the entire dataset every time.

## Implementation Note

The frontend can request notifications from the API and the backend can compute the top list in a service function rather than hard-coding values.

## Example Ranking Function

```text
score = typeWeight * 1_000_000_000_000 + unixTimestamp
```

That keeps type priority higher than recency while still ordering newer items first within the same type.

# Stage 7

## Frontend Implementation

Build the frontend as a React/Next.js application with Material UI so the notification dashboard is responsive, polished, and easy to extend.

### Pages

- `/`
  - Shows the complete notification feed.
  - Includes filters and unread counts.

- `/priority`
  - Shows the focused priority inbox.
  - Highlights the top unread notifications first.

### UI Structure

- Use a shared app shell and a sticky header for navigation.
- Keep the dashboard split into:
  - a main notifications panel
  - a priority inbox panel
- Show loading, error, and empty states explicitly.

### Data Flow

- Fetch all notifications from the backend proxy route.
- Fetch priority notifications from the dedicated priority route.
- Render summary metadata for the priority scan so the user can see how the top list was computed.

### Implementation Notes

- Use Material UI components for cards, tabs, alerts, chips, and layout.
- Keep the design clean and mobile-friendly.
- Avoid hard-coding notification samples in the UI.
- Let the backend remain the source of truth for notification ordering and filtering.
