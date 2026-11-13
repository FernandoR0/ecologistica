import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, Protegida } from './auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Conductores, Pedidos, Preferencias, Vehiculos } from './pages/Gestion';
import { Inicio, SostenibilidadPage } from './pages/Paneles';
import './styles.css';

// El mapa (Leaflet) se carga solo cuando se abre la vista de rutas (Green IT: menos JS inicial)
const Rutas = lazy(() => import('./pages/Rutas').then((m) => ({ default: m.Rutas })));
const GESTION = ['ADMIN', 'PLANIFICADOR'] as const;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protegida><Layout /></Protegida>}>
            <Route index element={<Inicio />} />
            <Route path="rutas" element={<Suspense fallback={<p className="muted">Cargando mapa…</p>}><Rutas /></Suspense>} />
            <Route path="pedidos" element={<Protegida roles={[...GESTION]}><Pedidos /></Protegida>} />
            <Route path="vehiculos" element={<Protegida roles={[...GESTION]}><Vehiculos /></Protegida>} />
            <Route path="conductores" element={<Protegida roles={[...GESTION]}><Conductores /></Protegida>} />
            <Route path="preferencias" element={<Protegida roles={[...GESTION]}><Preferencias /></Protegida>} />
            <Route path="sostenibilidad" element={<SostenibilidadPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
