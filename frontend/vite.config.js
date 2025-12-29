import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                // Добавляем timestamp к именам файлов для сброса кеша
                entryFileNames: "assets/[name]-[hash]-".concat(Date.now(), ".js"),
                chunkFileNames: "assets/[name]-[hash]-".concat(Date.now(), ".js"),
                assetFileNames: "assets/[name]-[hash]-".concat(Date.now(), ".[ext]"),
            },
        },
    },
});
