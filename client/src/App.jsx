import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, getStoredToken, storeToken } from './lib/api.js';
import { useAudioPlayer } from './hooks/useAudioPlayer.js';
import { trackCount } from './utils/format.js';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import SongList from './components/SongList.jsx';
import PlayerBar from './components/PlayerBar.jsx';
import AuthModal from './components/AuthModal.jsx';
import PlaylistsView from './components/PlaylistsView.jsx';
import ProfilePanel from './components/ProfilePanel.jsx';
import { EmptyState, Toast } from './components/Common.jsx';
import {
  Disc,
  Heart,
  Library,
  ListMusic,
  Play,
  Sparkles,
  Trash
} from './components/Icons.jsx';

const FORMATS = [
  { id: 'all', label: 'Todas' },
  { id: 'mp3', label: 'MP3' },
  { id: 'wav', label: 'WAV' },
  { id: 'flac', label: 'FLAC' },
  { id: 'aac', label: 'AAC' }
];

export default function App() {
  const [songs, setSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [songsError, setSongsError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [view, setView] = useState('library');
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set());
  const [playlists, setPlaylists] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [reloadCounter, setReloadCounter] = useState(0);

  const audioRef = useRef(null);
  const contentRef = useRef(null);
  const player = useAudioPlayer(audioRef);

  const logout = useCallback((message) => {
    storeToken(null);
    setToken(null);
    setUser(null);
    setFavorites(new Set());
    setPlaylists([]);
    setActivePlaylist(null);
    if (message) setToast(message);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [view, activePlaylist?.id, debouncedSearch]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSongs(true);

    api
      .getSongs({ q: debouncedSearch, token })
      .then((data) => {
        if (cancelled) return;
        setSongs(data.songs || []);
        setSongsError('');
      })
      .catch((error) => {
        if (cancelled) return;
        setSongsError(error.message || 'No se pudo cargar la biblioteca.');
      })
      .finally(() => {
        if (!cancelled) setLoadingSongs(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, token, reloadCounter]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setFavorites(new Set());
      setPlaylists([]);
      return undefined;
    }

    let cancelled = false;
    Promise.all([api.getMe(token), api.getFavorites(token), api.getPlaylists(token)])
      .then(([me, favoriteData, playlistData]) => {
        if (cancelled) return;
        setUser(me.user);
        setFavorites(new Set((favoriteData.songs || []).map((song) => song.id)));
        setPlaylists(playlistData.playlists || []);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error.status === 401) {
          logout('Tu sesión expiró. Inicia sesión de nuevo.');
        } else {
          setToast(error.message || 'No se pudieron cargar tus datos.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const visibleSongs = useMemo(() => {
    let base = songs;

    if (view === 'favorites') {
      base = songs.filter((song) => favorites.has(song.id));
    } else if (view === 'playlist') {
      const list = activePlaylist?.songs || [];
      const query = debouncedSearch.toLowerCase();
      base = query
        ? list.filter((song) =>
            [song.title, song.artist, song.album].some((value) =>
              String(value).toLowerCase().includes(query)
            )
          )
        : list;
    }

    return formatFilter === 'all'
      ? base
      : base.filter((song) => song.format === formatFilter);
  }, [
    view,
    songs,
    favorites,
    activePlaylist,
    debouncedSearch,
    formatFilter
  ]);

  const currentIsFavorite = player.currentSong
    ? favorites.has(player.currentSong.id)
    : false;

  function handleNavigate(nextView) {
    setView(nextView);
    if (nextView !== 'playlist') setActivePlaylist(null);
    setSidebarOpen(false);
  }

  function handleAuthSuccess(data) {
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthOpen(false);
    setToast(`¡Hola, ${data.user.name.split(/\s+/)[0]}!`);
  }

  function handleLogout() {
    logout(null);
    setView('library');
    setAuthOpen(false);
    setToast('Sesión cerrada. Tu música sigue aquí.');
  }

  async function handleToggleFavorite(song) {
    if (!token) {
      setAuthOpen(true);
      return;
    }

    const wasFavorite = favorites.has(song.id);
    setFavorites((previous) => {
      const next = new Set(previous);
      if (wasFavorite) next.delete(song.id);
      else next.add(song.id);
      return next;
    });

    try {
      if (wasFavorite) await api.removeFavorite(song.id, token);
      else await api.addFavorite(song.id, token);
    } catch (error) {
      setFavorites((previous) => {
        const next = new Set(previous);
        if (wasFavorite) next.add(song.id);
        else next.delete(song.id);
        return next;
      });
      setToast(error.message || 'No se pudo actualizar favoritos.');
    }
  }

  function handlePlay(song, list) {
    const queue = Array.isArray(list) && list.length > 0 ? list : visibleSongs;
    if (player.currentSong?.id === song.id) {
      player.togglePlay();
      return;
    }
    player.playSong(song, queue);
  }

  function handleTogglePlay() {
    if (player.currentSong) {
      player.togglePlay();
      return;
    }
    if (visibleSongs[0]) {
      player.playSong(visibleSongs[0], visibleSongs);
    }
  }

  function playAll() {
    if (visibleSongs[0]) player.playSong(visibleSongs[0], visibleSongs);
  }

  async function handleCreatePlaylist(name) {
    if (!token) {
      setAuthOpen(true);
      return false;
    }
    try {
      const data = await api.createPlaylist(name, token);
      setPlaylists((previous) => [...previous, data.playlist]);
      setToast(`Lista "${data.playlist.name}" creada.`);
      return true;
    } catch (error) {
      setToast(error.message || 'No se pudo crear la lista.');
      return false;
    }
  }

  async function handleOpenPlaylist(id) {
    if (!token) {
      setAuthOpen(true);
      return;
    }
    try {
      const data = await api.getPlaylist(id, token);
      setActivePlaylist(data.playlist);
      setView('playlist');
      setSidebarOpen(false);
    } catch (error) {
      setToast(error.message || 'No se pudo abrir la lista.');
    }
  }

  async function handleDeletePlaylist(playlist) {
    if (!playlist || !token) return;
    const confirmed = window.confirm(
      `¿Eliminar la lista "${playlist.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      await api.deletePlaylist(playlist.id, token);
      setPlaylists((previous) => previous.filter((item) => item.id !== playlist.id));
      if (activePlaylist?.id === playlist.id) {
        setActivePlaylist(null);
        setView('playlists');
      }
      setToast('Lista eliminada.');
    } catch (error) {
      setToast(error.message || 'No se pudo eliminar la lista.');
    }
  }

  async function handleAddToPlaylist(song, playlistId) {
    if (!token) {
      setAuthOpen(true);
      return;
    }
    try {
      await api.addSongToPlaylist(playlistId, song.id, token);
      setPlaylists((previous) =>
        previous.map((playlist) =>
          playlist.id === playlistId
            ? { ...playlist, songCount: playlist.songCount + 1 }
            : playlist
        )
      );
      if (activePlaylist?.id === playlistId) {
        const data = await api.getPlaylist(playlistId, token);
        setActivePlaylist(data.playlist);
      }
      setToast(`"${song.title}" se añadió a la lista.`);
    } catch (error) {
      setToast(error.message || 'No se pudo añadir la canción.');
    }
  }

  async function handleRemoveFromPlaylist(song) {
    if (!activePlaylist || !token) return;
    try {
      await api.removeSongFromPlaylist(activePlaylist.id, song.id, token);
      setActivePlaylist((previous) => ({
        ...previous,
        songs: previous.songs.filter((item) => item.id !== song.id),
        songCount: Math.max(0, previous.songCount - 1)
      }));
      setPlaylists((previous) =>
        previous.map((playlist) =>
          playlist.id === activePlaylist.id
            ? { ...playlist, songCount: Math.max(0, playlist.songCount - 1) }
            : playlist
        )
      );
      setToast('Canción quitada de la lista.');
    } catch (error) {
      setToast(error.message || 'No se pudo quitar la canción.');
    }
  }

  async function handleSaveInfo(payload) {
    const data = await api.updateMe(payload, token);
    setUser(data.user);
    setToast('Perfil actualizado.');
  }

  async function handleChangePassword(payload) {
    const data = await api.updateMe(payload, token);
    setUser(data.user);
    setToast('Contraseña actualizada.');
  }

  function renderLibrary() {
    const searching = debouncedSearch.length > 0;
    return (
      <>
        {!searching ? (
          <section className="hero">
            <div className="hero-copy">
              <span className="hero-kicker">
                <Sparkles size={16} />
                Reproductor local · Web responsiva
              </span>
              <h1>
                Tu música,
                <br />
                <span>sin distracciones.</span>
              </h1>
              <p>
                {songs.length} canciones Sin anuncios, sin
                suscripciones y lista en menos de 3 segundos.
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={playAll}
                  disabled={visibleSongs.length === 0}
                >
                  <Play size={17} />
                  Reproducir ahora
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleNavigate('favorites')}
                >
                  <Heart size={17} />
                  Ver favoritos
                </button>
              </div>
            </div>
            <div
              className={`hero-disc${player.isPlaying ? ' spinning' : ''}`}
              aria-hidden="true"
            >
              <Disc size={112} />
            </div>
          </section>
        ) : null}

        <div className="section-heading">
          <div>
            <p className="eyebrow">{searching ? 'Buscador' : 'Tu colección'}</p>
            <h2>
              {searching ? `Resultados para “${debouncedSearch}”` : 'Biblioteca musical'}
            </h2>
          </div>
          <span className="count-pill">{trackCount(visibleSongs.length)}</span>
        </div>

        <div className="filter-row" aria-label="Filtrar por formato">
          {FORMATS.map((format) => (
            <button
              type="button"
              key={format.id}
              className={`chip${formatFilter === format.id ? ' active' : ''}`}
              onClick={() => setFormatFilter(format.id)}
              aria-pressed={formatFilter === format.id}
            >
              {format.label}
            </button>
          ))}
        </div>

        {songsError ? (
          <div className="error-banner" role="alert">
            <span>{songsError}</span>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() => setReloadCounter((value) => value + 1)}
            >
              Reintentar
            </button>
          </div>
        ) : null}

        <SongList
          songs={visibleSongs}
          loading={loadingSongs}
          currentSong={player.currentSong}
          isPlaying={player.isPlaying}
          favorites={favorites}
          token={token}
          playlists={playlists}
          onPlay={handlePlay}
          onToggleFavorite={handleToggleFavorite}
          onAddToPlaylist={handleAddToPlaylist}
          onCreatePlaylist={() => handleNavigate('playlists')}
          emptyTitle={
            searching
              ? `Sin resultados para “${debouncedSearch}”`
              : 'La biblioteca está vacía'
          }
          emptyDescription={
            searching
              ? 'Prueba con el nombre de otra canción, artista o álbum.'
              : 'El catálogo local todavía no tiene canciones.'
          }
        />
      </>
    );
  }

  function renderFavorites() {
    if (!user) {
      return (
        <EmptyState
          icon={<Heart size={30} />}
          title="Guarda lo que te gusta"
          description="Inicia sesión para marcar canciones como favoritas y encontrarlas al instante."
          actionLabel="Iniciar sesión"
          onAction={() => setAuthOpen(true)}
        />
      );
    }

    return (
      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tu colección</p>
            <h2>Favoritos</h2>
          </div>
          <span className="count-pill">{trackCount(visibleSongs.length)}</span>
        </div>

        {visibleSongs.length > 0 ? (
          <div className="action-row">
            <button type="button" className="btn btn-primary" onClick={playAll}>
              <Play size={17} />
              Reproducir todo
            </button>
          </div>
        ) : null}

        <SongList
          songs={visibleSongs}
          currentSong={player.currentSong}
          isPlaying={player.isPlaying}
          favorites={favorites}
          token={token}
          playlists={playlists}
          onPlay={handlePlay}
          onToggleFavorite={handleToggleFavorite}
          onAddToPlaylist={handleAddToPlaylist}
          onCreatePlaylist={() => handleNavigate('playlists')}
          emptyTitle="Aún no tienes favoritos"
          emptyDescription="Pulsa el corazón de cualquier canción para guardarla aquí."
        />
      </section>
    );
  }

  function renderPlaylistDetail() {
    if (!activePlaylist) {
      return (
        <EmptyState
          icon={<ListMusic size={30} />}
          title="Lista no encontrada"
          description="Abre una lista desde el menú lateral."
          actionLabel="Ver mis listas"
          onAction={() => handleNavigate('playlists')}
        />
      );
    }

    return (
      <section>
        <div className="playlist-hero">
          <span className="playlist-art large art-2">
            <ListMusic size={44} />
          </span>
          <div className="playlist-hero-copy">
            <p className="eyebrow">Lista de reproducción</p>
            <h2>{activePlaylist.name}</h2>
            <p>{trackCount(activePlaylist.songs?.length ?? 0)}</p>
          </div>
          <div className="playlist-hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={playAll}
              disabled={visibleSongs.length === 0}
            >
              <Play size={17} />
              Reproducir
            </button>
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={() => handleDeletePlaylist(activePlaylist)}
            >
              <Trash size={16} />
              Eliminar
            </button>
          </div>
        </div>

        <SongList
          songs={visibleSongs}
          currentSong={player.currentSong}
          isPlaying={player.isPlaying}
          favorites={favorites}
          token={token}
          playlists={playlists}
          playlistId={activePlaylist.id}
          onPlay={handlePlay}
          onToggleFavorite={handleToggleFavorite}
          onAddToPlaylist={handleAddToPlaylist}
          onCreatePlaylist={() => handleNavigate('playlists')}
          onRemoveFromPlaylist={handleRemoveFromPlaylist}
          emptyTitle="Esta lista está vacía"
          emptyDescription="Añade canciones desde la biblioteca con el botón ＋."
        />
      </section>
    );
  }

  function renderContent() {
    if (view === 'playlists') {
      return (
        <PlaylistsView
          user={user}
          playlists={playlists}
          onOpen={handleOpenPlaylist}
          onCreate={handleCreatePlaylist}
          onDelete={handleDeletePlaylist}
          onLogin={() => setAuthOpen(true)}
        />
      );
    }

    if (view === 'playlist') return renderPlaylistDetail();

    if (view === 'favorites') return renderFavorites();

    if (view === 'profile') {
      if (!user) {
        return (
          <EmptyState
            icon={<Library size={30} />}
            title="Tu perfil"
            description="Inicia sesión para consultar y administrar tu información."
            actionLabel="Iniciar sesión"
            onAction={() => setAuthOpen(true)}
          />
        );
      }
      return (
        <ProfilePanel
          user={user}
          onSaveInfo={handleSaveInfo}
          onChangePassword={handleChangePassword}
          onLogout={handleLogout}
        />
      );
    }

    return renderLibrary();
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        view={view}
        onNavigate={handleNavigate}
        playlists={playlists}
        onOpenPlaylist={handleOpenPlaylist}
        onCreatePlaylist={() => handleNavigate('playlists')}
        user={user}
        onLogin={() => setAuthOpen(true)}
        onLogout={handleLogout}
        onProfile={() => handleNavigate('profile')}
      />

      <div className="main-column">
        <Header
          search={search}
          onSearchChange={setSearch}
          onOpenMenu={() => setSidebarOpen(true)}
          user={user}
          onLogin={() => setAuthOpen(true)}
          onProfile={() => handleNavigate('profile')}
        />
        <main className="content" id="main-content" ref={contentRef}>
          {renderContent()}
        </main>
      </div>

      <PlayerBar
        currentSong={player.currentSong}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        muted={player.muted}
        isFavorite={currentIsFavorite}
        onToggleFavorite={handleToggleFavorite}
        onTogglePlay={handleTogglePlay}
        onNext={player.next}
        onPrevious={player.previous}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onToggleMute={player.toggleMute}
      />

      <audio ref={audioRef} className="audio-engine" data-testid="audio-element" preload="metadata" />

      {authOpen ? (
        <AuthModal onClose={() => setAuthOpen(false)} onSuccess={handleAuthSuccess} />
      ) : null}

      <Toast message={toast} onClose={() => setToast('')} />
    </div>
  );
}
