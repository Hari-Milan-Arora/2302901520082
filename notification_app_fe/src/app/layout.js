import "./globals.css";
import { ThemeRegistry } from "../components/theme-registry.js";
import { SiteHeader } from "../components/site-header.js";

export const metadata = {
  title: "Notification App",
  description: "Campus notification dashboard with priority inbox",
};

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <SiteHeader />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
