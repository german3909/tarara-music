# Pruebas de aceptación — Tarara Music

Ejecución:

```bash
npm test
```

- API: `server/tests/acceptance.test.js` (Vitest + Supertest + pg-mem).
- Interfaz: `client/src/App.test.jsx`, `client/src/hooks/useAudioPlayer.test.jsx`.
- Responsive: `client/src/test/responsive.test.js`.
- Utilidades: `client/src/utils/format.test.js`.

## Matriz de trazabilidad

| PA | Escenario | Requisito | Prueba automatizada | Estado |
| --- | --- | --- | --- | --- |
| PA-01 | La biblioteca muestra al menos 10 canciones en menos de 3 s | RF-07 | `PA-01 · Biblioteca musical` + `PA-01 · La biblioteca se muestra en la interfaz` | ✅ |
| PA-02 | Búsqueda por título, artista o álbum, sin distinguir mayúsculas | RF-03 | `PA-02 · Buscador de canciones, artistas y álbumes` | ✅ |
| PA-03 | Reproducir, pausar, avanzar y retroceder; inicio < 2 s | RF-04 / RNF-01 | `PA-03 · Reproductor...` + `PA-03 · Reproducción desde la interfaz` | ✅ |
| PA-04 | Ajustar volumen entre 0 y 1, silenciar y reactivar | RF-09 | `PA-04 · Control de volumen` + `PA-04 · Volumen desde la interfaz` | ✅ |
| PA-05 | Registro con contraseña cifrada y validaciones | RF-01 | `PA-05 · Registro de usuarios` | ✅ |
| PA-06 | Inicio de sesión y rechazo de credenciales inválidas | RF-02 | `PA-06 · Inicio de sesión` | ✅ |
| PA-07 | Guardar, listar y eliminar favoritos por usuario | RF-06 | `PA-07 · Favoritos` + `PA-07 · Favoritos invitan a iniciar sesión...` | ✅ |
| PA-08 | Crear, renombrar, llenar, consultar y eliminar listas | RF-05 | `PA-08 · Listas de reproducción` | ✅ |
| PA-09 | Consultar y actualizar perfil; cambio de contraseña | RF-08 | `PA-09 · Perfil de usuario` | ✅ |
| PA-10 | Rutas privadas protegidas; datos sensibles no expuestos | RNF-05 | `PA-10 · Seguridad de sesiones y datos` | ✅ |
| PA-11 | Interfaz responsive con puntos de ruptura para móvil/tableta | RNF-02 | `PA-11 · Interfaz web responsiva` | ✅ |
| PA-12 | Catálogo disponible en < 2 s y reproducción inmediata | RNF-01 / RNF-03 | `PA-12 · Rendimiento del catálogo` | ✅ |

## Detalle de cada prueba

### PA-01 · Biblioteca musical

**Dado** que el sistema arranca con el catálogo sembrado,
**cuando** el usuario abre la vista principal,
**entonces** ve al menos 10 canciones con título, artista, álbum, duración, formato y
portada, y la carga tarda menos de 3 segundos.

Comprobaciones automáticas:

- `GET /api/songs` devuelve `>= 10` elementos y tarda menos de 3000 ms.
- El catálogo contiene los formatos `mp3`, `wav`, `flac` y `aac`.
- Cada canción tiene URL local válida (`/media/...`).
- La interfaz renderiza las 10 canciones y el buscador.

### PA-02 · Buscador

**Dado** el catálogo cargado,
**cuando** el usuario busca por título (`NEÓN`), artista (`luna nova`) o álbum
(`ciudad eléctrica`),
**entonces** obtiene las coincidencias correctas sin distinguir mayúsculas.

También se valida que una búsqueda sin coincidencias devuelve una lista vacía y que
una consulta de más de 80 caracteres se rechaza con `400`.

### PA-03 · Reproductor de música

**Dado** un catálogo con audio local,
**cuando** el usuario pulsa reproducir,
**entonces** el elemento `<audio>` reproduce la pista, el botón cambia a pausa y se
puede pausar, avanzar o retroceder.

Comprobaciones:

- Los 10 archivos se sirven con MIME `audio/*` y tamaño mayor a 1 KB.
- `playSong` inicia la reproducción en menos de 2 segundos.
- Al terminar una canción, salta automáticamente a la siguiente.
- La interfaz muestra el estado de reproducción y los controles.

### PA-04 · Control de volumen

**Dado** el reproductor activo,
**cuando** el usuario mueve el control de volumen,
**entonces** el volumen del audio cambia entre `0` y `1`.
El botón de silencio alterna `muted` y vuelve a activar el sonido. Los valores fuera de
rango se recortan a `0` o `1`.

### PA-05 · Registro

**Dado** un visitante sin cuenta,
**cuando** se registra con nombre, correo válido y contraseña de al menos 8 caracteres,
**entonces** se crea la cuenta, se devuelve un JWT y la contraseña queda cifrada con
bcrypt (nunca se devuelve en la respuesta). Se rechazan correos duplicados, correos
inválidos y contraseñas cortas.

### PA-06 · Inicio de sesión

**Dado** una cuenta registrada,
**cuando** el usuario introduce sus credenciales,
**entonces** recibe un token y accede a favoritos, listas y perfil. Una contraseña
incorrecta o una cuenta inexistente devuelve `401`.

### PA-07 · Favoritos

**Dado** un usuario autenticado,
**cuando** pulsa el corazón de una canción,
**entonces** la canción se guarda como favorita y aparece en la vista de favoritos.
La operación es idempotente, se puede deshacer y los favoritos de un usuario no se
mezclan con los de otro. Sin sesión se abre el formulario de acceso.

### PA-08 · Listas de reproducción

**Dado** un usuario autenticado,
**cuando** crea una lista, añade canciones, quita una, la renombra o la elimina,
**entonces** los cambios se reflejan en la API y en la interfaz. Las listas son
privadas: otro usuario recibe `404` al intentar abrirlas. Se rechazan nombres vacíos y
canciones duplicadas en la misma lista.

### PA-09 · Perfil

**Dado** un usuario autenticado,
**cuando** consulta o actualiza su nombre/correo,
**entonces** los cambios se guardan y se reflejan en la sesión. Para cambiar la
contraseña se exige la contraseña actual; después, la contraseña antigua deja de
funcionar y la nueva permite iniciar sesión.

### PA-10 · Seguridad

- `/api/me`, `/api/favorites` y `/api/playlists` responden `401` sin token o con un
  token inválido.
- Las respuestas de registro/login no incluyen `password` ni `password_hash`.
- La biblioteca y la reproducción son públicas para permitir el uso sin cuenta.

### PA-11 · Diseño responsive

`index.html` declara `viewport`. La hoja de estilos incluye puntos de ruptura en
`900px`, `700px` y `460px`, una cuadrícula principal de altura completa (`100dvh`) y un
menú lateral deslizante para móvil. El reproductor se reorganiza en dos filas en
pantallas pequeñas.

### PA-12 · Rendimiento

El catálogo responde en menos de 2 segundos y la reproducción comienza en menos de 2
segundos tras la interacción (medido en las pruebas). El arranque de la biblioteca
mantiene la meta de menos de 3 segundos del objetivo del proyecto.
