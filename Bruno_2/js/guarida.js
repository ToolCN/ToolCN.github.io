// ================================================================
// guarida.js — La guarida de cada sospechoso
//
// Este archivo maneja:
//   - abrirGuarida(sospechoso): fondo + personaje + confesión + minijuego
//   - onMinijuegoGanado(sospechoso): abre la caja, muestra el hallazgo
//   - reproducirVoz(ruta): único reproductor para las 27 voces de los
//     9 sospechosos (en vez de 27 elementos <audio> distintos en el HTML)
//   - El teléfono: Bruno llama a Foxy y recibe una pista distinta según
//     qué sospechoso tenga abierto en ese momento
//   - iniciarLlamadaFinal(): la llamada de Foxy que revela a Buck
// ================================================================


// ----------------------------------------------------------------
// REPRODUCTOR DE VOZ DINÁMICO
// ----------------------------------------------------------------

/**
 * reproducirVoz(ruta, onEnded)
 * Reproduce cualquiera de las voces de los sospechosos usando el
 * ÚNICO elemento <audio id="audio-dinamico"> del HTML. Le cambia el
 * "src" antes de reproducir, en vez de tener 27 audios distintos
 * declarados en el HTML.
 * @param {string} ruta - ej. 'assets/audio/voz-sospechoso-01-reylobo.mp3'
 * @param {Function} [onEnded] - se llama cuando termina de sonar
 */
function reproducirVoz(ruta, onEnded) {
  const el = document.getElementById('audio-dinamico');
  if (!el) return;

  el.pause();
  el.src = ruta;
  el.currentTime = 0;
  el.onended = onEnded || null;

  el.play().catch(err => {
    // Si el archivo todavía no existe (no lo has subido), no rompemos
    // el juego: solo avisamos en consola y seguimos como si hubiera
    // terminado de hablar.
    console.log('[Bruno2] No se pudo reproducir', ruta + ':', err.message);
    if (onEnded) onEnded();
  });
}


// ----------------------------------------------------------------
// ABRIR UNA GUARIDA
// ----------------------------------------------------------------

/**
 * abrirGuarida(sosp)
 * Se llama al tocar una tarjeta de sospechoso (ver map.js).
 * @param {Object} sosp - un objeto del array SOSPECHOSOS (ver map.js)
 */
function abrirGuarida(sosp) {
  // Detener cualquier minijuego que hubiera quedado corriendo de una
  // visita anterior (evita temporizadores fantasma en segundo plano)
  if (typeof detenerMinijuegoActual === 'function') detenerMinijuegoActual();

  // Recordar qué sospechoso está abierto (el teléfono lo usa para
  // saber qué pista reproducir)
  progreso.sospechosoSeleccionado = sosp.slug;
  guardarProgreso(progreso);

  mostrarPantalla('screen-guarida');

  // Número de archivo: id 0 → "01", id 8 → "09"
  const num = String(sosp.id + 1).padStart(2, '0');

  // Fondo de la guarida
  const bg = document.getElementById('guarida-bg');
  bg.style.backgroundImage = `url('assets/images/guaridas/guarida-${num}-${sosp.slug}.jpg')`;

  // Foto del personaje
  const img = document.getElementById('guarida-personaje-img');
  img.style.display = '';
  img.src = `assets/images/sospechosos/${num}-${sosp.slug}.jpg`;
  img.alt = sosp.nombre;

  document.getElementById('guarida-nombre').textContent = sosp.nombre;

  // Ocultar la caja (por si quedó abierta de una visita anterior a esta guarida)
  const caja = document.getElementById('caja-secreta');
  caja.classList.add('hidden');
  document.getElementById('caja-icono').textContent = '🔒';
  document.getElementById('caja-icono').classList.remove('caja-abierta');
  const hallazgoImg = document.getElementById('hallazgo-img');
  hallazgoImg.classList.add('hidden');
  hallazgoImg.style.display = '';
  document.getElementById('guarida-continuar-btn').classList.add('hidden');

  // Reproducir la confesión + planteamiento del reto
  reproducirVoz(`assets/audio/voz-sospechoso-${num}-${sosp.slug}.mp3`);

  // Lanzar el minijuego correspondiente (definido en minijuegos.js)
  const container = document.getElementById('minijuego-container');
  container.classList.remove('hidden');
  container.innerHTML = '';

  if (window.MINIJUEGOS && window.MINIJUEGOS[sosp.juego]) {
    window.MINIJUEGOS[sosp.juego](container, () => onMinijuegoGanado(sosp));
  } else {
    console.warn('[Bruno2] Minijuego no encontrado para:', sosp.juego);
  }
}


// ----------------------------------------------------------------
// GANAR EL MINIJUEGO → SE ABRE LA CAJA
// ----------------------------------------------------------------

/**
 * onMinijuegoGanado(sosp)
 * Se llama automáticamente desde dentro de cada minijuego cuando
 * Bruno lo completa con éxito.
 */
function onMinijuegoGanado(sosp) {
  if (typeof detenerMinijuegoActual === 'function') detenerMinijuegoActual();

  const num = String(sosp.id + 1).padStart(2, '0');

  // Limpiar el área del minijuego
  const container = document.getElementById('minijuego-container');
  container.innerHTML = '';
  container.classList.add('hidden');

  // Mostrar la caja abriéndose
  const caja = document.getElementById('caja-secreta');
  caja.classList.remove('hidden');
  document.getElementById('caja-icono').textContent = '🔓';
  document.getElementById('caja-icono').classList.add('caja-abierta');
  reproducirSonido('audio-caja-abre');

  // Un momento después: mostrar el hallazgo gracioso + la voz de éxito
  setTimeout(() => {
    const hallazgoImg = document.getElementById('hallazgo-img');
    hallazgoImg.style.display = '';
    hallazgoImg.src = `assets/images/hallazgos/hallazgo-${num}-${sosp.slug}.jpg`;
    hallazgoImg.classList.remove('hidden');

    reproducirVoz(`assets/audio/voz-exito-${num}-${sosp.slug}.mp3`);

    document.getElementById('guarida-continuar-btn').classList.remove('hidden');
  }, 500);

  // Marcar como revisado, guardar progreso, y ver si ya se completaron los 9
  // (función definida en map.js)
  if (typeof marcarSospechosoRevisado === 'function') {
    marcarSospechosoRevisado(sosp.id);
  }
}


