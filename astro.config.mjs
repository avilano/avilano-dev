import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://avilano.dev',
  integrations: [tailwind({ applyBaseStyles: false })],
});
