# Requisitos y trazabilidad — Tarara Music

## Requisitos funcionales (MoSCoW)

| ID | Requisito | Prioridad | Implementación | Prueba |
| --- | --- | --- | --- | --- |
| RF-01 | Registro de usuarios | Should | `POST /api/auth/register`, `AuthModal.jsx` (pestaña Registrarme) | PA-05 |
| RF-02 | Inicio de sesión | Should | `POST /api/auth/login`, JWT + bcrypt, persistencia en `localStorage` | PA-06 |
| RF-03 | Buscador | Must | `GET /api/songs?q=`, input del `Header.jsx` con debounce | PA-02 |
| RF-04 | Reproductor de música | Must | `useAudioPlayer.js`, `PlayerBar.jsx`, `<audio>` HTML5 | PA-03 |
| RF-05 | Listas de reproducción | Should | Rutas `/api/playlists`, `PlaylistsView.jsx`, detalle de lista | PA-08 |
| RF-06 | Favoritos | Should | Rutas `/api/favorites`, corazón en `SongList.jsx` y `PlayerBar.jsx` | PA-07 |
| RF-07 | Biblioteca musical | Must | `GET /api/songs`, `seed.js`, vista de biblioteca y filtros por formato | PA-01 |
| RF-08 | Perfil de usuario | Could | `GET/PATCH /api/me`, `ProfilePanel.jsx` | PA-09 |
| RF-09 | Control de volumen | Must | `setVolume`, `toggleMute` en `useAudioPlayer.js` y slider en `PlayerBar.jsx` | PA-04 |

## Requisitos no funcionales

| ID | Requisito | Cómo se cubre |
| --- | --- | --- |
| RNF-01 | Inicio de reproducción < 2 s | Audio local servido por Express; prueba mide `playSong` < 2000 ms |
| RNF-02 | Compatibilidad responsive | CSS con `100dvh`, grid flexible y media queries en 900/700/460 px |
| RNF-03 | Controles a máximo 2 clics | Reproductor fijo visible; play, volumen y buscador en la vista principal |
| RNF-04 | Disponibilidad 99 % | Express con manejo de errores, PostgreSQL y health check `/api/health` |
| RNF-05 | Seguridad | bcrypt (10 rondas en producción), JWT, rutas privadas y validación de entradas |

## Objetivos medibles del proyecto

- Catálogo mínimo de **10 canciones locales**: `server/src/seed.js` y
  `server/public/media/`.
- Carga inicial de la biblioteca **< 3 s**: prueba PA-01.
- Al menos **4 formatos de audio** (MP3, WAV, FLAC, AAC): validado en PA-01 y PA-03.
- Transición fluida entre pistas: el evento `ended` del `<audio>` avanza la cola
  automáticamente (PA-03).
- Web responsiva para computadoras, tabletas y teléfonos: PA-11.

## Fuera del alcance del prototipo

- Subida de archivos por parte del usuario (el catálogo se siembra localmente).
- Reproducción desde servicios de streaming externos.
- Panel de administración.
- Recuperación de contraseña por correo.
