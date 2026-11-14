# 🎵 Tarara Music

Reproductor de música web responsivo para una biblioteca local, sin anuncios y sin
dependencia de plataformas de streaming. Proyecto desarrollado con **React + Vite**,
**Express** y **PostgreSQL**, con 10 canciones de demostración en **MP3, WAV, FLAC y
AAC**.

## Funcionalidades

| RF | Requisito | Prioridad | Estado |
| --- | --- | --- | --- |
| RF-01 | Registro de usuarios | Should | ✅ |
| RF-02 | Inicio de sesión | Should | ✅ |
| RF-03 | Buscador de canciones, artistas y álbumes | Must | ✅ |
| RF-04 | Reproductor de música (reproducir/pausar, anterior/siguiente, progreso) | Must | ✅ |
| RF-05 | Listas de reproducción (crear, renombrar, añadir/quitar, eliminar) | Should | ✅ |
| RF-06 | Favoritos | Should | ✅ |
| RF-07 | Biblioteca musical | Must | ✅ |
| RF-08 | Perfil de usuario (datos y contraseña) | Could | ✅ |
| RF-09 | Control de volumen y silencio | Must | ✅ |

Otros detalles:

- Diseño responsive (escritorio, tableta y móvil) con menú lateral deslizante.
- Contraseñas cifradas con **bcrypt** y sesiones mediante **JWT**.
- Reproducción continua: al terminar una pista salta automáticamente a la siguiente.
- Catálogo sembrado automáticamente con 10 canciones y portadas locales.
- Búsqueda en servidor sin distinguir mayúsculas/minúsculas.

## Requisitos

- **Node.js 20 o superior** y npm.
- **PostgreSQL 16** (opcional para la demo: existe un modo en memoria).

## Inicio rápido (demo, sin PostgreSQL)

```bash
npm install
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:4000>

Sin `DATABASE_URL`, el servidor arranca con una base PostgreSQL compatible en memoria
(pg-mem) y siembra el catálogo de 10 canciones. **Los datos se reinician al apagar**.

## Inicio con PostgreSQL

1. Levanta la base de datos:

   ```bash
   docker compose up -d
   ```

2. Crea tu archivo `.env` a partir del ejemplo y ajusta el secreto JWT:

   ```bash
   copy .env.example .env    # Windows
   # cp .env.example .env    # macOS / Linux
   ```

3. Arranca el proyecto:

   ```bash
   npm run dev
   ```

El servidor crea las tablas y siembra el catálogo en el primer arranque.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | API + frontend en modo desarrollo |
| `npm run dev:server` | Solo la API (puerto 4000) |
| `npm run dev:client` | Solo el frontend Vite (puerto 5173) |
| `npm test` | Todas las pruebas de aceptación (servidor + cliente) |
| `npm run test:server` | Pruebas de API con Vitest + Supertest + pg-mem |
| `npm run test:client` | Pruebas de reproductor e interfaz con Vitest + Testing Library |
| `npm run build` | Build de producción del frontend |
| `npm start` | API en producción, sirviendo también `client/dist` si existe |

## Pruebas de aceptación

La matriz completa está en [`docs/PRUEBAS_ACEPTACION.md`](docs/PRUEBAS_ACEPTACION.md).

| PA | Escenario | RF/RNF |
| --- | --- | --- |
| PA-01 | Biblioteca con al menos 10 canciones y 4 formatos | RF-07 |
| PA-02 | Búsqueda por título, artista y álbum | RF-03 |
| PA-03 | Reproducir, pausar y avanzar de pista | RF-04 |
| PA-04 | Ajustar volumen, silenciar y reactivar sonido | RF-09 |
| PA-05 | Registro con contraseña cifrada | RF-01 |
| PA-06 | Inicio de sesión y rechazo de credenciales inválidas | RF-02 |
| PA-07 | Favoritos por usuario | RF-06 |
| PA-08 | CRUD de listas de reproducción y aislamiento por usuario | RF-05 |
| PA-09 | Perfil y cambio de contraseña | RF-08 |
| PA-10 | Protección de rutas y datos sensibles | RNF-05 |
| PA-11 | Interfaz responsive con puntos de ruptura | RNF-02 |
| PA-12 | Rendimiento del catálogo y del inicio de reproducción | RNF-01, RNF-03 |

```bash
npm test
```

## Estructura del proyecto

```text
tarara-music/
├── client/                 # React + Vite
│   ├── src/
│   │   ├── components/     # Interfaz (sidebar, reproductor, listas, perfil...)
│   │   ├── hooks/          # useAudioPlayer (HTML5 Audio)
│   │   ├── lib/api.js      # Cliente de la API y sesión
│   │   ├── test/           # Configuración de pruebas
│   │   └── App.jsx
│   └── index.html
├── server/                 # Express + PostgreSQL
│   ├── public/media/       # 10 pistas locales (MP3/WAV/FLAC/M4A-AAC)
│   ├── public/covers/      # Portadas SVG locales
│   ├── src/
│   │   ├── db/             # Esquema, PostgreSQL y pg-mem
│   │   ├── routes/         # auth, songs, me (favoritos/listas/perfil)
│   │   ├── seed.js         # Catálogo de demostración
│   │   └── app.js
│   └── tests/              # Pruebas de aceptación de la API
├── docs/
│   ├── PRUEBAS_ACEPTACION.md
│   ├── REQUISITOS.md
│   └── ARQUITECTURA.md
├── docker-compose.yml
└── .env.example
```

## API principal

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/health` | Público | Estado del servicio |
| POST | `/api/auth/register` | Público | Crear cuenta |
| POST | `/api/auth/login` | Público | Iniciar sesión |
| GET | `/api/songs?q=` | Público | Biblioteca y búsqueda |
| GET | `/api/songs/:id` | Público | Detalle de canción |
| GET | `/api/formats` | Público | Formatos soportados |
| GET/PATCH | `/api/me` | Privado | Consultar/actualizar perfil |
| GET | `/api/favorites` | Privado | Canciones favoritas |
| PUT/DELETE | `/api/favorites/:songId` | Privado | Añadir/quitar favorito |
| GET/POST | `/api/playlists` | Privado | Listar/crear listas |
| GET/PATCH/DELETE | `/api/playlists/:id` | Privado | Detalle/renombrar/eliminar |
| POST | `/api/playlists/:id/songs` | Privado | Añadir canción |
| DELETE | `/api/playlists/:id/songs/:songId` | Privado | Quitar canción |

## Notas

- No se incluye ningún archivo `.env` en el repositorio; usa `.env.example`.
- En producción cambia `JWT_SECRET` y configura `CLIENT_ORIGIN`.
- Los archivos de audio y las portadas son generados para la demo y se sirven desde
  `/media` y `/covers`.
