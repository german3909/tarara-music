import { useState } from 'react';
import { Heart, MusicNote, Pause, Play, Plus, Trash } from './Icons.jsx';
import { EmptyState, SkeletonList } from './Common.jsx';
import { formatLabel, formatTime } from '../utils/format.js';

function TrackCover({ song }) {
  const [failed, setFailed] = useState(false);

  if (!song.cover || failed) {
    return (
      <span className="cover cover-fallback" aria-hidden="true">
        <MusicNote size={18} />
      </span>
    );
  }

  return (
    <img
      className="cover"
      src={song.cover}
      alt=""
      loading="lazy"
      width="48"
      height="48"
      onError={() => setFailed(true)}
    />
  );
}

export default function SongList({
  songs,
  loading = false,
  currentSong,
  isPlaying,
  favorites,
  token,
  playlists,
  playlistId,
  onPlay,
  onToggleFavorite,
  onAddToPlaylist,
  onCreatePlaylist,
  onRemoveFromPlaylist,
  emptyTitle = 'No hay canciones',
  emptyDescription = 'Prueba con otra búsqueda o revisa tu biblioteca.'
}) {
  if (loading) return <SkeletonList />;

  if (!songs.length) {
    return (
      <EmptyState
        icon={<MusicNote size={30} />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="song-list" role="list" aria-label="Canciones">
      <div className="song-list-head" aria-hidden="true">
        <span>#</span>
        <span />
        <span>Título</span>
        <span className="song-album">Álbum</span>
        <span className="song-format">Formato</span>
        <span className="song-duration">Duración</span>
        <span />
      </div>

      {songs.map((song, index) => {
        const isCurrent = currentSong?.id === song.id;
        const isFavorite = favorites.has(song.id);
        const rowPlaying = isCurrent && isPlaying;

        return (
          <div
            key={song.id}
            role="listitem"
            className={`song-row${isCurrent ? ' active' : ''}`}
            onDoubleClick={() => onPlay(song, songs)}
          >
            <button
              type="button"
              className="song-play"
              onClick={() => onPlay(song, songs)}
              aria-label={
                rowPlaying ? `Pausar ${song.title}` : `Reproducir ${song.title}`
              }
            >
              {rowPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span className="song-index">{String(index + 1).padStart(2, '0')}</span>
            </button>

            <TrackCover song={song} />

            <div className="song-meta">
              <p className="song-title">
                {song.title}
                {rowPlaying ? (
                  <span className="equalizer" aria-label="Reproduciendo">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}
              </p>
              <p className="song-artist">{song.artist}</p>
            </div>

            <p className="song-album">{song.album}</p>
            <span className={`format-badge format-${song.format}`}>
              {formatLabel(song.format)}
            </span>
            <span className="song-duration">{formatTime(song.duration)}</span>

            <div className="song-actions">
              <button
                type="button"
                className={`icon-button heart${isFavorite ? ' is-favorite' : ''}`}
                onClick={() => onToggleFavorite(song)}
                aria-label={
                  isFavorite
                    ? `Quitar ${song.title} de favoritos`
                    : `Añadir ${song.title} a favoritos`
                }
                aria-pressed={isFavorite}
              >
                <Heart size={18} filled={isFavorite} />
              </button>

              {token && playlists.length > 0 ? (
                <select
                  className="playlist-select"
                  defaultValue=""
                  aria-label={`Añadir ${song.title} a una lista`}
                  onChange={(event) => {
                    const playlist = Number(event.currentTarget.value);
                    event.currentTarget.value = '';
                    if (playlist) onAddToPlaylist(song, playlist);
                  }}
                >
                  <option value="">＋</option>
                  {playlists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </option>
                  ))}
                </select>
              ) : null}

              {token && playlists.length === 0 ? (
                <button
                  type="button"
                  className="icon-button"
                  onClick={onCreatePlaylist}
                  aria-label="Crear una lista de reproducción"
                >
                  <Plus size={18} />
                </button>
              ) : null}

              {playlistId ? (
                <button
                  type="button"
                  className="icon-button danger"
                  onClick={() => onRemoveFromPlaylist(song)}
                  aria-label={`Quitar ${song.title} de la lista`}
                >
                  <Trash size={17} />
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
