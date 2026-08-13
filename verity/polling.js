// =========================================================
// verity-polling.js
// Módulo compartido: le pregunta al Tablero cada 1.5s si hay
// un evento nuevo. Tanto la página del celular como la de la TV
// incluyen este mismo archivo — lo único que cambia es qué hace
// cada una cuando llega un evento (ver celular-voz.html y
// tv-ventana.html).
// =========================================================

const TABLERO_URL = "https://script.google.com/macros/s/AKfycbyQHFmrZeorHSBa-1D9hoDPPosxMsH_vqaCPl6SyUvRXlUpR42xFr07vDZSFIkfIfwS/exec";
const CLAVE = "bruno2026"; // debe coincidir con CLAVE_SECRETA del Tablero
const INTERVALO_MS = 1500;

let ultimoEventoVisto = null;

/**
 * Empieza a preguntarle al Tablero cada 1.5s.
 * @param {function(string)} alRecibirEvento - función que tú defines,
 *        se ejecuta solo cuando llega un evento NUEVO (no se repite
 *        aunque el Tablero siga contestando lo mismo).
 */
function iniciarSondeo(alRecibirEvento) {
  setInterval(async () => {
    try {
      const resp = await fetch(`${TABLERO_URL}?clave=${CLAVE}`);
      const datos = await resp.json();

      if (
        datos.evento &&
        datos.evento !== "ninguno" &&
        datos.evento !== ultimoEventoVisto
      ) {
        ultimoEventoVisto = datos.evento;
        alRecibirEvento(datos.evento);
      }
    } catch (error) {
      console.error("Error consultando el Tablero:", error);
    }
  }, INTERVALO_MS);
}
