// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://blogsmanhwa-oppa.vercel.app',
  output: 'static', // <-- ADD THIS
  integrations: [
    mdx(), 
    sitemap(),
    tailwind()
  ]
});
