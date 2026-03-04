import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

if (typeof window !== "undefined") {
  const { pathname, searchParams } = new URL(window.location.href);
  const staticBase = (window as Window & { remotion_staticBase?: string }).remotion_staticBase;

  const wantsDashboard = pathname === "/layout-dashboard.html" || searchParams.get("dashboard") === "1";
  const wantsTuner = pathname === "/portrait-tuner.html" || searchParams.get("portrait-tuner") === "1";

  if (wantsDashboard && staticBase && !pathname.startsWith(`${staticBase}/`)) {
    window.location.replace(`${staticBase}/layout-dashboard.html`);
  } else if (wantsTuner && staticBase && !pathname.startsWith(`${staticBase}/`)) {
    window.location.replace(`${staticBase}/portrait-tuner.html`);
  }
}

registerRoot(RemotionRoot);
