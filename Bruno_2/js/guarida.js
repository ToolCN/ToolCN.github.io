// ================================================================
// guarida.js — La guarida de cada sospechoso
//
// FLUJO COMPLETO de una guarida (todo dentro de #screen-guarida):
//   1. Bruno entra → ve fondo + personaje + botón "Llamar"
//   2. Toca "Llamar" → suena el tono de LLAMADA SALIENTE (ttt-ttt-ttt)
//      entre 5 y 10 segundos (aleatorio)
//   3. Contesta el sospechoso → se reproduce su confesión (termina
//      diciendo que hay que superar un reto) → aparece el minijuego
//   4. Bruno gana el minijuego → espera entre 5 y 10 segundos
//      (aleatorio) → el sospechoso llama de VUELTA (llamada entrante)
//   5. Si Bruno cuelga esa llamada sin contestar, vuelve a sonar
//      sola 3 segundos después — así hasta que la conteste
//   6. Al contestar → se reproduce el audio de "éxito" (la confesión
//      final/graciosa) → se abre la caja secreta con el hallazgo
//   7. Ese sospechoso queda marcado como vencido (tache rojo) y no
//      se puede volver a entrar a su guarida
//
// El teléfono para pedirle pistas a FOXY (contact-btn) es un sistema
// aparte: solo aparece en la pantalla de sospechosos, nunca dentro
// de una guarida.
// ================================================================


// ----------------------------------------------------------------
// REPRODUCTOR DE VOZ DINÁMICO
// ----------------------------------------------------------------

/**
 * reproducirVoz(ruta, onEnded)
 * Único reproductor para las voces de los sospechosos: se le cambia
 * el "src" antes de reproducir en vez de tener un <audio> por cada
 * archivo.
 */
function reproducirVoz(ruta, onEnded) {
  const el = document.getElementById('audio-dinamico');
  if (!el) return;

  el.pause();
  el.src = ruta;
  el.currentTime = 0;
  el.onended = onEnded || null;

  el.play().catch(err => {
    console.log('[Bruno2] No se pudo reproducir', ruta + ':', err.message);
    if (onEnded) onEnded();
  });
}

/**
 * numAleatorio(min, max)
 * Entero aleatorio entre min y max (ambos incluidos). Se usa para
 * los tiempos de espera "entre 5 y 10 segundos", etc.
 */
function numAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// ----------------------------------------------------------------
// CONTROL DE TEMPORIZADORES DE LA GUARIDA
// ----------------------------------------------------------------
// Guarda cualquier setTimeout pendiente del flujo de llamada actual,
// para poder cancelarlo si Bruno sale de la guarida a medias (botón
// "Volver"), y así no queden llamadas sonando de fondo.

let temporizadorGuarida = null;

function programarGuarida(fn, ms) {
  temporizadorGuarida = setTimeout(fn, ms);
  return temporizadorGuarida;
}

function limpiarTemporizadorGuarida() {
  if (temporizadorGuarida) {
    clearTimeout(temporizadorGuarida);
    temporizadorGuarida = null;
  }
}


// ----------------------------------------------------------------
// SONIDOS DE LLAMADA (tono saliente y ringtone entrante)
// ----------------------------------------------------------------

function reproducirTonoLlamando() {
  const el = document.getElementById('audio-tono-llamando');
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {});
}
function detenerTonoLlamando() {
  const el = document.getElementById('audio-tono-llamando');
  if (el) { el.pause(); el.currentTime = 0; }
}
function reproducirRingtone() {
  const el = document.getElementById('audio-ringtone');
  if (!el) return;
  el.currentTime = 0;
  el.play().catch(() => {});
}
function detenerRingtone() {
  const el = document.getElementById('audio-ringtone');
  if (el) { el.pause(); el.currentTime = 0; }
}


// ----------------------------------------------------------------
// MOSTRAR SOLO UN "ESTADO" DE LA GUARIDA A LA VEZ
// ----------------------------------------------------------------

const ESTADOS_GUARIDA = [
  'guarida-llamar-btn',
  'guarida-llamando',
  'minijuego-container',
  'guarida-esperando',
  'guarida-llamada-entrante',
  'caja-secreta',
];

