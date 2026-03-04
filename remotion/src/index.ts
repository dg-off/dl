import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

if (typeof window !== "undefined") {
  const { pathname, searchParams } = new URL(window.location.href);
  const wantsDashboard = pathname === "/layout-dashboard.html" || searchParams.get("dashboard") === "1";
  const staticBase = (window as Window & { remotion_staticBase?: string }).remotion_staticBase;

  if (wantsDashboard && staticBase && !pathname.startsWith(`${staticBase}/`)) {
    window.location.replace(`${staticBase}/layout-dashboard.html`);
  }
}

registerRoot(RemotionRoot);
