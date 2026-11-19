import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import type { Rol } from '../api';

const MENU: { a: string; texto: string; roles?: Rol[] }[] = [
  { a: '/', texto: 'Dashboard' },
  { a: '/rutas', texto: 'Rutas', roles: ['ADMIN', 'PLANIFICADOR', 'AUDITOR'] },
  { a: '/mi-ruta', texto: 'Mi ruta', roles: ['CONDUCTOR'] },
  { a: '/pedidos', texto: 'Pedidos', roles: ['ADMIN', 'PLANIFICADOR'] },
  { a: '/vehiculos', texto: 'Flota', roles: ['ADMIN', 'PLANIFICADOR'] },
  { a: '/conductores', texto: 'Conductores', roles: ['ADMIN', 'PLANIFICADOR'] },
  { a: '/clientes', texto: 'Clientes', roles: ['ADMIN', 'PLANIFICADOR'] },
  { a: '/sostenibilidad', texto: 'Sostenibilidad' },
  { a: '/administracion', texto: 'Administración', roles: ['ADMIN', 'AUDITOR'] },
  { a: '/encuesta', texto: 'Encuesta SUS' },
];

export function Layout() {
  const { usuario, logout } = useAuth();
  return (
    <div className="app">
      <nav className="lateral" aria-label="Menú principal">
        <div className="marca">🌿 EcoLogística</div>
        {MENU.filter((m) => !m.roles || (usuario && m.roles.includes(usuario.rol))).map((m) => (
          <NavLink key={m.a} to={m.a} end={m.a === '/'}>
            {m.texto}
          </NavLink>
        ))}
        <div className="usuario">
          <small>{usuario?.nombre} · {usuario?.rol}</small>
          <button className="secundario" onClick={logout}>Salir</button>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