function ocultarTodosLosEstadosGuarida() {
  ESTADOS_GUARIDA.forEach(id => document.getElementById(id)?.classList.add('hidden'));
}


// ----------------------------------------------------------------
// PASO 1: ABRIR LA GUARIDA
// ----------------------------------------------------------------

let sospechosoActual = null; // objeto del sospechoso cuya guarida está abierta

function abrirGuarida(sosp) {
  limpiarTemporizadorGuarida();
  detenerTonoLlamando();
  detenerRingtone();
  if (typeof detenerMinijuegoActual === 'function') detenerMinijuegoActual();

  sospechosoActual = sosp;

  mostrarPantalla('screen-guarida');

  // El teléfono de pistas de Foxy solo vive en la pantalla de sospechosos
  document.getElementById('contact-btn')?.classList.add('hidden');

  const num = String(sosp.id + 1).padStart(2, '0');

  const bg = document.getElementById('guarida-bg');
  bg.style.backgroundImage = `url('assets/images/guaridas/guarida-${num}-${sosp.slug}.jpg')`;

  const img = document.getElementById('guarida-personaje-img');
  img.style.display = '';
  img.src = `assets/images/sospechosos/${num}-${sosp.slug}.jpg`;
  img.alt = sosp.nombre;

  document.getElementById('guarida-nombre').textContent = sosp.nombre;

  document.getElementById('caja-icono').textContent = '🔒';
  document.getElementById('caja-icono').classList.remove('caja-abierta', 'caja-abriendose');
  const hallazgoImg = document.getElementById('hallazgo-img');
  hallazgoImg.classList.add('hidden');
  hallazgoImg.classList.remove('hallazgo-emergiendo');
  hallazgoImg.style.display = '';
  document.getElementById('guarida-continuar-btn').classList.add('hidden');

  ocultarTodosLosEstadosGuarida();
  document.getElementById('guarida-llamar-btn').classList.remove('hidden');
}


// ----------------------------------------------------------------
// PASO 2: LLAMAR (tono de llamada saliente, 5-10s aleatorio)
// ----------------------------------------------------------------

function iniciarLlamadaSaliente() {
  ocultarTodosLosEstadosGuarida();
  document.getElementById('guarida-llamando').classList.remove('hidden');
  reproducirTonoLlamando();

  const espera = numAleatorio(5000, 10000);
  programarGuarida(contestarLlamadaSaliente, espera);
}

function contestarLlamadaSaliente() {
  detenerTonoLlamando();
  ocultarTodosLosEstadosGuarida();

  const sosp = sospechosoActual;
  const num = String(sosp.id + 1).padStart(2, '0');

  reproducirVoz(`assets/audio/voz-sospechoso-${num}-${sosp.slug}.mp3`);

  const container = document.getElementById('minijuego-container');
  container.classList.remove('hidden');
  container.innerHTML = '';

  if (window.MINIJUEGOS && window.MINIJUEGOS[sosp.juego]) {
    window.MINIJUEGOS[sosp.juego](container, onMinijuegoGanado);
  } else {
    console.warn('[Bruno2] Minijuego no encontrado para:', sosp.juego);
  }
}


// ----------------------------------------------------------------
// PASO 3: GANAR EL MINIJUEGO → esperar y recibir la llamada de vuelta
// ----------------------------------------------------------------

function onMinijuegoGanado() {
  if (typeof detenerMinijuegoActual === 'function') detenerMinijuegoActual();

  ocultarTodosLosEstadosGuarida();
  document.getElementById('guarida-esperando').classList.remove('hidden');

  const espera = numAleatorio(5000, 10000);
  programarGuarida(mostrarLlamadaEntrante, espera);
}

function mostrarLlamadaEntrante() {
  ocultarTodosLosEstadosGuarida();
  document.getElementById('guarida-llamada-entrante').classList.remove('hidden');
  reproducirRingtone();
}

