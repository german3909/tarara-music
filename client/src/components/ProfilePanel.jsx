import { useEffect, useState } from 'react';
import { LogOut, User } from './Icons.jsx';
import { initials } from '../utils/format.js';

export default function ProfilePanel({ user, onSaveInfo, onChangePassword, onLogout }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user.name, user.email]);

  async function handleInfoSubmit(event) {
    event.preventDefault();
    setInfoError('');
    setInfoSuccess('');
    setInfoLoading(true);
    try {
      await onSaveInfo({ name, email });
      setInfoSuccess('Datos actualizados correctamente.');
    } catch (error) {
      setInfoError(error.message || 'No se pudieron guardar los cambios.');
    } finally {
      setInfoLoading(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (password.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setPasswordLoading(true);
    try {
      await onChangePassword({ currentPassword, password });
      setPasswordSuccess('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <section className="profile-view">
      <div className="profile-hero">
        <span className="avatar-xl">{initials(user.name)}</span>
        <div>
          <p className="eyebrow">Tu cuenta</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <span className="profile-badge">
          <User size={15} />
          Miembro
        </span>
      </div>

      <div className="profile-grid">
        <form className="card form-card" onSubmit={handleInfoSubmit}>
          <h3>Información personal</h3>
          <p className="card-hint">Actualiza tu nombre o correo electrónico.</p>

          <label className="field">
            <span>Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </label>

          <label className="field">
            <span>Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          {infoError ? <p className="form-error" role="alert">{infoError}</p> : null}
          {infoSuccess ? <p className="form-success" role="status">{infoSuccess}</p> : null}

          <button type="submit" className="btn btn-primary" disabled={infoLoading}>
            {infoLoading ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>

        <form className="card form-card" onSubmit={handlePasswordSubmit}>
          <h3>Seguridad</h3>
          <p className="card-hint">
            Usa una contraseña de al menos 8 caracteres que no reutilices en otros sitios.
          </p>

          <label className="field">
            <span>Contraseña actual</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label className="field">
            <span>Nueva contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="field">
            <span>Repetir nueva contraseña</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          {passwordError ? (
            <p className="form-error" role="alert">{passwordError}</p>
          ) : null}
          {passwordSuccess ? (
            <p className="form-success" role="status">{passwordSuccess}</p>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={passwordLoading}>
            {passwordLoading ? 'Actualizando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>

      <button type="button" className="btn btn-danger btn-logout" onClick={onLogout}>
        <LogOut size={17} />
        Cerrar sesión
      </button>
    </section>
  );
}
