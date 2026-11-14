import { Close, Menu, Search } from './Icons.jsx';
import { initials } from '../utils/format.js';

export default function Header({ search, onSearchChange, onOpenMenu, user, onLogin, onProfile }) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-button menu-button"
        onClick={onOpenMenu}
        aria-label="Abrir menú"
      >
        <Menu size={22} />
      </button>

      <div className="search-wrap">
        <Search size={18} className="search-icon" />
        <input
          type="search"
          className="search-input"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar canciones, artistas o álbumes"
          aria-label="Buscar canciones, artistas o álbumes"
          autoComplete="off"
        />
        {search ? (
          <button
            type="button"
            className="search-clear"
            onClick={() => onSearchChange('')}
            aria-label="Limpiar búsqueda"
          >
            <Close size={16} />
          </button>
        ) : null}
      </div>

      <div className="topbar-actions">
        {user ? (
          <button type="button" className="user-pill" onClick={onProfile}>
            <span className="avatar small">{initials(user.name)}</span>
            <span className="user-pill-name">{user.name.split(/\s+/)[0]}</span>
          </button>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={onLogin}>
            Iniciar sesión
          </button>
        )}
      </div>
    </header>
  );
}
