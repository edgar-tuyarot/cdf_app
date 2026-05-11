import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'CDF App',
        short_name: 'CDFApp',
        description: 'Gestión de Producción y Pedidos',
        theme_color: '#E65100',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    allowedHosts: [
      'cdf.envioslibres.lat'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Para empaquetar con Spring Boot en un solo .jar:
    // Cambia esta ruta relativa para que apunte a la carpeta 'static' de tu proyecto Spring Boot.
    // Ejemplo: outDir: '../../mi-backend-springboot/src/main/resources/static'
    outDir: 'dist', // <- Reemplazar 'dist' por la ruta hacia resources/static de Spring Boot
    emptyOutDir: true, // Vacía la carpeta antes de construir
  }
})
