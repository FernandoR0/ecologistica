/** ENB-007 · Cuestionario SUS (System Usability Scale) dentro de la aplicación. */
import { useEffect, useState, type FormEvent } from 'react';
import { api, post } from '../api';

const TAREAS = [
  'Iniciar sesión con la cuenta de evaluador.',
  'Registrar un cliente con su horario preferido y punto de referencia.',
  'Registrar un pedido para ese cliente.',
  'Generar las rutas optimizadas y revisar el mapa.',
  'Descargar el reporte PDF de sostenibilidad.',
];
const ESCALA = ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'];

export function Encuesta() {
  const [preguntas, setPreguntas] = useState<string[]>([]);
  const [respuestas, setRespuestas] = useState<(number | null)[]>(Array(10).fill(null));
  const [codigo, setCodigo] = useState('');
  const [perfil, setPerfil] = useState('');
  const [tareas, setTareas] = useState<boolean[]>(Array(TAREAS.length).fill(false));
  const [comentario, setComentario] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState<number | null>(null);

  useEffect(() => {
    api<{ preguntas: string[] }>('/sus/preguntas').then((r) => setPreguntas(r.preguntas)).catch((e) => setError(e.message));
  }, []);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const faltante = respuestas.findIndex((r) => r === null);
    if (faltante >= 0) {
      setError(`Falta responder la pregunta ${faltante + 1}.`);
      return;
    }
    try {
      const r = await post<{ puntaje: number }>('/sus', {
        codigo_participante: codigo.toUpperCase(), perfil, respuestas,
        tareas_completadas: tareas.filter(Boolean).length, comentario: comentario || null,
      });
      setEnviado(r.puntaje);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (enviado !== null) {
    return (
      <section>
        <h1>Encuesta de usabilidad</h1>
        <p className="tarjeta" role="status">¡Gracias! Tu respuesta quedó registrada (puntaje SUS {enviado}).</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Encuesta de usabilidad (SUS)</h1>
      <p className="muted">Antes de responder, realiza estas tareas en el sistema y marca las que completaste sin ayuda.</p>
      <form onSubmit={enviar} aria-label="Encuesta SUS">
        <fieldset className="tarjeta">
          <legend>Tareas</legend>
          {TAREAS.map((t, i) => (
            <label key={t} className="opcion">
              <input type="checkbox" checked={tareas[i]} onChange={(e) => setTareas(tareas.map((v, k) => (k === i ? e.target.checked : v)))} />
              T{i + 1}. {t}
            </label>
          ))}
        </fieldset>
        <div className="tarjeta form-grid">
          <label>Código de participante (P1, P2…)
            <input required pattern="[Pp][0-9]{1,3}" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </label>
          <label>Perfil (ocupación y experiencia con apps similares)
            <input required minLength={3} maxLength={60} value={perfil} onChange={(e) => setPerfil(e.target.value)} />
          </label>
        </div>
        {preguntas.map((p, i) => (
          <fieldset key={p} className="tarjeta pregunta">
            <legend>{i + 1}. {p}</legend>
            <div className="escala">
              {ESCALA.map((texto, k) => (
                <label key={texto} className="opcion">
                  <input
                    type="radio" name={`p${i + 1}`} value={k + 1} checked={respuestas[i] === k + 1}
                    onChange={() => setRespuestas(respuestas.map((v, j) => (j === i ? k + 1 : v)))}
                  />
                  {k + 1} · {texto}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label className="tarjeta">Comentario (opcional)
          <textarea maxLength={500} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit">Enviar respuestas</button>
      </form>
    </section>
  );
}
