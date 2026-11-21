# Diagramas Mermaid — Tarara Music

Puedes pegar cada bloque en <https://mermaid.live> o en cualquier visor compatible con Mermaid
(GitHub, GitLab, Notion, VS Code + extensión Markdown Preview Mermaid).

## Archivos generados

En `docs/diagramas/` están los fuentes y las imágenes listas para el informe:

| Diagrama | Fuente | SVG | PNG |
| --- | --- | --- | --- |
| Arquitectura | `arquitectura.mmd` | `arquitectura.svg` | `arquitectura.png` |
| Clases | `clases.mmd` | `clases.svg` | `clases.png` |
| Interfaces | `interfaces.mmd` | `interfaces.svg` | `interfaces.png` |
| Estados del reproductor | `estados.mmd` | `estados.svg` | `estados.png` |

Los SVG son vectoriales (ideales para Word/PDF); los PNG tienen fondo transparente.

---

## 1. Diagrama de arquitectura

```mermaid
flowchart TD
    subgraph Cliente["Cliente · navegador"]
        UI["Interfaz React + Vite<br/>responsive"]
        Hook["useAudioPlayer<br/>HTML5 Audio"]
        ApiClient["lib/api.js<br/>fetch + JWT"]
        Storage[("localStorage<br/>token JWT")]
    end

    subgraph Servidor["Servidor · Node.js + Express"]
        Express["app.js<br/>Express"]
        AuthRoutes["/api/auth<br/>registro y login"]
        SongRoutes["/api/songs · /api/formats<br/>biblioteca y búsqueda"]
        MeRoutes["/api/me · /api/favorites<br/>/api/playlists"]
        AuthMW["middleware/auth.js<br/>verificación JWT"]
        Static["Estáticos<br/>/media · /covers"]
    end

    DB[("PostgreSQL<br/>(pg-mem en demo/pruebas)")]
    Media[("Audio local<br/>MP3 · WAV · FLAC · AAC")]
    Covers[("Portadas SVG")]

    UI --> ApiClient
    UI --> Hook
    ApiClient -->|HTTP / JSON| Express
    ApiClient <--> Storage
    Hook -->|streaming| Static
    Express --> AuthRoutes
    Express --> SongRoutes
    Express --> MeRoutes
    Express --> Static
    AuthRoutes --> DB
    SongRoutes --> DB
    MeRoutes --> AuthMW
    AuthMW --> DB
    AuthRoutes -.->|bcrypt + JWT| AuthRoutes
    Static --> Media
    Static --> Covers
```

---

## 2. Diagrama de clases

```mermaid
classDiagram
    class User {
        +int id
        +string name
        +string email
        +string passwordHash
        +datetime createdAt
        +registrar()
        +iniciarSesion()
        +actualizarPerfil()
        +cambiarPassword()
    }

    class Song {
        +int id
        +string title
        +string artist
        +string album
        +int duration
        +string format
        +string url
        +string cover
        +bool isFavorite
    }

    class Favorite {
        +int userId
        +int songId
        +datetime createdAt
    }

    class Playlist {
        +int id
        +int userId
        +string name
        +datetime createdAt
        +int songCount
        +crear()
        +renombrar()
        +eliminar()
        +agregarCancion()
        +quitarCancion()
    }

    class PlaylistSong {
        +int playlistId
        +int songId
        +int position
        +datetime addedAt
    }

    class AuthService {
        +registrar(datos)
        +login(email, password)
        -firmarToken(usuario)
    }

    class SongService {
        +listar(busqueda)
        +obtener(id)
        +formatos()
    }

    class LibraryService {
        +favoritos(userId)
        +agregarFavorito(userId, songId)
        +quitarFavorito(userId, songId)
    }

    class PlaylistService {
        +listar(userId)
        +crear(userId, nombre)
        +detalle(userId, playlistId)
        +renombrar(userId, playlistId, nombre)
        +eliminar(userId, playlistId)
        +agregarCancion(userId, playlistId, songId)
        +quitarCancion(userId, playlistId, songId)
    }

    class PlayerController {
        +queue
        +currentSong
        +isPlaying
        +volume
        +playSong(cancion, cola)
        +togglePlay()
        +next()
        +previous()
        +seek(segundos)
        +setVolume(valor)
        +toggleMute()
    }

    User "1" --> "0..*" Favorite : guarda
    User "1" --> "0..*" Playlist : crea
    Song "1" --> "0..*" Favorite : recibe
    Playlist "1" --> "0..*" PlaylistSong : contiene
    Song "1" --> "0..*" PlaylistSong : aparece

    AuthService ..> User : gestiona
    SongService ..> Song : consulta
    LibraryService ..> Favorite : gestiona
    PlaylistService ..> Playlist : gestiona
    PlayerController ..> Song : reproduce
```

---

## 3. Diagrama de interfaces (pantallas y navegación)

```mermaid
flowchart LR
    subgraph Shell["Shell persistente"]
        Sidebar["Sidebar<br/>Biblioteca · Favoritos · Listas<br/>Mis listas · cuenta"]
        Header["Header<br/>buscador + sesión"]
        Player["PlayerBar<br/>reproductor fijo"]
    end

    subgraph Pantallas["Pantallas / vistas"]
        Biblioteca["Biblioteca<br/>10 canciones<br/>filtros MP3/WAV/FLAC/AAC"]
        Busqueda["Resultados de búsqueda<br/>título · artista · álbum"]
        Favoritos["Favoritos<br/>requiere sesión"]
        Listas["Mis listas<br/>crear · abrir · eliminar"]
        Detalle["Detalle de lista<br/>reproducir · quitar canciones"]
        Perfil["Perfil<br/>datos + contraseña"]
        Auth["Modal Auth<br/>iniciar sesión / registro"]
    end

    Sidebar -->|Biblioteca| Biblioteca
    Sidebar -->|Favoritos| Favoritos
    Sidebar -->|Listas| Listas
    Sidebar -->|Iniciar sesión| Auth
    Sidebar -->|Perfil| Perfil
    Header -->|escribir búsqueda| Busqueda
    Header -->|avatar| Perfil
    Biblioteca -->|corazón sin sesión| Auth
    Favoritos -->|sin sesión| Auth
    Listas -->|abrir lista| Detalle
    Listas -->|crear lista sin sesión| Auth
    Auth -->|sesión iniciada| Perfil
    Player -.->|visible en todas las vistas| Shell
```

### Flujo de estados del reproductor

```mermaid
stateDiagram-v2
    [*] --> SinCancion
    SinCancion --> Reproduciendo : playSong(canción)
    Reproduciendo --> Pausado : pause()
    Pausado --> Reproduciendo : resume()
    Reproduciendo --> Reproduciendo : next() / previous()
    Reproduciendo --> Reproduciendo : ended → siguiente pista
    Reproduciendo --> Silenciado : volume = 0 / mute
    Silenciado --> Reproduciendo : volumen > 0 / unmute
    Pausado --> SinCancion : logout / limpiar cola
```
