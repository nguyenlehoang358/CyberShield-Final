import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env file from the current directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'https://localhost:8443',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'wss://localhost:8443',
          ws: true,
          secure: false,
        }
      },
      allowedHosts: [
        'tyler-nonexemplary-attractionally.ngrok-free.dev',
        'localhost',
        '.loca.lt',
        '.trycloudflare.com',
        '.lhr.life',
        '.free.pinggy.link',
        '.ngrok-free.dev'
      ],
      hmr: {
        // Chỉ ép port 443 khi đang chạy qua tunnel (ngrok/pinggy) có trong env
        clientPort: env.VITE_NGROK_BACKEND_URL ? 443 : undefined
      },
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('axios')) return 'vendor-axios';
              return 'vendor'; // Tách các thư viện bên thứ 3
            }
            if (id.includes('src/pages/Lab')) {
              return 'lab-pages'; // Tách riêng phần Lab nặng nhất
            }
          }
        }
      }
    }
  }
})
