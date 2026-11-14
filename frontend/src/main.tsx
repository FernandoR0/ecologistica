import { StrictMode, lazy, Suspense, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, Protegida } from './auth';
import { Login } from './pages/Login';
import './styles.css';

// Solo el login se carga de entrada. Cada pantalla se descarga cuando el usuario entra a ella
// y el mapa (Leaflet) solo cuando se abre "Rutas".
const Layout = lazy(() => import('./components/Layout').then((m) => ({ default: m.Layout })));
const Inicio = lazy(() => import('./pages/Paneles').then((m) => ({ default: m.Inicio })));
const SostenibilidadPage = lazy(() => import('./pages/Paneles').then((m) => ({ default: m.SostenibilidadPage })));
const Rutas = lazy(() => import('./pages/Rutas').then((m) => ({ default: m.Rutas })));
const Pedidos = lazy(() => import('./pages/Gestion').then((m) => ({ default: m.Pedidos })));
const Vehiculos = lazy(() => import('./pages/Gestion').then((m) => ({ default: m.Vehiculos })));
const Conductores = lazy(() => import('./pages/Gestion').then((m) => ({ default: m.Conductores })));
const Preferencias = lazy(() => import('./pages/Gestion').then((m) => ({ default: m.Preferencias })));

const GESTION = ['ADMIN', 'PLANIFICADOR'] as const;
const cargando = (texto: string, hijo: ReactNode) => (
  <Suspense fallback={<p className="muted">{texto}</p>}>{hijo}</Suspense>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protegida>{cargando('Cargando…', <Layout />)}</Protegida>}>
            <Route index element={cargando('Cargando indicadores…', <Inicio />)} />
            <Route path="rutas" element={cargando('Cargando mapa…', <Rutas />)} />
            <Route path="pedidos" element={<Protegida roles={[...GESTION]}>{cargando('Cargando pedidos…', <Pedidos />)}</Protegida>} />
            <Route path="vehiculos" element={<Protegida roles={[...GESTION]}>{cargando('Cargando flota…', <Vehiculos />)}</Protegida>} />
            <Route path="conductores" element={<Protegida roles={[...GESTION]}>{cargando('Cargando conductores…', <Conductores />)}</Protegida>} />
            <Route path="preferencias" element={<Protegida roles={[...GESTION]}>{cargando('Cargando preferencias…', <Preferencias />)}</Protegida>} />
            <Route path="sostenibilidad" element={cargando('Cargando reporte…', <SostenibilidadPage />)} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
