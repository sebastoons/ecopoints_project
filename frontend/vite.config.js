import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logos/*.png', 'logos/*.svg'], // Asegura que incluya tus logos
      manifest: {
        name: 'EcoPoints',
        short_name: 'EcoPoints',
        description: 'App de Reciclaje y Puntos',
        theme_color: '#1ea880',
        background_color: '#ffffff',
        display: 'standalone', /* ESTO ES CLAVE: Elimina la barra del navegador */
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logos/logo-auth.png', /* Usamos tu logo existente */
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logos/logo-auth.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  css: {
    devSourcemap: true,
  },
})