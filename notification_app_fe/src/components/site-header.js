"use client";

import Link from "next/link";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";

export function SiteHeader() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Notification App
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Campus notifications and priority inbox
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button component={Link} href="/" color="primary" variant="text">
            All notifications
          </Button>
          <Button component={Link} href="/priority" color="primary" variant="contained">
            Priority inbox
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
