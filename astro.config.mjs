// @ts-check
import { defineConfig, envField } from 'astro/config';
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    output: "server",
    adapter: node({ mode: "standalone" }),
    prefetch: {
        prefetchAll: true,
        defaultStrategy: 'hover',
    },
    env: {
        schema: {
            PUBLIC_AUTH_EMAIL: envField.string({
                context: 'client',
                access: 'public',
                optional: true,
            }),
            PUBLIC_AUTH_PASSWORD: envField.string({
                context: 'client',
                access: 'public',
                optional: true,
            }),
            PUBLIC_AUTH_EMAIL_PROD: envField.string({
                context: 'client',
                access: 'public',
                optional: true,
            }),
            PUBLIC_AUTH_PASSWORD_PROD: envField.string({
                context: 'client',
                access: 'public',
                optional: true,
            }),
        },
    },
});
