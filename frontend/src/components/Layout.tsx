import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import type { Rol } from '../api';

const MENU: { a: string; texto: string; roles?: Rol[] }[] = [
  // El conductor entra directo a "Mi ruta" (modo conductor, RNF-05 del caso)
  { a: '/', texto: 'Dashboard', roles: ['ADMIN', 'PLANIFICADOR', 'AUDITOR'] },
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
  // En celular el menú se pliega detrás de un botón para no ocupar la pantalla
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="app">
      <nav className={`lateral${abierto ? ' abierto' : ''}`} aria-label="Menú principal">
        <div className="barra-superior">
          <div className="marca">🌿 EcoLogística</div>
          <button
            type="button" className="boton-menu" aria-expanded={abierto} aria-controls="enlaces-menu"
            onClick={() => setAbierto(!abierto)}
          >
            {abierto ? '✕ Cerrar' : '☰ Menú'}
          </button>
        </div>
        <div id="enlaces-menu" className="enlaces-menu">
          {MENU.filter((m) => !m.roles || (usuario && m.roles.includes(usuario.rol))).map((m) => (
            <NavLink key={m.a} to={m.a} end={m.a === '/'} onClick={() => setAbierto(false)}>
              {m.texto}
            </NavLink>
          ))}
          <div className="usuario">
            <small>{usuario?.nombre} · {usuario?.rol}</small>
            <button className="secundario" onClick={logout}>Salir</button>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
