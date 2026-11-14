/// <reference types="vitest/config" />
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Genera versiones .gz y .br de los archivos de texto del build para que el servidor
// los entregue ya comprimidos (sin gastar CPU comprimiendo en cada visita).
function precomprimir(): Plugin {
  return {
    name: 'precomprimir',
    apply: 'build',
    closeBundle() {
      const recorrer = (dir: string) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const ruta = join(dir, e.name);
          if (e.isDirectory()) recorrer(ruta);
          else if (/\.(js|css|html|svg|json)$/.test(e.name)) {
            const datos = readFileSync(ruta);
            if (datos.length < 1024) continue;
            writeFileSync(`${ruta}.gz`, gzipSync(datos, { level: 9 }));
            writeFileSync(`${ruta}.br`, brotliCompressSync(datos, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
          }
        }
      };
      recorrer('dist');
    },
  };
}

export default defineConfig({
  plugins: [react(), precomprimir()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // React y el router van en un archivo aparte: cambian poco y el navegador los mantiene en cache
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/.test(id)) return 'react';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: { reporter: ['text', 'lcov'], include: ['src/**'], exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/setupTests.ts', 'src/vite-env.d.ts', 'src/main.tsx'] },
  },
});
