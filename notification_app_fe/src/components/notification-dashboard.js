"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { fetchNotifications, fetchPriorityNotifications } from "../lib/api.js";
import { NotificationCard } from "./notification-card.js";
import { NotificationFilters } from "./notification-filters.js";

export function NotificationDashboard({ mode = "all" }) {
  const [tab, setTab] = useState(mode === "priority" ? "priority" : "all");
  const [type, setType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [priorityItems, setPriorityItems] = useState([]);
  const [priorityMeta, setPriorityMeta] = useState(null);

  const activeType = type === "All" ? undefined : type;

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [allResponse, priorityResponse] = await Promise.all([
        fetchNotifications({ limit: 25, notificationType: activeType }),
        fetchPriorityNotifications({ limit: 10, notificationType: activeType }),
      ]);

      setAllItems(extractItems(allResponse));
      setPriorityItems(extractItems(priorityResponse));
      setPriorityMeta(priorityResponse?.meta ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [activeType]);

  const unreadCount = useMemo(
    () => allItems.filter((item) => isUnread(item)).length,
    [allItems]
  );

  const showAllPanel = mode !== "priority";
  const showPriorityPanel = mode !== "all";

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.78))",
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="secondary.main" sx={{ letterSpacing: 2 }}>
              Campus Notification Hub
            </Typography>
            <Typography variant="h2" sx={{ mt: 1 }}>
              All notifications, with priority on what matters most.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 820 }}>
              A responsive React and Material UI dashboard for viewing notifications, surfacing the
              highest-priority unread items first, and distinguishing new updates from already viewed
              messages.
            </Typography>
            {priorityMeta ? (
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                <Typography variant="caption" color="text.secondary">
                  Priority scan: {priorityMeta.scannedCount} items
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Returned: {priorityMeta.returnedCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Top N: {priorityMeta.topN}
                </Typography>
              </Stack>
            ) : null}
          </Box>

          <NotificationFilters value={type} onChange={setType} onRefresh={loadData} />

          <Tabs
            value={tab}
            onChange={(_, next) => setTab(next)}
            sx={{ borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}
          >
            {mode !== "priority" ? <Tab value="all" label={`All (${allItems.length})`} /> : null}
            {mode !== "all" ? <Tab value="priority" label={`Priority (${priorityItems.length})`} /> : null}
          </Tabs>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {showAllPanel ? (
                <Grid item xs={12} lg={showPriorityPanel ? 8 : 12}>
                  <Paper sx={{ p: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="h5">All notifications</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {unreadCount} unread out of {allItems.length}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack spacing={2}>
                      {allItems.length === 0 ? (
                        <Typography color="text.secondary">No notifications found.</Typography>
                      ) : (
                        allItems.map((item) => (
                          <NotificationCard key={item.ID ?? item.id} notification={item} unread={isUnread(item)} />
                        ))
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              ) : null}

              {showPriorityPanel ? (
                <Grid item xs={12} lg={showAllPanel ? 4 : 12}>
                  <Paper sx={{ p: 2.5, position: showAllPanel ? "sticky" : "static", top: 24 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      Priority inbox
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Top unread notifications based on type weight and recency.
                    </Typography>
                    <Stack spacing={2}>
                      {priorityItems.length === 0 ? (
                        <Typography color="text.secondary">No priority items available.</Typography>
                      ) : (
                        priorityItems.map((item) => (
                          <NotificationCard key={item.ID ?? item.id} notification={item} unread={isUnread(item)} />
                        ))
                      )}
                    </Stack>
                  </Paper>
                </Grid>
              ) : null}
            </Grid>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function isUnread(notification) {
  if (typeof notification?.isRead === "boolean") {
    return !notification.isRead;
  }

  const state = String(notification?.state ?? "").toLowerCase();
  return state !== "read";
}