function contestarLlamadaEntrante() {
  limpiarTemporizadorGuarida();
  detenerRingtone();
  ocultarTodosLosEstadosGuarida();

  const sosp = sospechosoActual;
  const num = String(sosp.id + 1).padStart(2, '0');

  // Mostrar la caja todavía CERRADA, y arrancar el sonido de apertura
  // y la voz del sospechoso al mismo tiempo, justo al contestar.
  const caja = document.getElementById('caja-secreta');
  caja.classList.remove('hidden');
  const cajaIcono = document.getElementById('caja-icono');
  cajaIcono.textContent = '🔒';
  cajaIcono.classList.remove('caja-abierta');
  cajaIcono.classList.add('caja-abriendose');

  const hallazgoImg = document.getElementById('hallazgo-img');
  hallazgoImg.classList.add('hidden');
  hallazgoImg.classList.remove('hallazgo-emergiendo');
  document.getElementById('guarida-continuar-btn').classList.add('hidden');

  reproducirSonido('audio-caja-abre'); // dura ~3s mientras se abre
  reproducirVoz(`assets/audio/voz-exito-${num}-${sosp.slug}.mp3`);

  // Esperar los 3 segundos del sonido de apertura antes de revelar
  // el hallazgo, con una animación de que "sale" de la caja.
  registrarTemporizadorGuarida3s(() => {
    cajaIcono.textContent = '🔓';
    cajaIcono.classList.remove('caja-abriendose');
    cajaIcono.classList.add('caja-abierta');

    hallazgoImg.style.display = '';
    hallazgoImg.src = `assets/images/hallazgos/hallazgo-${num}-${sosp.slug}.jpg`;
    hallazgoImg.classList.remove('hidden');
    hallazgoImg.classList.add('hallazgo-emergiendo');

    document.getElementById('guarida-continuar-btn').classList.remove('hidden');
  });

  if (typeof marcarSospechosoRevisado === 'function') {
    marcarSospechosoRevisado(sosp.id);
  }
}

/**
 * registrarTemporizadorGuarida3s(fn)
 * Pequeño ayudante para el retraso fijo de 3 segundos de la caja,
 * registrado igual que los demás temporizadores de la guarida para
 * poder cancelarlo si Bruno sale a medias.
 */
function registrarTemporizadorGuarida3s(fn) {
  programarGuarida(fn, 3000);
}

/**
 * colgarLlamadaEntrante()
 * Si Bruno cuelga sin contestar, la llamada vuelve a sonar sola
 * 3 segundos después. Se repite hasta que la conteste.
 */
function colgarLlamadaEntrante() {
  detenerRingtone();
  ocultarTodosLosEstadosGuarida();
  document.getElementById('guarida-esperando').classList.remove('hidden');
  programarGuarida(mostrarLlamadaEntrante, 3000);
}


// ----------------------------------------------------------------
// SALIR DE LA GUARIDA
// ----------------------------------------------------------------

function volverASospechosos() {
  limpiarTemporizadorGuarida();
  detenerTonoLlamando();
  detenerRingtone();
  if (typeof detenerMinijuegoActual === 'function') detenerMinijuegoActual();

  const dinamico = document.getElementById('audio-dinamico');
  if (dinamico) dinamico.pause();

  sospechosoActual = null;

  mostrarPantalla('screen-map');
  progreso.pantallaActual = 'map';
  guardarProgreso(progreso);

  if (typeof inicializarMapa === 'function') inicializarMapa();
}


// ----------------------------------------------------------------
// TELÉFONO: BRUNO LLAMA A FOXY PIDIENDO UNA PISTA
// (solo existe en la pantalla de sospechosos)
// ----------------------------------------------------------------

function llamarAFoxy() {
  enLlamadaFinal = false; // por seguridad: esta es una llamada normal de pistas
  document.getElementById('btn-answer')?.classList.add('hidden');

  const overlay = document.getElementById('screen-call');
  const statusEl = document.getElementById('call-status-text');
  overlay.classList.remove('hidden');
  document.getElementById('call-rings')?.classList.remove('hidden');
  statusEl.textContent = 'Llamando...';

  reproducirTonoLlamando();

  setTimeout(() => {
    detenerTonoLlamando();
    document.getElementById('call-rings')?.classList.add('hidden');
    statusEl.textContent = 'Foxy: hablando...';

    const slug = progreso.ultimoVencido;
    let ruta;
    if (slug) {
      const idx = SOSPECHOSOS.findIndex(s => s.slug === slug);
      const num = String(idx + 1).padStart(2, '0');
      ruta = `assets/audio/pista-${num}-${slug}.mp3`;
    } else {
      ruta = 'assets/audio/pista-general.mp3';
    }

    reproducirVoz(ruta, () => {
      statusEl.textContent = 'Llamada finalizada';
    });
  }, numAleatorio(2000, 3000));
}


