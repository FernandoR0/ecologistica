import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api, ApiError, post, tokenStore, type Rol, type Usuario } from './api';
import { respaldo } from './offline';

const ROLES: readonly Rol[] = ['ADMIN', 'PLANIFICADOR', 'CONDUCTOR', 'AUDITOR'];

/**
 * Sin señal (RNF-006) el usuario se toma del token de sesión que ya tiene el navegador (id, correo y rol), en lugar de
 * guardar otra copia de sus datos. Solo se usa para mostrar las pantallas: la API sigue validando el token en cada
 * petición. Si el token está vencido o no tiene la forma esperada, no hay sesión.
 */
export function usuarioDelToken(token: string | null, ahora = Date.now()): Usuario | null {
  try {
    const carga = token?.split('.')[1];
    if (!carga) return null;
    const datos = JSON.parse(atob(carga.replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    const id = Number(datos.sub);
    const { correo, rol, exp } = datos;
    if (!Number.isInteger(id) || typeof correo !== 'string' || !ROLES.includes(rol as Rol)) return null;
    if (typeof exp === 'number' && exp * 1000 < ahora) return null;
    return { id, correo, nombre: correo, rol: rol as Rol };
  } catch {
    return null;
  }
}

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
      .catch((e) => {
        // Sin señal (RNF-006) se mantiene la sesión con los datos del token vigente; otro error cierra la sesión
        const delToken = usuarioDelToken(tokenStore.get());
        if (e instanceof ApiError && e.status === 0 && delToken) setUsuario(delToken);
        else tokenStore.clear();
      })
      .finally(() => setCargando(false));
  }, []);

  const login = async (correo: string, password: string) => {
    const r = await post<{ access_token: string; usuario: Usuario }>('/auth/login', { correo, password });
    tokenStore.set(r.access_token);
    setUsuario(r.usuario);
  };
  const logout = () => {
    tokenStore.clear();
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