// ----------------------------------------------------------------
// SALIR DE LA GUARIDA (botones "Volver" y "Volver a sospechosos")
// ----------------------------------------------------------------

function volverASospechosos() {
  if (typeof detenerMinijuegoActual === 'function') detenerMinijuegoActual();

  const dinamico = document.getElementById('audio-dinamico');
  if (dinamico) dinamico.pause();

  progreso.sospechosoSeleccionado = null;
  guardarProgreso(progreso);

  mostrarPantalla('screen-map');
  progreso.pantallaActual = 'map';
  guardarProgreso(progreso);

  if (typeof inicializarMapa === 'function') inicializarMapa();
}


// ----------------------------------------------------------------
// TELÉFONO: BRUNO LLAMA A FOXY PIDIENDO UNA PISTA
// ----------------------------------------------------------------

/**
 * llamarAFoxy()
 * Llamada SALIENTE (Bruno marca). Foxy contesta solo después de
 * "sonar" un momento, y da una pista distinta según qué sospechoso
 * tenga Bruno abierto en ese momento (o una pista genérica si está
 * en la pantalla de sospechosos sin ninguno abierto).
 */
function llamarAFoxy() {
  const overlay = document.getElementById('screen-call');
  const statusEl = document.getElementById('call-status-text');
  overlay.classList.remove('hidden');
  document.getElementById('call-rings')?.classList.remove('hidden');
  statusEl.textContent = 'Llamando...';

  const ringtone = document.getElementById('audio-ringtone');
  if (ringtone) {
    ringtone.currentTime = 0;
    ringtone.play().catch(() => {});
  }

  const timeoutId = setTimeout(() => {
    if (ringtone) { ringtone.pause(); ringtone.currentTime = 0; }
    document.getElementById('call-rings')?.classList.add('hidden');
    statusEl.textContent = 'Foxy: hablando...';

    // ¿Qué sospechoso tiene Bruno abierto ahora mismo?
    const slug = progreso.sospechosoSeleccionado;
    let ruta;
    if (slug) {
      const idx = SOSPECHOSOS.findIndex(s => s.slug === slug);
      const num = String(idx + 1).padStart(2, '0');
      ruta = `assets/audio/pista-${num}-${slug}.mp3`;
    } else {
      // No hay ningún sospechoso abierto (llamó desde la pantalla general)
      ruta = 'assets/audio/pista-general.mp3';
    }

    reproducirVoz(ruta, () => {
      statusEl.textContent = 'Llamada finalizada';
    });
  }, 1800);
}

// Botón flotante de teléfono
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('contact-btn')?.addEventListener('click', llamarAFoxy);

  document.getElementById('btn-hangup')?.addEventListener('click', () => {
    document.getElementById('screen-call')?.classList.add('hidden');
    const ringtone = document.getElementById('audio-ringtone');
    if (ringtone) { ringtone.pause(); ringtone.currentTime = 0; }
    const dinamico = document.getElementById('audio-dinamico');
    if (dinamico) dinamico.pause();
  });

  document.getElementById('guarida-back-btn')?.addEventListener('click', volverASospechosos);
  document.getElementById('guarida-continuar-btn')?.addEventListener('click', volverASospechosos);
});


// ----------------------------------------------------------------
// LLAMADA FINAL: FOXY REVELA QUE FUE BUCK
// ----------------------------------------------------------------

/**
 * iniciarLlamadaFinal()
 * Se dispara automáticamente 15 segundos después de revisar al
 * noveno sospechoso (ver map.js → marcarSospechosoRevisado()).
 */
function iniciarLlamadaFinal() {
  progreso.casoResuelto = true;
  guardarProgreso(progreso);

  const overlay = document.getElementById('screen-call');
  const statusEl = document.getElementById('call-status-text');
  overlay.classList.remove('hidden');
  document.getElementById('call-rings')?.classList.remove('hidden');
  statusEl.textContent = 'Llamada entrante...';

  const ringtone = document.getElementById('audio-ringtone');
  if (ringtone) {
    ringtone.currentTime = 0;
    ringtone.play().catch(() => {});
  }

  setTimeout(() => {
    if (ringtone) { ringtone.pause(); ringtone.currentTime = 0; }
    document.getElementById('call-rings')?.classList.add('hidden');
    statusEl.textContent = 'Foxy: hablando...';

    reproducirVoz('assets/audio/voz-final-foxy.mp3', () => {
      statusEl.textContent = 'Llamada finalizada';

      // Cerrar la llamada y llevar a Bruno de vuelta a la cuadrícula,
      // donde ahora aparece la tarjeta secreta de Buck.
      setTimeout(() => {
        overlay.classList.add('hidden');
        mostrarPantalla('screen-map');
        progreso.pantallaActual = 'map';
        guardarProgreso(progreso);
        if (typeof inicializarMapa === 'function') inicializarMapa();
      }, 1200);
    });
  }, 2200);
}

// Exponer para que map.js la pueda llamar
window.iniciarLlamadaFinal = iniciarLlamadaFinal;
