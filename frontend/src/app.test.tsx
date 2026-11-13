import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { mensajeError } from './api';
import { AuthProvider } from './auth';
import { formatear } from './components/CrudPage';
import { Login } from './pages/Login';

describe('mensajeError', () => {
  it('devuelve el texto de FastAPI', () => {
    expect(mensajeError('Credenciales inválidas', 401)).toBe('Credenciales inválidas');
  });
  it('resume errores de validación 422', () => {
    expect(mensajeError([{ loc: ['body', 'peso_kg'], msg: 'debe ser > 0' }], 422)).toBe('peso_kg: debe ser > 0');
  });
  it('usa el código cuando no hay detalle', () => {
    expect(mensajeError(undefined, 500)).toBe('Error 500');
  });
});

describe('formatear', () => {
  it('muestra booleanos y vacíos de forma legible', () => {
    expect(formatear(true)).toBe('Sí');
    expect(formatear(null)).toBe('—');
    expect(formatear(12)).toBe('12');
  });
});

describe('Login', () => {
  it('muestra el formulario accesible', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(screen.getByRole('form', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByLabelText('Correo')).toBeRequired();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });
});
