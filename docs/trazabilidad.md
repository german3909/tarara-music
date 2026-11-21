# Trazabilidad completa de pruebas — Tarara Music

Este archivo complementa la sección "Pruebas" del informe. El comando de ejecución es:

```bash
npm test
```

Resultado real de la última ejecución: **21 pruebas del servidor + 16 del cliente = 37 aprobadas**, 0 fallidas.

> Nota: los tiempos indicados en los escenarios son **umbrales declarados en las aserciones**, no mediciones publicadas por el runner. Ver la sección de Calidad para las mediciones pendientes.

## Cobertura por prueba de aceptación

| PA | Requisito | Pruebas asociadas | Estado |
| --- | --- | --- | --- |
| PA-01 | RF-07 (biblioteca), RNF-01 | S-01, S-02, C-01 | Aprobado |
| PA-02 | RF-03 (buscador) | S-03, S-04, S-05, S-06, C-16 | Aprobado |
| PA-03 | RF-04 (reproductor), RNF-01 | S-07, S-08, C-02, C-05, C-06, C-07 | Aprobado |
| PA-04 | RF-09 (volumen) | C-03, C-08, C-09, C-10 | Aprobado |
| PA-05 | RF-01 (registro) | S-09, S-10 | Aprobado |
| PA-06 | RF-02 (login) | S-11, S-12, C-04 | Aprobado |
| PA-07 | RF-06 (favoritos) | S-13, S-14, C-04 | Aprobado |
| PA-08 | RF-05 (listas) | S-15, S-16 | Aprobado |
| PA-09 | RF-08 (perfil) | S-17, S-18 | Aprobado |
| PA-10 | RNF-05 (seguridad), RF-07 | S-19, S-20 | Aprobado |
| PA-11 | RNF-02 (responsive) | C-11, C-12, C-13 | Aprobado |
| PA-12 | RNF-01, RNF-03 (rendimiento) | S-21 | Aprobado |

## Listado completo (37 casos)

Fuente: `server/tests/acceptance.test.js` (S) y `client/src/` (C).

