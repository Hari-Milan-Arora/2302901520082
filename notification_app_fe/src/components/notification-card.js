"use client";

import { Badge, Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

const TYPE_COLORS = {
  placement: "secondary",
  result: "primary",
  event: "success",
};

export function NotificationCard({ notification, unread }) {
  const type = String(notification?.Type ?? notification?.type ?? notification?.notificationType ?? "").toLowerCase();
  const label = notification?.Type ?? notification?.type ?? notification?.notificationType ?? "Notification";
  const message = notification?.Message ?? notification?.message ?? "";
  const timestamp = notification?.Timestamp ?? notification?.timestamp ?? notification?.createdAt ?? "";

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: unread ? "rgba(17, 75, 95, 0.22)" : "rgba(15, 23, 42, 0.08)",
        borderLeftWidth: 5,
        borderLeftStyle: "solid",
        borderLeftColor: unread ? "primary.main" : "transparent",
        bgcolor: unread ? "rgba(17, 75, 95, 0.05)" : "background.paper",
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Badge
                color={unread ? "secondary" : "default"}
                variant={unread ? "dot" : "standard"}
                invisible={!unread}
              >
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {label}
                </Typography>
              </Badge>
              {unread ? <Chip size="small" color="secondary" label="New" /> : <Chip size="small" label="Viewed" />}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {message}
            </Typography>
          </Box>
          <Chip size="small" color={TYPE_COLORS[type] ?? "default"} label={label} />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          {timestamp ? new Date(timestamp).toLocaleString() : "Unknown time"}
        </Typography>
      </CardContent>
    </Card>
  );
}
