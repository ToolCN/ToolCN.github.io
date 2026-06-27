# Materia Prima PWA — ToolCN

App móvil tipo PWA para consulta y liberación de materia prima en Planta Querétaro.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app completa (pantalla, lógica, estilos) |
| `manifest.json` | Le dice al celular cómo instalarla |
| `sw.js` | Service Worker: permite uso offline |
| `icon-192.png` | Ícono de la app en el celular |
| `icon-512.png` | Ícono grande (pantalla de carga) |

## Cómo instalar en el celular

1. Abrir `https://toolcn.github.io/toolcn-pwa/` en Chrome
2. Chrome muestra el banner **"Instalar app"** → tocar Instalar
3. Aparece en el menú del celular como app normal

## Configuración (primera vez)

1. Abrir la app → tocar **"Configurar URL"**
2. Pegar la URL del Web App de GAS
3. Guardar → los datos cargan automáticamente

## Cómo conectar con Google Sheets

Implementa un Web App en Google Apps Script que responda:
- `GET ?accion=getMateriaPrima` → `{ ok: true, datos: [...] }`
- `POST` con `{ accion: 'setEstatus', colada, estatus }` → `{ ok: true }`