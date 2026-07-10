# Archivos de imagen necesarios

Coloca en esta carpeta los siguientes archivos de imagen:

| Archivo | Dónde se usa | Descripción |
|---|---|---|
| `mapa.jpg` | Fondo de `#screen-map` en CSS | Mapa ilustrado de las misiones |
| `personaje.jpg` | Avatar en llamada y chat | Foto o ilustración del personaje Agente X |
| `chat-bg.png` (opcional) | Fondo del área de mensajes | Patrón de fondo estilo WhatsApp |

### Cómo activar cada imagen

**Mapa** — en `css/styles.css`, busca el comentario `TODO: reemplazar este degradado CSS` y agrega:
```css
background-image: url('../assets/images/mapa.jpg');
background-size: cover;
background-position: center;
```

**Personaje en llamada** — en `css/styles.css`, busca `.caller-avatar` y agrega:
```css
background-image: url('../assets/images/personaje.jpg');
background-size: cover;
```

**Personaje en chat** — busca `.chat-avatar` y haz lo mismo.