// ----------------------------------------------------------------
// CONECTAR TODOS LOS BOTONES
// ----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  alTocarBoton(document.getElementById('contact-btn'), llamarAFoxy);

  alTocarBoton(document.getElementById('btn-answer'), contestarLlamadaFinal);

  alTocarBoton(document.getElementById('btn-hangup'), () => {
    if (enLlamadaFinal) {
      colgarLlamadaFinal();
      return;
    }
    // Llamada normal (Bruno pidiéndole una pista a Foxy): solo cerrar
    document.getElementById('screen-call')?.classList.add('hidden');
    detenerTonoLlamando();
    const dinamico = document.getElementById('audio-dinamico');
    if (dinamico) dinamico.pause();
  });

  alTocarBoton(document.getElementById('guarida-back-btn'), volverASospechosos);
  alTocarBoton(document.getElementById('guarida-continuar-btn'), volverASospechosos);
  alTocarBoton(document.getElementById('guarida-llamar-btn'), iniciarLlamadaSaliente);
  alTocarBoton(document.getElementById('guarida-btn-contestar'), contestarLlamadaEntrante);
  alTocarBoton(document.getElementById('guarida-btn-colgar'), colgarLlamadaEntrante);
});


// ----------------------------------------------------------------
// LLAMADA FINAL: FOXY REVELA QUE FUE BUCK
// ----------------------------------------------------------------

// true mientras la pantalla de llamada (#screen-call) está mostrando
// la llamada FINAL de Foxy — así el botón de colgar compartido sabe
// si debe comportarse como la llamada final (con rellamada) o como
// una llamada normal de pistas (simplemente cerrar).
let enLlamadaFinal = false;

function iniciarLlamadaFinal() {
  progreso.casoResuelto = true;
  guardarProgreso(progreso);
  mostrarLlamadaFinalEntrante();
}

function mostrarLlamadaFinalEntrante() {
  enLlamadaFinal = true;

  const overlay = document.getElementById('screen-call');
  const statusEl = document.getElementById('call-status-text');
  overlay.classList.remove('hidden');
  document.getElementById('call-rings')?.classList.remove('hidden');
  document.getElementById('btn-answer')?.classList.remove('hidden');
  statusEl.textContent = 'Llamada entrante...';

  reproducirRingtone();
}

function contestarLlamadaFinal() {
  detenerRingtone();
  document.getElementById('call-rings')?.classList.add('hidden');
  document.getElementById('btn-answer')?.classList.add('hidden');
  const statusEl = document.getElementById('call-status-text');
  statusEl.textContent = 'Foxy: hablando...';

  reproducirVoz('assets/audio/voz-final-foxy.mp3', () => {
    statusEl.textContent = 'Llamada finalizada';

    setTimeout(() => {
      enLlamadaFinal = false;
      document.getElementById('screen-call').classList.add('hidden');
      mostrarPantalla('screen-map');
      progreso.pantallaActual = 'map';
      guardarProgreso(progreso);
      if (typeof inicializarMapa === 'function') inicializarMapa();

      // El caso queda cerrado: ya no se puede llamar a Foxy de nuevo
      document.getElementById('contact-btn')?.classList.add('hidden');

      // Mostrar a Buck a pantalla completa automáticamente, sin
      // necesidad de tocar nada — el juego termina aquí.
      document.getElementById('screen-buck')?.classList.remove('hidden');
    }, 1200);
  });
}

/**
 * colgarLlamadaFinal()
 * Si Bruno cuelga sin contestar la llamada final, vuelve a sonar
 * sola 3 segundos después (igual que la llamada de vuelta de cada
 * sospechoso) — así nunca se queda "atorado" el final del juego.
 */
function colgarLlamadaFinal() {
  detenerRingtone();
  document.getElementById('screen-call').classList.add('hidden');
  document.getElementById('btn-answer')?.classList.add('hidden');
  setTimeout(mostrarLlamadaFinalEntrante, 3000);
}

window.iniciarLlamadaFinal = iniciarLlamadaFinal;
