import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'PubliService',
        short_name: 'PubliService',
        description: 'Gestion des publications et des distributions',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        id: '/',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,webmanifest}',
        ],
        globIgnores: [
          '**/icon-192.png',
          '**/icon-512.png',
          '**/manifest.webmanifest',
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
})
