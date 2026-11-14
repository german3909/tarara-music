# Arquitectura — Tarara Music

## Visión general

```mermaid
flowchart LR
  U[Usuario<br/>navegador] -->|React + Vite| C[Cliente web]
  C -->|fetch /api| A[API Express]
  C -->|streaming /media| S[Archivos de audio locales]
  A -->|SQL| DB[(PostgreSQL)]
  A -->|JWT + bcrypt| A
  A -->|estático| S
  A -->|estático| CV[Portadas SVG]
```

- **Frontend:** React 18 + Vite. Estado de sesión en `localStorage`; el reproductor usa
  un único elemento `<audio>` controlado por `useAudioPlayer`.
- **Backend:** Express con rutas REST, JWT y bcrypt. Sirve también las portadas y los
  archivos de audio.
- **Base de datos:** PostgreSQL en producción; pg-mem con el mismo SQL en pruebas y en
  el modo demo sin base de datos.
- **Despliegue:** `npm run build` genera `client/dist`; `npm start` sirve la API y el
  frontend desde Express.

## Modelo de datos

```mermaid
erDiagram
  USERS ||--o{ FAVORITES : guarda
  USERS ||--o{ PLAYLISTS : crea
  SONGS ||--o{ FAVORITES : recibe
  PLAYLISTS ||--o{ PLAYLIST_SONGS : contiene
  SONGS ||--o{ PLAYLIST_SONGS : aparece

  USERS {
    serial id PK
    text name
    text email UK
    text password_hash
    timestamp created_at
  }
  SONGS {
    serial id PK
    text title
    text artist
    text album
    int duration
    text audio_format
    text url
    text cover
  }
  FAVORITES {
    int user_id PK
    int song_id PK
    timestamp created_at
  }
  PLAYLISTS {
    serial id PK
    int user_id
    text name
    timestamp created_at
  }
  PLAYLIST_SONGS {
    int playlist_id PK
    int song_id PK
    int position
    timestamp added_at
  }
```

## Flujo de reproducción

```mermaid
sequenceDiagram
  actor U as Usuario
  participant UI as SongList / PlayerBar
  participant H as useAudioPlayer
  participant A as Elemento audio HTML5
  participant API as Express /media

  U->>UI: Pulsa reproducir
  UI->>H: playSong(canción, cola)
  H->>A: src = /media/...
  H->>A: play()
  A->>API: GET /media/...
  API-->>A: Audio (MP3/WAV/FLAC/AAC)
  A-->>H: evento play / timeupdate
  H-->>UI: isPlaying, progreso
  A-->>H: evento ended
  H->>H: siguiente canción de la cola
```

## Flujo de autenticación

```mermaid
sequenceDiagram
  actor U as Usuario
  participant UI as AuthModal
  participant API as Express
  participant DB as PostgreSQL

  U->>UI: Correo + contraseña
  UI->>API: POST /api/auth/login
  API->>DB: SELECT usuario por email
  DB-->>API: password_hash
  API->>API: bcrypt.compare(...)
  API-->>UI: 200 + JWT + datos públicos
  UI->>UI: Guarda token en localStorage
  UI->>API: GET /api/me, /api/favorites, /api/playlists
  API-->>UI: Datos del usuario
```

## Estructura de carpetas

```text
client/src/
  App.jsx                  Orquestación de vistas y estado global
  components/
    Header.jsx             Buscador y acceso
    Sidebar.jsx            Navegación y listas
    SongList.jsx           Filas de canciones, favoritos y añadir a lista
    PlayerBar.jsx          Controles de reproducción y volumen
    AuthModal.jsx          Registro / inicio de sesión
    PlaylistsView.jsx      Creación y tarjetas de listas
    ProfilePanel.jsx       Datos y seguridad de la cuenta
  hooks/useAudioPlayer.js  Lógica del elemento <audio>
  lib/api.js               Cliente HTTP y token
  utils/format.js          Formatos de tiempo, iniciales, filtros

server/src/
  app.js                   Configuración de Express
  index.js                 Arranque y apagado ordenado
  config.js                Variables de entorno
  seed.js                  Catálogo de 10 canciones
  db/schema.js             DDL compartido
  db/postgres.js           Pool de PostgreSQL
  db/memory.js             pg-mem para demo/pruebas
  routes/auth.js           Registro e inicio de sesión
  routes/songs.js          Biblioteca, búsqueda y formatos
  routes/me.js             Perfil, favoritos y listas
  middleware/auth.js       Verificación JWT
```

## Decisiones de diseño

1. **Escuchar sin cuenta:** la biblioteca y la reproducción son públicas (RF-01 y RF-02
   son *Should*), mientras que favoritos, listas y perfil requieren JWT.
2. **Un solo elemento `<audio>`:** evita solapamientos y facilita la reproducción
   continua, el progreso y el volumen.
3. **SQL portable:** las consultas usan `LOWER(...) LIKE` y `LEFT JOIN` en lugar de
   `ILIKE`/subconsultas correlacionadas para funcionar igual en PostgreSQL y pg-mem.
4. **Contraseñas:** bcrypt con 10 rondas por defecto; el hash nunca sale de la API.
5. **Catálogo local:** 10 pistas generadas para la demo, con 4 formatos y portadas SVG
   servidas por el propio backend.
