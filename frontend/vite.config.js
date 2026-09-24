import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Workaround tam thoi khi duong dan chua ky tu '#' (vi du LapTrinhWeb2(C#)):
  // Rolldown/Vite cat cu duong dan tai '#', gay loi Pre-transform Failed to load url /src/main.jsx
  // Tat pre-bundling (noDiscovery) de dev server chay duoc.
  // Fix triet de: doi ten thu muc cha thanh LapTrinhWeb2-CSharp roi xoa node_modules + npm install lai.
  // FIX loi cookie parse + createRoot: khi noDiscovery=true, Vite khong tu dong pre-bundle
  // nen phai khai bao thu cong. cookie@1.x la CJS, react-dom/client la subpath export.
  optimizeDeps: {
    noDiscovery: true,
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router',
      'react-router-dom',
      'cookie',
      'set-cookie-parser',
      'axios',
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5293',
        changeOrigin: true,
      },
    },
  },
})
