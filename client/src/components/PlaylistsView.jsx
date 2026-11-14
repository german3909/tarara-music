import { useState } from 'react';
import { ListMusic, Plus, Trash } from './Icons.jsx';
import { EmptyState } from './Common.jsx';
import { trackCount } from '../utils/format.js';

export default function PlaylistsView({
  user,
  playlists,
  onOpen,
  onCreate,
  onDelete,
  onLogin
}) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  if (!user) {
    return (
      <EmptyState
        icon={<ListMusic size={30} />}
        title="Tus listas, a tu manera"
        description="Inicia sesión para crear listas de reproducción y organizar tu música."
        actionLabel="Iniciar sesión"
        onAction={onLogin}
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setCreating(true);
    const created = await onCreate(clean);
    setCreating(false);
    if (created) setName('');
  }

  return (
    <section className="playlists-view">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Organiza tu música</p>
          <h2>Mis listas</h2>
        </div>
        <span className="count-pill">{playlists.length} listas</span>
      </div>

      <form className="create-playlist" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="new-playlist-name">
          Nombre de la nueva lista
        </label>
        <input
          id="new-playlist-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre de la nueva lista"
          maxLength={60}
        />
        <button type="submit" className="btn btn-primary" disabled={creating || !name.trim()}>
          <Plus size={17} />
          Crear lista
        </button>
      </form>

      {playlists.length === 0 ? (
        <EmptyState
          icon={<ListMusic size={30} />}
          title="Todavía no hay listas"
          description="Crea una lista y empieza a añadir tus canciones favoritas."
        />
      ) : (
        <div className="playlist-grid">
          {playlists.map((playlist, index) => (
            <article className="playlist-card" key={playlist.id}>
              <button
                type="button"
                className="playlist-card-main"
                onClick={() => onOpen(playlist.id)}
              >
                <span className={`playlist-art art-${(index % 5) + 1}`}>
                  <ListMusic size={30} />
                </span>
                <strong>{playlist.name}</strong>
                <span>{trackCount(playlist.songCount)}</span>
              </button>
              <button
                type="button"
                className="icon-button danger playlist-delete"
                onClick={() => onDelete(playlist)}
                aria-label={`Eliminar la lista ${playlist.name}`}
              >
                <Trash size={17} />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
