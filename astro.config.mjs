import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "http://localhost:4321" /** Change this to production URL */,
  output: "server",
  integrations: [tailwind(), react()],
});
