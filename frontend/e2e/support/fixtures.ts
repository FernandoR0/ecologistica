import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

/** Usuarios de demostración que crea `python -m app.seed` en la base aislada de pruebas. */
export const USUARIOS = {
  admin: { correo: 'admin@ecologistica.pe', password: 'Admin123*' },
  planificador: { correo: 'planificador@ecologistica.pe', password: 'Plan123*' },
  conductor: { correo: 'conductor@ecologistica.pe', password: 'Cond123*' },
  auditor: { correo: 'auditor@ecologistica.pe', password: 'Audi123*' },
};
export type Perfil = keyof typeof USUARIOS;

export const API = process.env.E2E_API_URL ? `${process.env.E2E_API_URL}/api` : '/api';
export const DIR_METRICAS = join('test-results', 'metricas');

/** Código único por navegador y ejecución: los tres navegadores escriben en la misma base sin chocar. */
export function unico(prefijo: string, info: TestInfo): string {
  const navegador = info.project.name.slice(0, 2).toUpperCase();
  return `${prefijo}-${navegador}${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

export async function iniciarSesion(page: Page, perfil: Perfil = 'planificador') {
  const u = USUARIOS[perfil];
  await page.goto('/login');
  await page.getByLabel('Correo').fill(u.correo);
  await page.getByLabel('Contraseña').fill(u.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('navigation', { name: 'Menú principal' })).toBeVisible();
}

export async function irA(page: Page, menu: string, titulo: string | RegExp) {
  await page.getByRole('navigation', { name: 'Menú principal' }).getByRole('link', { name: menu }).click();
  await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
}

/** Token de la API para preparar datos o verificar el resultado de un flujo por fuera de la interfaz. */
export async function tokenApi(request: APIRequestContext, perfil: Perfil = 'admin'): Promise<Record<string, string>> {
  const r = await request.post(`${API}/auth/login`, { data: USUARIOS[perfil] });
  expect(r.status()).toBe(200);
  return { Authorization: `Bearer ${(await r.json()).access_token}` };
}

/** Guarda una medición en test-results/metricas para el informe (03 Analisis PlayWrigth). */
export function registrarMetrica(info: TestInfo, nombre: string, datos: Record<string, unknown>) {
  mkdirSync(DIR_METRICAS, { recursive: true });
  const archivo = join(DIR_METRICAS, `${info.project.name}-${nombre}.json`);
  const registro = { navegador: info.project.name, prueba: nombre, entorno: process.env.E2E_BASE_URL ?? 'local', ...datos };
  writeFileSync(archivo, JSON.stringify(registro, null, 2));
  return registro;
}

export function percentil(valores: number[], p: number): number {
  const orden = [...valores].sort((a, b) => a - b);
  return orden[Math.min(orden.length - 1, Math.ceil((p / 100) * orden.length) - 1)];
}
