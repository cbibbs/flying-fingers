import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "Flying Fingers",
  version: pkg.version,
  description: "Typing speed tracker with ranks and practice passages.",
  action: {
    default_popup: "src/ui/popup/index.html",
  },
  options_page: "src/ui/options/index.html",
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content-script.ts"],
    },
  ],
  permissions: ["activeTab", "scripting", "storage"],
  host_permissions: ["https://docs.google.com/*"],
});
