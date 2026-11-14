import {
  Heart,
  MusicNote,
  Next,
  Pause,
  Play,
  Previous,
  Volume,
  VolumeMuted
} from './Icons.jsx';
import { formatLabel, formatTime } from '../utils/format.js';

export default function PlayerBar({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  isFavorite,
  onToggleFavorite,
  onTogglePlay,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleMute
}) {
  const total = Number(duration) || Number(currentSong?.duration) || 0;
  const progress = Math.min(Number(currentTime) || 0, total || 0);
  const sliderValue = muted ? 0 : Math.round(volume * 100);
  const hasSong = Boolean(currentSong);

  return (
    <footer className="player-bar" aria-label="Reproductor de música">
      <div className="player-song">
        {hasSong && currentSong.cover ? (
          <img className="player-cover" src={currentSong.cover} alt="" width="56" height="56" />
        ) : (
          <span className="player-cover player-cover-fallback" aria-hidden="true">
            <MusicNote size={22} />
          </span>
        )}

        <div className="player-song-meta">
          <strong>{hasSong ? currentSong.title : 'Elige una canción'}</strong>
          <span>
            {hasSong
              ? `${currentSong.artist} · ${currentSong.album}`
              : 'Tu biblioteca está lista'}
          </span>
        </div>

        {hasSong ? (
          <button
            type="button"
            className={`icon-button heart${isFavorite ? ' is-favorite' : ''}`}
            onClick={() => onToggleFavorite(currentSong)}
            aria-label={
              isFavorite
                ? `Quitar ${currentSong.title} de favoritos`
                : `Añadir ${currentSong.title} a favoritos`
            }
            aria-pressed={isFavorite}
          >
            <Heart size={18} filled={isFavorite} />
          </button>
        ) : null}
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            type="button"
            className="icon-button"
            onClick={onPrevious}
            aria-label="Canción anterior"
            disabled={!hasSong}
          >
            <Previous size={20} />
          </button>
          <button
            type="button"
            className="play-main"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={onNext}
            aria-label="Siguiente canción"
            disabled={!hasSong}
          >
            <Next size={20} />
          </button>
        </div>

        <div className="progress-row">
          <span className="time">{formatTime(progress)}</span>
          <input
            type="range"
            className="range progress-range"
            min="0"
            max={total || 1}
            step="0.1"
            value={progress}
            onChange={(event) => onSeek(Number(event.target.value))}
            aria-label="Progreso de la canción"
            disabled={!hasSong}
          />
          <span className="time">{formatTime(total)}</span>
        </div>
      </div>

      <div className="player-volume">
        <span className="format-label">{hasSong ? formatLabel(currentSong.format) : '—'}</span>
        <button
          type="button"
          className="icon-button"
          onClick={onToggleMute}
          aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          aria-pressed={muted}
        >
          {muted || volume === 0 ? <VolumeMuted size={19} /> : <Volume size={19} />}
        </button>
        <input
          type="range"
          className="range volume-range"
          min="0"
          max="100"
          step="1"
          value={sliderValue}
          onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
          aria-label="Volumen"
        />
      </div>
    </footer>
  );
}
