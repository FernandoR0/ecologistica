import { defineConfig, devices } from '@playwright/test';

/**
 * Suite E2E y de monitoreo de EcoLogística (Inspección 5 - Sprint 4).
 *
 * - Local / CI: Playwright levanta la API real (FastAPI + base aislada *test*) y el build de producción
 *   con `vite preview`, que reenvía `/api` a la API.
 * - Producción: con E2E_BASE_URL solo corren las pruebas `@public` (no inician sesión ni escriben datos).
 */
const externo = process.env.E2E_BASE_URL;
const puertoApi = process.env.E2E_API_PORT ?? '8010';
const python = process.env.E2E_PYTHON ?? 'python';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/support/global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Un solo worker: los tres navegadores comparten la misma base y el plan de rutas usa todos los pedidos pendientes
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  grep: externo ? /@public/ : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: externo ?? 'http://127.0.0.1:4173',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // En Windows la ruta del video de WebKit supera 260 caracteres: solo se graba en CI (Linux)
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: externo
    ? undefined
    : [
        {
          command: `${python} -m scripts.servidor_e2e`,
          cwd: '../backend',
          url: `http://127.0.0.1:${puertoApi}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: { E2E_API_PORT: puertoApi },
        },
        {
          command: process.env.E2E_SKIP_BUILD ? 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort' : 'npm run build:e2e && npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
          url: 'http://127.0.0.1:4173',
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          env: { E2E_API_URL: `http://127.0.0.1:${puertoApi}`, VITE_API_URL: '/api' },
        },
      ],
});
