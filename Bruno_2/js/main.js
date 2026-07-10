// ================================================================
// main.js — Núcleo de la app Bruno_2
//
// Este archivo hace tres cosas:
//   1. Define el ESTADO de la app (qué candados están abiertos,
//      qué misiones están completadas, en qué capítulo va Bruno).
//   2. Provee funciones para LEER y GUARDAR ese estado en localStorage,
//      para que el progreso persista entre sesiones.
//   3. Controla la NAVEGACIÓN entre pantallas y la música de fondo.
//
// Los demás archivos JS (locks.js, map.js, contact.js) usan las
// variables y funciones definidas aquí (ya que se cargan después).
// ================================================================


// ----------------------------------------------------------------
// CONFIGURACIÓN GLOBAL
// ----------------------------------------------------------------

// Clave usada para guardar/leer el progreso en localStorage.
// Si cambias esto, todos los usuarios empezarán desde cero.
const STORAGE_KEY = 'bruno2_progreso';

// Estado inicial: lo que hay la PRIMERA VEZ que Bruno abre la app.
const ESTADO_INICIAL = {
  candadosAbiertos:     [false, false, false],          // 3 candados
  misionesCompletadas:  [false, false, false, false, false], // 5 misiones
  capitulo:             1,      // capítulo actual de la historia (1, 2, 3…)
  pantallaActual:       'locks' // 'locks' o 'map'
};


// ----------------------------------------------------------------
// ESTADO GLOBAL (se carga al inicio desde localStorage)
// ----------------------------------------------------------------

// Esta variable está disponible para todos los otros archivos JS.
let progreso = getProgreso();


// ----------------------------------------------------------------
// FUNCIONES DE ESTADO
// ----------------------------------------------------------------

/**
 * getProgreso()
 * Lee el progreso guardado en localStorage.
 * Si no hay nada (primera visita), devuelve una copia del ESTADO_INICIAL.
 */
function getProgreso() {
  const datos = localStorage.getItem(STORAGE_KEY);
  if (datos) {
    try {
      return JSON.parse(datos);
    } catch (e) {
      // Si el JSON estaba corrupto, reiniciamos desde cero
      console.warn('[Bruno2] Progreso corrupto, reiniciando.', e);
    }
  }
  // JSON.parse + JSON.stringify = copia profunda (sin referencias compartidas)
  return JSON.parse(JSON.stringify(ESTADO_INICIAL));
}

/**
 * guardarProgreso(estado)
 * Guarda el objeto de estado completo en localStorage.
 * Llamar esto cada vez que algo cambia (candado abierto, misión completada, etc.)
 */
function guardarProgreso(estado) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

/**
 * reiniciarProgreso()
 * Borra todo el progreso y recarga la app desde cero.
 * Útil durante el desarrollo. Llamar desde la consola del navegador:
 *   reiniciarProgreso()
 */
function reiniciarProgreso() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

// Exponer globalmente para poder llamar desde la consola del navegador
window.reiniciarProgreso = reiniciarProgreso;


// ----------------------------------------------------------------
// NAVEGACIÓN ENTRE PANTALLAS
// ----------------------------------------------------------------

/**
 * mostrarPantalla(id)
 * Oculta todas las pantallas y muestra solo la indicada.
 * @param {string} id - ID del elemento <div class="screen">, ej. 'screen-locks'
 */
function mostrarPantalla(id) {
  // Ocultar todas las pantallas
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));

  // Mostrar la pantalla pedida
  const objetivo = document.getElementById(id);
  if (objetivo) {
    objetivo.classList.remove('hidden');
  } else {
    console.error('[Bruno2] Pantalla no encontrada:', id);
  }
}

/**
 * transicionAlMapa()
 * Anima un flash de luz y luego muestra la pantalla del mapa.
 * Se llama desde locks.js cuando se abren los 3 candados.
 */
function transicionAlMapa() {
  const overlay = document.getElementById('transition-overlay');

  // Mostrar el overlay de transición con animación
  overlay.classList.remove('hidden');
  overlay.classList.add('animating');

  // Después de la animación, cambiar a la pantalla del mapa
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('animating');

    mostrarPantalla('screen-map');
    progreso.pantallaActual = 'map';
    guardarProgreso(progreso);

    // Inicializar el mapa (función definida en map.js)
    if (typeof inicializarMapa === 'function') {
      inicializarMapa();
    }
  }, 1400);
}


// ----------------------------------------------------------------
// AUDIO
// ----------------------------------------------------------------

// Evitar intentar reproducir la música múltiples veces
let musicaIniciada = false;

/**
 * iniciarMusica()
 * Inicia la música de fondo. Los navegadores modernos bloquean
 * el audio hasta que el usuario toca algo, por eso se llama
 * desde el primer evento de toque o clic.
 */
function iniciarMusica() {
  if (musicaIniciada) return;
  musicaIniciada = true;

  const audioBg = document.getElementById('audio-bg');
  if (!audioBg) return;

  audioBg.volume = 0.2; // Volumen bajo para no distraer (0 = mudo, 1 = máximo)
  audioBg.play().catch(err => {
    // El navegador puede rechazar la reproducción sin interacción previa.
    // En ese caso simplemente lo ignoramos — el juego funciona sin música.
    console.log('[Bruno2] Audio de fondo no disponible:', err.message);
  });
}

/**
 * reproducirSonido(audioId)
 * Reproduce un efecto de sonido corto (click, unlock, etc.).
 * @param {string} audioId - ID del elemento <audio> en el HTML
 */
function reproducirSonido(audioId) {
  const el = document.getElementById(audioId);
  if (!el) return;

  // Rebobinar al inicio para poder reproducirlo varias veces seguidas
  el.currentTime = 0;
  el.play().catch(() => {
    // Ignorar si el audio no está disponible (archivo faltante, política del navegador, etc.)
  });
}


// ----------------------------------------------------------------
// INICIALIZACIÓN PRINCIPAL
// ----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

  // Iniciar música la primera vez que el usuario toca o hace clic
  document.body.addEventListener('touchstart', iniciarMusica, { once: true });
  document.body.addEventListener('click',      iniciarMusica, { once: true });

  // Corrección de estado inconsistente: si todos los candados están
  // abiertos pero la pantalla guardada es 'locks', ir al mapa directamente.
  if (progreso.candadosAbiertos.every(Boolean)) {
    progreso.pantallaActual = 'map';
    guardarProgreso(progreso);
  }

  // Restaurar la pantalla según el estado guardado
  if (progreso.pantallaActual === 'map') {
    mostrarPantalla('screen-map');
    // inicializarMapa() se llama desde map.js cuando el DOM está listo
  } else {
    mostrarPantalla('screen-locks');
    // inicializarCandados() se llama desde locks.js cuando el DOM está listo
  }

  // Cerrar overlays con la tecla Escape (útil durante desarrollo en desktop)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay-screen').forEach(s => s.classList.add('hidden'));
      document.getElementById('mission-modal')?.classList.add('hidden');
    }
  });

});
