"use client";

import { Box, Button, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

const TYPES = ["All", "Event", "Result", "Placement"];

export function NotificationFilters({ value, onChange, onRefresh }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="overline" color="text.secondary">
          Filter by type
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={value}
          onChange={(_, next) => next && onChange(next)}
          size="small"
          sx={{ mt: 1, flexWrap: "wrap" }}
        >
          {TYPES.map((type) => (
            <ToggleButton key={type} value={type} sx={{ px: 2 }}>
              {type}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Button onClick={onRefresh} variant="contained" color="primary">
        Refresh notifications
      </Button>
    </Box>
  );
}
