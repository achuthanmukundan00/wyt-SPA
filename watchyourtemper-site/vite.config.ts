import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig(({ mode }) => {
  const disableCloudflarePlugin = mode === 'test' || !!process.env.VITEST || process.env.CF_PAGES === '1';

  return {
    plugins: [react(), ...(disableCloudflarePlugin ? [] : [cloudflare()])],
  };
});
