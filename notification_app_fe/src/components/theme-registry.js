"use client";

import { CssBaseline, ThemeProvider, createTheme, GlobalStyles } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#114b5f",
    },
    secondary: {
      main: "#f3a712",
    },
    background: {
      default: "#eef3f8",
      paper: "rgba(255, 255, 255, 0.82)",
    },
    text: {
      primary: "#102a43",
      secondary: "#52606d",
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: [
      "Inter",
      "Segoe UI",
      "Arial",
      "sans-serif",
    ].join(","),
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.03em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(16px)",
          boxShadow: "0 18px 55px rgba(15, 23, 42, 0.08)",
        },
      },
    },
  },
});

export function ThemeRegistry({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            overflowX: "hidden",
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
}
