import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api, ApiError, post, tokenStore, type Rol, type Usuario } from './api';
import { respaldo } from './offline';

const CLAVE_USUARIO = 'eco_usuario';
const usuarioGuardado = (): Usuario | null => {
  try {
    const v = sessionStorage.getItem(CLAVE_USUARIO);
    return v ? (JSON.parse(v) as Usuario) : null;
  } catch {
    return null;
  }
};
const guardarUsuario = (u: Usuario | null) => {
  try {
    if (u) sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    else sessionStorage.removeItem(CLAVE_USUARIO);
  } catch {
    // almacenamiento bloqueado: solo se pierde el respaldo sin conexión
  }
};

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
      .then((u) => {
        setUsuario(u);
        guardarUsuario(u);
      })
      .catch((e) => {
        // Sin señal (RNF-006) se mantiene la sesión con el usuario ya verificado; otro error cierra la sesión
        const guardado = usuarioGuardado();
        if (e instanceof ApiError && e.status === 0 && guardado) setUsuario(guardado);
        else tokenStore.clear();
      })
      .finally(() => setCargando(false));
  }, []);

  const login = async (correo: string, password: string) => {
    const r = await post<{ access_token: string; usuario: Usuario }>('/auth/login', { correo, password });
    tokenStore.set(r.access_token);
    guardarUsuario(r.usuario);
    setUsuario(r.usuario);
  };
  const logout = () => {
    tokenStore.clear();
    guardarUsuario(null);
    // Ley 29733: la ruta guardada (nombres y direcciones de clientes) no queda en el celular al salir
    respaldo.limpiar();
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
