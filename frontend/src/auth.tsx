import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api, post, tokenStore, type Rol, type Usuario } from './api';

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(!!tokenStore.get());

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<Usuario>('/auth/me')
      .then(setUsuario)
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false));
  }, []);

  const login = async (correo: string, password: string) => {
    const r = await post<{ access_token: string; usuario: Usuario }>('/auth/login', { correo, password });
    tokenStore.set(r.access_token);
    setUsuario(r.usuario);
  };
  const logout = () => {
    tokenStore.clear();
    setUsuario(null);
  };

  return <Ctx.Provider value={{ usuario, cargando, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return c;
}

export function Protegida({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <p className="muted">Cargando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <p className="error">No tiene permisos para ver esta sección.</p>;
  return <>{children}</>;
}
