import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A plain build into dist/, which the repository-root wrangler.jsonc serves as
// the Worker's static assets. No Cloudflare Vite plugin: it emitted a
// dist/wrangler.json naming a different Worker, so `wrangler deploy` run from
// this folder deployed a stray copy of the site. Deploy with ../deploy.sh.
export default defineConfig({
  plugins: [react()],
});
