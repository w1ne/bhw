import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://bhw.hu',
  output: 'static',
  integrations: [
    sitemap({
      // /founding/ repeats the homepage #join section and has no nav link.
      filter: (page) => page !== 'https://bhw.hu/founding/',
    }),
  ],
});
