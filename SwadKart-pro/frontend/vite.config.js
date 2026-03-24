import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
        devOptions: {
          enabled: true,
        },
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
          navigateFallbackDenylist: [/^\/api/, /^\/socket.io/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api"),
              handler: "NetworkOnly",
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/socket.io"),
              handler: "NetworkOnly",
            },
          ],
        },
        manifest: {
          name: "SwadKart - Taste Delivered",
          short_name: "SwadKart",
          description: "Order premium food online with SwadKart Pro",
          theme_color: "#ff6b6b",
          background_color: "#030712",
          display: "standalone",
          orientation: "portrait",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 2000,
    },
    server: {
      port: 5173,
      host: true, 
      https: false, // ปิด HTTPS เพื่อให้เข้าผ่าน http://localhost ได้ปกติ
      proxy: {
        "/api": {
          target: "http://localhost:4000", // เชื่อมไปที่ Backend พอร์ต 4000
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: "http://localhost:4000",
          ws: true,
        },
      },
    },
  };
});