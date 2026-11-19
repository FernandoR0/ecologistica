import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, apiPaginado, del, post, put } from '../api';

const POR_PAGINA = 12;

export interface Campo {
  nombre: string;
  etiqueta: string;
  tipo?: 'text' | 'number' | 'time' | 'select' | 'checkbox';
  /** Opciones de un select: texto simple o pares valor/etiqueta (por ejemplo, clientes). */
  opciones?: (string | { valor: string | number; etiqueta: string })[];
  /** El select guarda un número (por ejemplo, un ID). */
  numerico?: boolean;
  ayuda?: string;
  requerido?: boolean;
  soloCrear?: boolean;
  paso?: string;
}

interface Props {
  titulo: string;
  ruta: string;
  campos: Campo[];
  columnas: { campo: string; etiqueta: string }[];
  puedeEditar: boolean;
  borrarTexto?: string;
}

type Fila = Record<string, unknown> & { id: number };

/** Página genérica de listado + formulario de alta/edición. */
export function CrudPage({ titulo, ruta, campos, columnas, puedeEditar, borrarTexto = 'Desactivar' }: Props) {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [editando, setEditando] = useState<Fila | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [error, setError] = useState('');
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const cargar = useCallback(() => {
    apiPaginado<Fila>(ruta, pagina, POR_PAGINA)
      .then((r) => {
        setFilas(r.datos);
        setTotal(r.total);
      })
      .catch((e) => setError(e.message));
  }, [ruta, pagina]);
  useEffect(cargar, [cargar]);

  const abrir = async (fila: Fila | null) => {
    setError('');
    if (!fila) {
      setEditando(null);
      setForm(Object.fromEntries(campos.map((c) => [c.nombre, c.tipo === 'checkbox' ? true : ''])));
      return;
    }
    // El listado trae solo columnas resumidas; para editar se pide el registro completo
    try {
      const completo = await api<Fila>(`${ruta}/${fila.id}`);
      setEditando(completo);
      setForm(completo);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const datos: Record<string, unknown> = {};
    for (const c of campos) {
      if (editando && c.soloCrear) continue;
      const v = form[c.nombre];
      if (v === '' || v === undefined || v === null) continue;
      datos[c.nombre] = c.tipo === 'number' || c.numerico ? Number(v) : v;
    }
    try {
      if (editando) await put(`${ruta}/${editando.id}`, datos);
      else await post(ruta, datos);
      setForm({});
      setEditando(null);
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const borrar = async (id: number) => {
    if (!confirm(`¿${borrarTexto} el registro ${id}?`)) return;
    await del(`${ruta}/${id}`).catch((e) => setError(e.message));
    cargar();
  };

  const formAbierto = Object.keys(form).length > 0;

  return (
    <section>
      <header className="fila-titulo">
        <h1>{titulo}</h1>
        {puedeEditar && <button onClick={() => abrir(null)}>+ Nuevo</button>}
      </header>
      {error && <p className="error" role="alert">{error}</p>}

      {formAbierto && (
        <form className="tarjeta form-grid" onSubmit={guardar} aria-label={`Formulario ${titulo}`}>
          {campos.map((c) => (
            <label key={c.nombre} title={c.ayuda}>
              {c.etiqueta}
              {c.tipo === 'select' ? (
                <select
                  value={String(form[c.nombre] ?? '')}
                  required={c.requerido}
                  disabled={!!editando && c.soloCrear}
                  onChange={(e) => setForm({ ...form, [c.nombre]: e.target.value })}
                >
                  <option value="">—</option>
                  {c.opciones?.map((o) =>
                    typeof o === 'string'
                      ? <option key={o}>{o}</option>
                      : <option key={o.valor} value={o.valor}>{o.etiqueta}</option>,
                  )}
                </select>
              ) : c.tipo === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={!!form[c.nombre]}
                  onChange={(e) => setForm({ ...form, [c.nombre]: e.target.checked })}
                />
              ) : (
                <input
                  type={c.tipo ?? 'text'}
                  step={c.paso}
                  value={String(form[c.nombre] ?? '')}
                  required={c.requerido && !editando}
                  disabled={!!editando && c.soloCrear}
                  onChange={(e) => setForm({ ...form, [c.nombre]: e.target.value })}
                />
              )}
            </label>
          ))}
          <div className="acciones">
            <button type="submit">Guardar</button>
            <button type="button" className="secundario" onClick={() => setForm({})}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              {columnas.map((c) => <th key={c.campo}>{c.etiqueta}</th>)}
              {puedeEditar && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>
                {columnas.map((c) => <td key={c.campo}>{formatear(f[c.campo])}</td>)}
                {puedeEditar && (
                  <td className="acciones">
                    <button className="secundario" onClick={() => abrir(f)}>Editar</button>
                    <button className="peligro" onClick={() => borrar(f.id)}>{borrarTexto}</button>
                  </td>
                )}
              </tr>
            ))}
            {filas.length === 0 && (
              <tr><td colSpan={columnas.length + 1} className="muted">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {total > POR_PAGINA && (
        <nav className="paginacion" aria-label="Paginación">
          <button className="secundario" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {pagina} de {paginas} · {total} registros</span>
          <button className="secundario" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
        </nav>
      )}
    </section>
  );
}

export function formatear(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}
