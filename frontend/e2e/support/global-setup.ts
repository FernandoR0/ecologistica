import { rmSync } from 'node:fs';
import { DIR_METRICAS } from './fixtures';

/** Limpia las métricas de la corrida anterior para que el resumen refleje solo esta ejecución. */
export default function globalSetup() {
  rmSync(DIR_METRICAS, { recursive: true, force: true });
}
