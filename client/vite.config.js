import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true, // bereikbaar via LAN IP
    port: 5173,
    proxy: {
      '/token': 'http://localhost:3001',
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        host: 'host.html',
        watch: 'watch.html',
      },
    },
  },
})