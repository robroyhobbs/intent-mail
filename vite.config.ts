import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createBlockletPlugin } from 'vite-plugin-blocklet';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [react(), createBlockletPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@lib': path.resolve(__dirname, 'lib'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:3030',
          changeOrigin: true,
        },
      },
    },
  };
});
