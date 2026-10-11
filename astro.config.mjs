import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// CHANGE THIS to your real domain (including https://) before you deploy.
// It is used for the sitemap, the RSS feed and canonical links.
const SITE_URL = 'https://fromkiran.com';

export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
  trailingSlash: 'always',
});
