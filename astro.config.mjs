// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://yuanqqqqqqq.github.io',
  base: process.env.BASE_PATH ?? '/',
  vite: {
    plugins: [tailwindcss()],
  },
});
