import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Close, MusicNote } from './Icons.jsx';

export default function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await api.login({ email, password })
          : await api.register({ name, email, password });
      onSuccess(data);
    } catch (submitError) {
      setError(submitError.message || 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setPassword('');
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button
          type="button"
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <Close size={20} />
        </button>

        <div className="modal-brand">
          <span className="brand-mark">
            <MusicNote size={22} />
          </span>
          <span>Tarara Music</span>
        </div>

        <h2 id="auth-title">
          {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
        </h2>
        <p className="modal-subtitle">
          {mode === 'login'
            ? 'Inicia sesión para guardar favoritos y listas.'
            : 'Guarda tus canciones favoritas y crea listas a tu medida.'}
        </p>

        <div className="auth-tabs" role="tablist" aria-label="Tipo de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => switchMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => switchMode('register')}
          >
            Registrarme
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label className="field">
              <span>Nombre</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                placeholder="Tu nombre"
                required
                minLength={2}
                maxLength={60}
              />
            </label>
          ) : null}

          <label className="field">
            <span>Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="tu@correo.com"
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
              required
              minLength={mode === 'register' ? 8 : undefined}
            />
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading
              ? 'Procesando…'
              : mode === 'login'
                ? 'Entrar a Tarara Music'
                : 'Crear cuenta'}
          </button>
        </form>

        <p className="modal-footnote">
          Las contraseñas se almacenan cifradas con bcrypt.
        </p>
      </div>
    </div>
  );
}
