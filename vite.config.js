import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_N8N_PROXY_TARGET ||
    'https://clic-et-moi.app.n8n.cloud/webhook/prod-soscyber'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/ernest/voice': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: () => '',
        },
      },
    },
  }
})
