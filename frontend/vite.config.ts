import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      // The browser only talks to Vite; /api is forwarded to the ASP.NET Core backend.
      // Frontend and API then share one address, so the login cookie (HttpOnly, SameSite=Strict) just works.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5165',
          changeOrigin: false,
        },
        '/uploads': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:5165',
          changeOrigin: false,
        },
      },
    },
  }
})
