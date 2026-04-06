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
        // Removed ngrok forced 443 port to prevent UI freeze on tunnel death
        clientPort: undefined
      },
      host: true,
    }
  }
})