| ID | PA | Requisito | Escenario (Dado / Cuando / Entonces) | Resultado |
| --- | --- | --- | --- | --- |
| S-01 | PA-01 | RF-07 | Dado el catálogo sembrado, cuando se consulta `GET /api/songs`, entonces se devuelven ≥10 canciones, los 4 formatos y la respuesta tarda <3000 ms. | Aprobado |
| S-02 | PA-01 | RF-07 | Dado el catálogo, cuando se pide `GET /api/songs/1`, entonces se obtiene "Neón de Medianoche". | Aprobado |
| S-03 | PA-02 | RF-03 | Dado el catálogo, cuando se busca `NEÓN`, entonces se encuentra 1 resultado exacto sin distinguir mayúsculas. | Aprobado |
| S-04 | PA-02 | RF-03 | Dado el catálogo, cuando se busca por artista o álbum, entonces se devuelven las 2 canciones correspondientes. | Aprobado |
| S-05 | PA-02 | RF-03 | Dado el catálogo, cuando se busca texto sin coincidencias, entonces se devuelve una lista vacía con estado 200. | Aprobado |
| S-06 | PA-02 | RF-03 | Dado el catálogo, cuando se envían 81 caracteres de búsqueda, entonces la API responde 400. | Aprobado |
| S-07 | PA-03 | RF-04 | Dado el catálogo, cuando se descarga cada una de las 10 URLs `/media/...`, entonces responden 200 con MIME `audio/*` y tamaño >1000 bytes. | Aprobado |
| S-08 | PA-03 | RF-04 | Dado el catálogo, cuando se revisan los formatos, entonces existe al menos una pista en MP3, WAV, FLAC y AAC. | Aprobado |
| S-09 | PA-05 | RF-01 | Dado un visitante, cuando se registra, entonces recibe 201 + JWT, la contraseña se guarda con hash bcrypt y no aparece en la respuesta. | Aprobado |
| S-10 | PA-05 | RF-01 | Dado el registro, cuando se repite el correo o se envía correo inválido o contraseña corta, entonces se responde 409 / 400 / 400. | Aprobado |
| S-11 | PA-06 | RF-02 | Dado un usuario registrado, cuando inicia sesión con su correo en mayúsculas, entonces obtiene 200 + JWT sin exponer la contraseña. | Aprobado |
| S-12 | PA-06 | RF-02 | Dado un usuario registrado, cuando se intenta entrar con contraseña errónea o cuenta inexistente, entonces se responde 401. | Aprobado |
| S-13 | PA-07 | RF-06 | Dado dos usuarios, cuando A añade un favorito, entonces se lista y se elimina solo para A; la biblioteca de B no lo marca como favorito. | Aprobado |
| S-14 | PA-07 | RF-06 | Dado un visitante, cuando intenta marcar favorito, entonces recibe 401; con sesión, una canción inexistente devuelve 404. | Aprobado |
| S-15 | PA-08 | RF-05 | Dado un usuario, cuando crea, llena, consulta, quita canciones, renombra y elimina una lista, entonces todas las operaciones responden 200/201 y el contenido final es el esperado. | Aprobado |
| S-16 | PA-08 | RF-05 | Dado un usuario propietario y otro ajeno, cuando el ajeno abre la lista, entonces recibe 404; un nombre vacío devuelve 400. | Aprobado |
| S-17 | PA-09 | RF-08 | Dado un usuario, cuando consulta y actualiza su nombre y correo, entonces `GET /api/me` refleja los nuevos datos. | Aprobado |
| S-18 | PA-09 | RF-08 | Dado un usuario, cuando cambia la contraseña, entonces se exige la actual, la antigua deja de funcionar (401) y la nueva funciona (200). | Aprobado |
| S-19 | PA-10 | RNF-05 | Dado un visitante o un token inválido, cuando accede a rutas privadas, entonces recibe 401. | Aprobado |
| S-20 | PA-10 | RF-07 | Dado un visitante sin sesión, cuando consulta la biblioteca, entonces obtiene 200 con ≥10 canciones. | Aprobado |
| S-21 | PA-12 | RNF-01 | Dado el catálogo, cuando se busca `luna`, entonces se devuelven 2 resultados en <2000 ms (umbral de la aserción). | Aprobado |
| C-01 | PA-01 | RF-07 | Dado el frontend cargado, cuando se renderiza la biblioteca, entonces aparecen las 10 canciones y el buscador. | Aprobado |
| C-02 | PA-03 | RF-04 | Dado un usuario en la biblioteca, cuando pulsa reproducir, entonces `audio.play()` se invoca, el botón cambia a "Pausar" y al pulsarlo se llama a `pause()`. | Aprobado |
| C-03 | PA-04 | RF-09 | Dado el reproductor, cuando se cambia el slider de volumen a 25, entonces `audio.volume` es 0,25. | Aprobado |
| C-04 | PA-07 | RF-06 / RF-02 | Dado un invitado, cuando pulsa el corazón de una canción, entonces se abre el modal de acceso. | Aprobado |
| C-05 | PA-03 | RF-04 / RNF-01 | Dado el hook del reproductor, cuando se llama a `playSong`, entonces se reproduce en <2000 ms (umbral) y `togglePlay` pausa. | Aprobado |
| C-06 | PA-03 | RF-04 | Dada una cola de 3 pistas, cuando se llama a `next()` y `previous()`, entonces cambia a la pista 2 y vuelve a la 1. | Aprobado |
| C-07 | PA-03 | RF-04 | Dada una pista en reproducción, cuando se dispara el evento `ended`, entonces se reproduce automáticamente la siguiente. | Aprobado |
| C-08 | PA-04 | RF-09 | Dado el hook, cuando se fija volumen 0,35 y luego 0, entonces `audio.volume` cambia y `audio.muted` pasa a `true`. | Aprobado |
| C-09 | PA-04 | RF-09 | Dado el hook, cuando se alterna `toggleMute` dos veces, entonces `audio.muted` pasa a `true` y luego a `false`. | Aprobado |
| C-10 | PA-04 | RF-09 | Dado el hook, cuando se envían volúmenes 7 y -3, entonces se limitan a 1 y 0. | Aprobado |
| C-11 | PA-11 | RNF-02 | Dado el `index.html`, cuando se inspecciona, entonces contiene el meta viewport `width=device-width`. | Aprobado |
| C-12 | PA-11 | RNF-02 | Dado `styles.css`, cuando se inspecciona, entonces existen media queries en 900, 700 y 460 px. | Aprobado |
| C-13 | PA-11 | RNF-02 | Dado `styles.css`, cuando se inspecciona, entonces la estructura usa grid y `100dvh`. | Aprobado |
| C-14 | Apoyo | RF-04 | Dada la utilidad `formatTime`, cuando se formatean 0/5/65/3599/NaN/undefined, entonces se obtienen `0:00`, `0:05`, `1:05`, `59:59`, `0:00`, `0:00`. | Aprobado |
| C-15 | Apoyo | RF-07 / RF-08 | Dadas las utilidades, cuando se generan iniciales y etiquetas, entonces se obtienen "AT", "TM", "AAC", "FLAC", "1 canción" y "5 canciones". | Aprobado |
| C-16 | PA-02 | RF-03 | Dada la utilidad `matchesSong`, cuando se buscan "NEÓN", "luna" o "ciudad", entonces coincide; con "zzz" no coincide. | Aprobado |
