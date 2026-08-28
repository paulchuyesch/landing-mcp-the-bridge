// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://landing-mcp-the-bridge.vercel.app',
  integrations: [react(), sitemap()],
  output: 'static',
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()]
  }
});
