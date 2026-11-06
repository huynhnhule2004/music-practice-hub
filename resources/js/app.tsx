import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import { ThemeProvider } from './Components/ThemeProvider';

const appName = import.meta.env.VITE_APP_NAME || 'MusicHub';

type PageModule = { default: ComponentType };
const pages = import.meta.glob<PageModule>('./Pages/**/*.tsx');

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    resolve: async (name) => {
        const page = pages[`./Pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Page not found: ./Pages/${name}.tsx`);
        }

        return (await page()).default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider defaultTheme="system" storageKey="musichub-theme">
                <App {...props} />
            </ThemeProvider>,
        );
    },
    progress: {
        color: 'hsl(230 72% 50%)',
    },
});
