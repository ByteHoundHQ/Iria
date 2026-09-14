// @ts-check
import { defineConfig, envField } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    env: {
        schema: {
            PUBLIC_AUTH_EMAIL: envField.string({
                context: 'client',
                access: 'public',
            }),
            PUBLIC_AUTH_PASSWORD: envField.string({
                context: 'client',
                access: 'public',
            }),
        },
    },
});
