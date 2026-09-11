import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Porta em que o frontend é servido durante o desenvolvimento. */
const PORTA_FRONTEND = 5173;

/** Endereço do backend local que conversa com o provedor. */
const URL_BACKEND = "http://127.0.0.1:3001";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            src: path.resolve(__dirname, "src"),
        },
    },
    server: {
        port: PORTA_FRONTEND,
        strictPort: false,
        proxy: {
            "/api": {
                target: URL_BACKEND,
                changeOrigin: false,
            },
        },
    },
});
