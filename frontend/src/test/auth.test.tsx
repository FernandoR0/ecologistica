import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, Protegida, useAuth, usuarioDelToken } from '../auth';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { renderConSesion, simularApi, USUARIOS } from './utils';

/** Token con la forma de un JWT (cabecera.carga.firma); la firma no se verifica en el navegador. */
const tokenFalso = (carga: Record<string, unknown>) =>
  `e30.${btoa(JSON.stringify(carga)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.firma`;

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('sesión y rutas protegidas', () => {
  it('sin sesión, una ruta protegida redirige al login', () => {
    simularApi({});
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Protegida><p>Privado</p></Protegida>} />
            <Route path="/login" element={<p>Pantalla de login</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('con sesión válida muestra el contenido', async () => {
    renderConSesion(<Protegida><p>Privado</p></Protegida>, 'ADMIN');
    expect(await screen.findByText('Privado')).toBeInTheDocument();
  });

  it('bloquea a un rol sin permiso', async () => {
    renderConSesion(<Protegida roles={['ADMIN']}><p>Privado</p></Protegida>, 'CONDUCTOR');
    expect(await screen.findByText('No tiene permisos para ver esta sección.')).toBeInTheDocument();
  });

  it('si /auth/me falla, se borra el token', async () => {
    sessionStorage.setItem('eco_token', 'vencido');
    simularApi({ '/auth/me': { status: 500, body: {} } });
    render(<AuthProvider><MemoryRouter><Protegida><p>Privado</p></Protegida></MemoryRouter></AuthProvider>);
    await waitFor(() => expect(sessionStorage.getItem('eco_token')).toBeNull());
  });

  it('sin señal mantiene la sesión con los datos del token vigente (RNF-006)', async () => {
    const vigente = tokenFalso({ sub: '3', correo: 'cond@ecologistica.pe', rol: 'CONDUCTOR', exp: Date.now() / 1000 + 3600 });
    sessionStorage.setItem('eco_token', vigente);
    simularApi({ '/auth/me': () => { throw new TypeError('Failed to fetch'); } });
    render(<AuthProvider><MemoryRouter><Protegida roles={['CONDUCTOR']}><p>Privado</p></Protegida></MemoryRouter></AuthProvider>);
    expect(await screen.findByText('Privado')).toBeInTheDocument();
    expect(sessionStorage.getItem('eco_token')).toBe(vigente);
  });

  it('lee el usuario del token y rechaza tokens vencidos, mal formados o con un rol desconocido', () => {
    const ahora = Date.UTC(2026, 10, 20);
    const datos = { sub: '3', correo: 'cond@ecologistica.pe', rol: 'CONDUCTOR', exp: ahora / 1000 + 60 };
    expect(usuarioDelToken(tokenFalso(datos), ahora)).toEqual({
      id: 3, correo: 'cond@ecologistica.pe', nombre: 'cond@ecologistica.pe', rol: 'CONDUCTOR',
    });
    expect(usuarioDelToken(tokenFalso({ ...datos, exp: ahora / 1000 - 60 }), ahora)).toBeNull();
    expect(usuarioDelToken(tokenFalso({ ...datos, rol: 'SUPERUSUARIO' }), ahora)).toBeNull();
    expect(usuarioDelToken(tokenFalso({ ...datos, sub: 'x' }), ahora)).toBeNull();
    expect(usuarioDelToken('sin-puntos', ahora)).toBeNull();
    expect(usuarioDelToken('a.@@@.c', ahora)).toBeNull();
    expect(usuarioDelToken(null, ahora)).toBeNull();
  });

  it('sin señal y sin un token válido, pide iniciar sesión', async () => {
    sessionStorage.setItem('eco_token', 'vigente');
    simularApi({ '/auth/me': () => { throw new TypeError('Failed to fetch'); } });
    render(<AuthProvider><MemoryRouter><Protegida><p>Privado</p></Protegida></MemoryRouter></AuthProvider>);
    await waitFor(() => expect(sessionStorage.getItem('eco_token')).toBeNull());
    expect(screen.queryByText('Privado')).not.toBeInTheDocument();
  });

  it('useAuth fuera del proveedor lanza un error claro', () => {
    const Sonda = () => {
      useAuth();
      return null;
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Sonda />)).toThrow('useAuth debe usarse dentro de AuthProvider');
  });
});

describe('Login', () => {
  const renderLogin = () =>
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<p>Inicio</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

  it('inicia sesión, guarda el token y entra al sistema', async () => {
    const f = simularApi({ 'POST /auth/login': { body: { access_token: 'nuevo', usuario: USUARIOS.PLANIFICADOR } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Correo'), 'plan@ecologistica.pe');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Plan123*');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Inicio')).toBeInTheDocument();
    expect(sessionStorage.getItem('eco_token')).toBe('nuevo');
    expect(JSON.parse(String(f.mock.calls[0][1]?.body))).toEqual({ correo: 'plan@ecologistica.pe', password: 'Plan123*' });
  });

  it('muestra el error cuando las credenciales son inválidas', async () => {
    simularApi({ 'POST /auth/login': { status: 401, body: { detail: 'Credenciales inválidas' } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Correo'), 'x@x.pe');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  });
});

describe('Layout', () => {
  it('el planificador ve los menús de gestión y puede salir', async () => {
    renderConSesion(
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>Contenido</p>} />
        </Route>
      </Routes>,
      'PLANIFICADOR',
    );
    const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
    expect(menu).toHaveTextContent('Pedidos');
    expect(menu).toHaveTextContent('Flota');
    localStorage.setItem('eco_mi_ruta', '{"rutas":[],"guardadaEn":"2026-11-20T10:00:00Z"}');
    localStorage.setItem('eco_entregas_pendientes', '[]');
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(sessionStorage.getItem('eco_token')).toBeNull();
    // Ley 29733: al salir no quedan datos de clientes guardados en el dispositivo
    expect(localStorage.getItem('eco_mi_ruta')).toBeNull();
    expect(localStorage.getItem('eco_entregas_pendientes')).toBeNull();
  });

  it('el conductor no ve los menús de gestión', async () => {
    renderConSesion(
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>Contenido</p>} />
        </Route>
      </Routes>,
      'CONDUCTOR',
    );
    const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
    await screen.findByText(/Luis/);
    expect(menu).not.toHaveTextContent('Pedidos');
    expect(menu).not.toHaveTextContent('Dashboard');
    expect(menu).toHaveTextContent('Mi ruta');
    expect(menu).toHaveTextContent('Encuesta SUS');
  });

  it('en celular el menú se abre con un botón y se cierra al elegir una opción', async () => {
    renderConSesion(
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>Contenido</p>} />
          <Route path="pedidos" element={<p>Pantalla de pedidos</p>} />
        </Route>
      </Routes>,
      'PLANIFICADOR',
    );
    const menu = await screen.findByRole('navigation', { name: 'Menú principal' });
    const boton = screen.getByRole('button', { name: '☰ Menú' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    expect(boton).toHaveAttribute('aria-controls', 'enlaces-menu');
    await userEvent.click(boton);
    expect(menu).toHaveClass('abierto');
    expect(screen.getByRole('button', { name: '✕ Cerrar' })).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('link', { name: 'Pedidos' }));
    expect(await screen.findByText('Pantalla de pedidos')).toBeInTheDocument();
    expect(menu).not.toHaveClass('abierto');
  });
});
