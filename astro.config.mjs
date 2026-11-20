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
            PUBLIC_SUPABASE_URL: envField.string({
                context: 'client',
                access: 'public',
            }),
            PUBLIC_SUPABASE_PUBLISHABLE_KEY: envField.string({
                context: 'client',
                access: 'public',
            }),
        },
    },
});
