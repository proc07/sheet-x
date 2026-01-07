import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const primevueRoot = path.resolve(rootDir, 'node_modules/primevue');
const primevueComponents = new Set<string>();

try {
  for (const entry of fs.readdirSync(primevueRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (!name || name.startsWith('.')) continue;
    const indexFile = path.join(primevueRoot, name, 'index.mjs');
    if (fs.existsSync(indexFile)) {
      primevueComponents.add(name);
    }
  }
} catch {
  // node_modules may not be present during initial install.
}

export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: 'src/components.d.ts',
      resolvers: [
        (name) => {
          const lookup = name.toLowerCase();
          if (!primevueComponents.has(lookup)) return;
          return `primevue/${lookup}`;
        },
      ],
    }),
  ],
  server: {
    port: 5173,
  },
});
