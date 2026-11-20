import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, Protegida, useAuth } from '../auth';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { renderConSesion, simularApi, USUARIOS } from './utils';

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

  it('sin señal mantiene la sesión ya verificada (RNF-006)', async () => {
    sessionStorage.setItem('eco_token', 'vigente');
    sessionStorage.setItem('eco_usuario', JSON.stringify(USUARIOS.CONDUCTOR));
    simularApi({ '/auth/me': () => { throw new TypeError('Failed to fetch'); } });
    render(<AuthProvider><MemoryRouter><Protegida><p>Privado</p></Protegida></MemoryRouter></AuthProvider>);
    expect(await screen.findByText('Privado')).toBeInTheDocument();
    expect(sessionStorage.getItem('eco_token')).toBe('vigente');
  });

  it('sin señal y sin usuario verificado antes, pide iniciar sesión', async () => {
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
    expect(sessionStorage.getItem('eco_usuario')).toBeNull();
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
    expect(menu).toHaveTextContent('Mi ruta');
    expect(menu).toHaveTextContent('Encuesta SUS');
  });
});
