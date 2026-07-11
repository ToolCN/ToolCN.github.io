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
  candadosAbiertos:      [false, false],          // 2 candados
  pantallaActual:        'start', // 'start' → 'locks' → 'map'

  // --- Sistema de los 9 sospechosos ---
  sospechososRevisados: [false, false, false, false, false, false, false, false, false],
  ultimoVencido:        null,   // slug del último sospechoso vencido (para la pista de Foxy)
  casoResuelto:         false,  // true después de la llamada final de Foxy (revela a Buck)
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
/**
 * alTocarBoton(el, handler)
 * Conecta un botón tanto a "touchstart" (respuesta inmediata en
 * tablet) como a "click" (para poder probar desde computadora),
 * sin que se dispare dos veces en pantallas táctiles. Se usa en
 * TODOS los botones de "Contestar"/"Colgar"/"Llamar" para que
 * respondan siempre al primer toque (antes a veces no reaccionaban
 * a la primera porque solo estaban conectados a "click", que en
 * tablets tarda ~300ms o a veces se pierde si el dedo se mueve
 * un poquito).
 */
function alTocarBoton(el, handler) {
  if (!el) return;
  let disparadoPorTouch = false;
  el.addEventListener('touchstart', e => {
    e.preventDefault();
    disparadoPorTouch = true;
    handler(e);
  }, { passive: false });
  el.addEventListener('click', e => {
    if (disparadoPorTouch) { disparadoPorTouch = false; return; }
    handler(e);
  });
}

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

    // Música distinta para el mapa (se detiene la de los candados sola)
    cambiarMusica('audio-bg-mapa');

    // Inicializar el mapa (función definida en map.js)
    if (typeof inicializarMapa === 'function') {
      inicializarMapa();
    }
  }, 1400);
}


// ----------------------------------------------------------------
// AUDIO
// ----------------------------------------------------------------

// IDs de las pistas de música de fondo que existen en la app.
// Si agregas una pista nueva para otra pantalla, súmala aquí.
const PISTAS_MUSICA_FONDO = ['audio-bg', 'audio-bg-mapa'];

// Volumen bajo para que la música NUNCA opaque los efectos de
// sonido (click, unlock, cadena cayendo, voces, etc.)
const VOLUMEN_MUSICA_FONDO = 0.12;

/**
 * cambiarMusica(nuevoId)
 * Pausa cualquier música de fondo que esté sonando y reproduce la
 * pista pedida. Se usa para tener una pista distinta en cada
 * pantalla (candados vs. mapa).
 * @param {string} nuevoId - ID del <audio> a reproducir, ej. 'audio-bg-mapa'
 */
function cambiarMusica(nuevoId) {
  const nuevo = document.getElementById(nuevoId);
  if (!nuevo) return;

  // Pausar todas las demás pistas de fondo (para que no se encimen)
  PISTAS_MUSICA_FONDO.forEach(id => {
    if (id === nuevoId) return;
    const otra = document.getElementById(id);
    if (otra && !otra.paused) {
      otra.pause();
      otra.currentTime = 0;
    }
  });

  // Si la pista pedida ya está sonando, no reiniciarla
  if (!nuevo.paused) return;

  nuevo.volume = VOLUMEN_MUSICA_FONDO;
  nuevo.play().catch(err => {
    // El navegador puede rechazar la reproducción si no hubo un toque
    // directo del usuario justo antes. Se ignora — el juego sigue
    // funcionando sin música de fondo.
    console.log('[Bruno2] No se pudo reproducir', nuevoId + ':', err.message);
  });
}

/**
 * iniciarMusica()
 * Función de "seguro": si por alguna razón ninguna música de fondo
 * está sonando todavía (por ejemplo, la primera vez que Bruno toca
 * una rueda del candado), arranca la de candados. Normalmente esto
 * ya no hace falta, porque la música se dispara explícitamente:
 *   - al terminar la llamada de introducción (ver js/intro.js)
 *   - al entrar al mapa (ver transicionAlMapa más abajo)
 */
function iniciarMusica() {
  const yaSuenaAlgo = PISTAS_MUSICA_FONDO.some(id => {
    const el = document.getElementById(id);
    return el && !el.paused;
  });
  if (yaSuenaAlgo) return;

  cambiarMusica('audio-bg');
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
  el.play().catch(err => {
    // Ignorar si el audio no está disponible, pero avisar en consola
    // para que sea fácil detectar archivos con el nombre equivocado.
    console.log('[Bruno2] No se pudo reproducir', audioId + ':', err.message);
  });
}


// ----------------------------------------------------------------
// BOTÓN DE REINICIO (esquina superior derecha, discreto)
// ----------------------------------------------------------------

/**
 * inicializarBotonReinicio()
 * Conecta el botón de reinicio con su modal de confirmación.
 * El botón por sí solo NO borra nada: primero siempre pide confirmar,
 * para evitar que Bruno lo toque por accidente y pierda su progreso.
 */
function inicializarBotonReinicio() {
  const btnReinicio = document.getElementById('reset-btn');
  const modal        = document.getElementById('reset-modal');
  const btnConfirmar  = document.getElementById('reset-confirm');
  const btnCancelar   = document.getElementById('reset-cancel');

  if (!btnReinicio || !modal) return; // Por si el HTML aún no tiene estos elementos

  // Al tocar el botón: mostrar el modal de confirmación (todavía no borra nada)
  btnReinicio.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  // Confirmar: aquí sí se borra el progreso y se recarga la app
  btnConfirmar.addEventListener('click', () => {
    reiniciarProgreso();
  });

  // Cancelar: solo cerrar el modal, sin tocar el progreso
  btnCancelar.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}


// ----------------------------------------------------------------
// INICIALIZACIÓN PRINCIPAL
// ----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

  // Conectar el botón de reinicio (esquina superior derecha) con su modal
  inicializarBotonReinicio();

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
  } else if (progreso.pantallaActual === 'locks') {
    mostrarPantalla('screen-locks');
    // inicializarCandados() se llama desde locks.js cuando el DOM está listo
  } else {
    // 'start' (o cualquier valor inesperado): mostrar la pantalla de inicio.
    // Ahí Bruno toca START, lo que dispara la llamada de introducción
    // (ver js/intro.js) y solo después de contestarla pasa a los candados.
    mostrarPantalla('screen-start');
  }

  // Botón START: arranca la llamada de introducción
  document.getElementById('start-btn')?.addEventListener('click', () => {
    mostrarPantalla('screen-start'); // se queda de fondo mientras "suena" la llamada
    if (typeof iniciarSecuenciaIntro === 'function') {
      iniciarSecuenciaIntro();
    }
  });

  // Cerrar overlays con la tecla Escape (útil durante desarrollo en desktop)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay-screen').forEach(s => s.classList.add('hidden'));
      document.getElementById('screen-buck')?.classList.add('hidden');
    }
  });

});
