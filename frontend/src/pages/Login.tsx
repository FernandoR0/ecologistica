import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await login(correo, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="login">
      <form className="tarjeta" onSubmit={enviar} aria-label="Iniciar sesión">
        <h1>🌿 EcoLogística</h1>
        <p className="muted">Rutas sostenibles de última milla · DistriRápido S.A.C.</p>
        <label>
          Correo
          <input type="email" autoComplete="username" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </main>
  );
}
