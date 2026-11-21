# Registro de defectos — Tarara Music

## Origen de la información

El historial Git contiene únicamente dos commits (`c53b736` "Primer commit" y `1716e9a` "se agrego un punto en la fila 18 de agents") y no hay issues ni comentarios registrados. Por ello, los defectos documentados a continuación se reconstruyen a partir del registro real de ejecución de pruebas y de la verificación en navegador durante el desarrollo, no de mensajes de commit.

| ID | Qué falló | Severidad | Cómo se corrigió | Verificado por |
| --- | --- | --- | --- | --- |
| D-01 | Al consultar la biblioteca con sesión y el detalle de una lista, PostgreSQL en memoria (pg-mem) devolvía error 500: las subconsultas correlacionadas `EXISTS (... f.song_id = s.id ...)` no resolvían el alias externo. En la suite aparecieron 2 fallos: `Cannot read properties of undefined (reading 'find')` y `expected 500 to be 200`. | Alta | Se sustituyeron las subconsultas por `LEFT JOIN favorites f ON f.song_id = s.id AND f.user_id = $n` más `CASE WHEN f.song_id IS NULL THEN false ELSE true END` en `server/src/routes/songs.js` y `server/src/routes/me.js`. | `npm test`: 21/21 pruebas del servidor en verde, incluidas PA-07 (favoritos) y PA-08 (listas). |
| D-02 | Al abrir la aplicación servida desde Express (http://localhost:4000), los recursos `/assets/*.js` y `/assets/*.css` respondían 500 con el mensaje "Origen no permitido por CORS.", dejando la pantalla en blanco. | Alta | En `server/src/app.js` la configuración de CORS se cambió por una función que acepta peticiones sin `Origin` y aquellas cuyo `Origin` coincide con `req.protocol://req.headers.host` (mismo origen), además de los orígenes permitidos por `CLIENT_ORIGIN`. | Recarga del navegador en `http://localhost:4000`: sin errores en consola, 10 canciones renderizadas y reproducción real de audio. |
| D-03 | Al cambiar de vista (por ejemplo, de la biblioteca a "Mis listas") o de término de búsqueda, el área de contenido conservaba el desplazamiento previo, por lo que la nueva pantalla aparecía a media altura. | Media | Se añadió `contentRef` al elemento `<main class="content">` en `client/src/App.jsx` y un efecto que asigna `scrollTop = 0` cuando cambian `view`, `activePlaylist?.id` o `debouncedSearch`. | Verificación en navegador: tras abrir una lista y volver a la biblioteca, `main.scrollTop` era 0 y el encabezado "Mis listas" se mostraba en la parte superior. |

## Notas

- No se registraron defectos de seguridad ni pérdida de datos durante las pruebas.
- Los umbrales de rendimiento (3000 ms y 2000 ms) son aserciones del código; no se publican tiempos medidos porque el runner no los imprime. Ver la tabla de Calidad en el informe.
