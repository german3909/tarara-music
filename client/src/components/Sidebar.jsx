import {
  Close,
  Heart,
  Library,
  ListMusic,
  LogOut,
  MusicNote,
  Plus,
  User
} from './Icons.jsx';
import { initials } from '../utils/format.js';

const NAV_ITEMS = [
  { id: 'library', label: 'Biblioteca', icon: Library },
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'playlists', label: 'Listas', icon: ListMusic }
];

export default function Sidebar({
  open,
  onClose,
  view,
  onNavigate,
  playlists,
  onOpenPlaylist,
  onCreatePlaylist,
  user,
  onLogin,
  onLogout,
  onProfile
}) {
  return (
    <>
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Menú principal">
        <div className="sidebar-top">
          <button type="button" className="brand" onClick={() => onNavigate('library')}>
            <span className="brand-mark">
              <MusicNote size={22} />
            </span>
            <span className="brand-text">
              <strong>Tarara</strong>
              <span>Music</span>
            </span>
          </button>
          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <Close size={20} />
          </button>
        </div>

        <nav className="nav" aria-label="Secciones">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              view === item.id ||
              (item.id === 'playlists' && view === 'playlist');
            return (
              <button
                type="button"
                key={item.id}
                className={`nav-item${active ? ' active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  onClose?.();
                }}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-head">
            <span>Mis listas</span>
            <button
              type="button"
              className="icon-button small"
              onClick={() => {
                if (!user) {
                  onLogin();
                } else {
                  onCreatePlaylist();
                  onClose?.();
                }
              }}
              aria-label="Crear una lista de reproducción"
            >
              <Plus size={16} />
            </button>
          </div>

          {!user ? (
            <p className="sidebar-hint">Inicia sesión para guardar tus listas.</p>
          ) : playlists.length === 0 ? (
            <p className="sidebar-hint">Aún no tienes listas. ¡Crea la primera!</p>
          ) : (
            <ul className="playlist-nav">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <button
                    type="button"
                    className="playlist-nav-item"
                    onClick={() => {
                      onOpenPlaylist(playlist.id);
                      onClose?.();
                    }}
                  >
                    <ListMusic size={16} />
                    <span>{playlist.name}</span>
                    <small>{playlist.songCount}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="account-chip">
                <span className="avatar">{initials(user.name)}</span>
                <span className="account-text">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </span>
              </div>
              <div className="sidebar-account-actions">
                <button type="button" className="btn btn-ghost btn-small" onClick={onProfile}>
                  <User size={16} />
                  Perfil
                </button>
                <button type="button" className="btn btn-ghost btn-small" onClick={onLogout}>
                  <LogOut size={16} />
                  Salir
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={onLogin}>
              Iniciar sesión
            </button>
          )}
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={onClose}
          aria-label="Cerrar menú"
        />
      ) : null}
    </>
  );
}
