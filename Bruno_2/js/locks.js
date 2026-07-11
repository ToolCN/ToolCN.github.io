// ================================================================
// locks.js — Lógica de los candados de combinación
//
// Este archivo maneja:
//   - Construir las ruedas numéricas (0-9) en el DOM
//   - Detectar swipe/scroll en cada rueda y actualizar el dígito
//   - Reproducir un "click" cada vez que un dígito cambia
//   - Verificar si la combinación ingresada es correcta
//   - Animar la apertura del candado y el efecto de luz
//   - Marcar los candados como abiertos en el estado global
// ================================================================


// ----------------------------------------------------------------
// COMBINACIONES DE LOS CANDADOS
// ----------------------------------------------------------------
// TODO: Reemplazar estas combinaciones con los códigos reales de la historia.
//       Cada array tiene 3 números, uno por rueda.
//       Ejemplo: [3, 7, 1] significa que hay que poner 3-7-1.
const COMBINACIONES = [
  [2, 8, 5],   // Candado 0 (cadena izquierda)   → código: 2-8-5
  [1, 6, 2],   // Candado 1 (cadena derecha)      → código: 1-6-2
];

// Altura en píxeles de cada dígito en la rueda.
// DEBE coincidir con la propiedad CSS: .wheel-digit { height: 84px; }
const DIGIT_HEIGHT = 84;

// ----------------------------------------------------------------
// ESTADO DE LAS RUEDAS
// ----------------------------------------------------------------
// currentValues[indiceCandado][indiceRueda] = dígito mostrado (0-9)
// Empieza en 0-0-0 para todos los candados.
const currentValues = [
  [0, 0, 0],
  [0, 0, 0],
];


// ================================================================
// CONSTRUCCIÓN DE LAS RUEDAS EN EL DOM
// ================================================================

/**
 * inicializarCandados()
 * Rellena el contenido de cada <div class="wheel"> con los dígitos
 * y registra los eventos táctiles/scroll.
 * También restaura el estado visual de candados ya abiertos.
 */
function inicializarCandados() {
  const wheels = document.querySelectorAll('.wheel');

  wheels.forEach(wheel => {
    const lockIdx  = parseInt(wheel.dataset.lock);
    const wheelIdx = parseInt(wheel.dataset.wheel);

    // Insertar el strip de dígitos (20 divs: 0-9 dos veces para el wrap visual)
    wheel.innerHTML = buildDigitStrip();

    // Posicionar en el dígito 0 inicialmente
    snapWheel(wheel, 0);

    // Registrar los eventos de toque y scroll del ratón
    registerWheelEvents(wheel, lockIdx, wheelIdx);
  });

  // Restaurar visualmente los candados que ya estaban abiertos
  progreso.candadosAbiertos.forEach((abierto, i) => {
    if (abierto) markLockOpen(i, false); // false = sin guardar de nuevo
  });
}

/**
 * buildDigitStrip()
 * Crea el HTML con 20 <div class="wheel-digit"> (dígitos 0-9 repetidos dos veces).
 * El duplicado permite el efecto de wrap visual cuando se llega al 9 o al 0.
 * @returns {string} HTML del strip
 */
function buildDigitStrip() {
  let html = '';
  for (let rep = 0; rep < 2; rep++) {
    for (let d = 0; d <= 9; d++) {
      html += `<div class="wheel-digit">${d}</div>`;
    }
  }
  return html;
}


// ================================================================
// POSICIONAMIENTO DE LA RUEDA
// ================================================================

/**
 * snapWheel(wheel, value)
 * Mueve el strip de dígitos para mostrar el valor indicado,
 * con una pequeña animación de snap (resorte).
 * @param {HTMLElement} wheel - El elemento .wheel
 * @param {number} value - Dígito a mostrar (0-9)
 */
function snapWheel(wheel, value) {
  wheel.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  wheel.style.transform  = `translateY(${-value * DIGIT_HEIGHT}px)`;

  // Quitar la transición después del snap para que el arrastre se vea fluido
  setTimeout(() => { wheel.style.transition = ''; }, 200);
}

/**
 * setWheelVisualPos(wheel, yOffset)
 * Posiciona el strip directamente (sin animación), para seguir el dedo en tiempo real.
 * @param {HTMLElement} wheel
 * @param {number} yOffset - Transform Y calculado durante el drag
 */
function setWheelVisualPos(wheel, yOffset) {
  wheel.style.transition = '';
  wheel.style.transform  = `translateY(${yOffset}px)`;
}


// ================================================================
// EVENTOS DE TOQUE Y SCROLL
// ================================================================

/**
 * registerWheelEvents(wheel, lockIdx, wheelIdx)
 * Registra los listeners de touch (tablet) y wheel (ratón para desarrollo).
 * Cada rueda tiene sus propias variables de arrastre en el closure.
 */
function registerWheelEvents(wheel, lockIdx, wheelIdx) {
  // Variables locales para el gesto activo
  let touchStartY  = null;   // posición Y al inicio del toque
  let startValue   = 0;      // valor del dígito al inicio del toque
  let startOffset  = 0;      // transform Y al inicio del toque

  // ---- TOUCH START: registrar dónde empezó el dedo ----
  wheel.addEventListener('touchstart', e => {
    e.preventDefault(); // Evitar que la página haga scroll

    touchStartY = e.touches[0].clientY;
    startValue  = currentValues[lockIdx][wheelIdx];
    startOffset = -startValue * DIGIT_HEIGHT;

    iniciarMusica(); // Iniciar música al primer toque (política del navegador)
  }, { passive: false });

  // ---- TOUCH MOVE: seguir el dedo en tiempo real ----
  wheel.addEventListener('touchmove', e => {
    e.preventDefault();
    if (touchStartY === null) return;

    const currentY = e.touches[0].clientY;
    const deltaY   = touchStartY - currentY; // positivo = dedo subió = número aumenta

    // Mover el strip siguiendo el dedo (sin animación para que se vea fluido)
    const visualY = startOffset - deltaY;
    setWheelVisualPos(wheel, visualY);

    // Calcular qué dígito corresponde a la posición actual
    const rawDigit = Math.round(-visualY / DIGIT_HEIGHT);
    const newValue = ((rawDigit % 10) + 10) % 10; // módulo con wrap positivo

    // Si cambió de dígito: sonido y verificación
    if (newValue !== currentValues[lockIdx][wheelIdx]) {
      currentValues[lockIdx][wheelIdx] = newValue;
      reproducirSonido('audio-click');
      checkCombo(lockIdx);
    }
  }, { passive: false });

  // ---- TOUCH END: snap al dígito más cercano ----
  wheel.addEventListener('touchend', () => {
    touchStartY = null;
    snapWheel(wheel, currentValues[lockIdx][wheelIdx]);
  });

  // ---- MOUSE WHEEL: para probar en computadora durante el desarrollo ----
  wheel.addEventListener('wheel', e => {
    e.preventDefault();
    const dir      = e.deltaY > 0 ? 1 : -1; // hacia abajo = número aumenta
    const current  = currentValues[lockIdx][wheelIdx];
    const newValue = ((current + dir) % 10 + 10) % 10;

    currentValues[lockIdx][wheelIdx] = newValue;
    snapWheel(wheel, newValue);
    reproducirSonido('audio-click');
    checkCombo(lockIdx);
  }, { passive: false });
}


// ================================================================
// VERIFICAR COMBINACIÓN
// ================================================================

/**
 * checkCombo(lockIdx)
 * Compara los dígitos actuales de un candado con su combinación correcta.
 * Si coinciden y el candado no estaba abierto, dispara la animación.
 * @param {number} lockIdx - Índice del candado (0, 1 o 2)
 */
function checkCombo(lockIdx) {
  // Si ya estaba abierto, no hacer nada
  if (progreso.candadosAbiertos[lockIdx]) return;

  const actual   = currentValues[lockIdx];
  const correcta = COMBINACIONES[lockIdx];

  // Comparar los 3 dígitos
  const esCorrecta = actual.every((v, i) => v === correcta[i]);

  if (esCorrecta) {
    // Pequeño delay para que se vea el snap antes de la animación
    setTimeout(() => animarApertura(lockIdx), 250);
  }
}


// ================================================================
// ANIMACIÓN DE APERTURA
// ================================================================

/**
 * animarApertura(lockIdx)
 * Dispara la animación de apertura del candado y el efecto de luz.
 * @param {number} lockIdx - Índice del candado (0, 1 o 2)
 */
function animarApertura(lockIdx) {
  reproducirSonido('audio-unlock');

  const lockEl  = document.getElementById(`lock-${lockIdx}`);
  const chainEl = document.getElementById(`chain-${lockIdx}`);

  // Clase CSS que activa la animación del shackle (arco del candado)
  lockEl.classList.add('opening');

  // Destello de luz local (centrado en el candado)
  const flash = lockEl.querySelector('.lock-open-flash');
  flash.classList.add('active');

  // Destello de luz global (cubre toda la pantalla)
  const globalFlash = document.getElementById('lock-light-overlay');
  globalFlash.classList.add('active');

  // Después de la animación: marcar como abierto y revisar si terminamos
  setTimeout(() => {
    globalFlash.classList.remove('active');
    flash.classList.remove('active');

    markLockOpen(lockIdx, true); // true = guardar en localStorage

    // ¿Se abrieron los 3 candados? → ir al mapa
    if (progreso.candadosAbiertos.every(Boolean)) {
      setTimeout(() => transicionAlMapa(), 800);
    }
  }, 1600);
}

/**
 * markLockOpen(lockIdx, save)
 * Actualiza el estado del candado (visual + localStorage).
 * @param {number}  lockIdx - Índice del candado
 * @param {boolean} save    - Si true, guarda en localStorage
 */
function markLockOpen(lockIdx, save) {
  progreso.candadosAbiertos[lockIdx] = true;
  if (save) guardarProgreso(progreso);

  const lockEl  = document.getElementById(`lock-${lockIdx}`);
  const chainEl = document.getElementById(`chain-${lockIdx}`);

  // Clases CSS que cambian la apariencia a "abierto"
  lockEl.classList.add('opened');
  chainEl.classList.add('unlocked'); // esto dispara la animación de la cadena cayendo (CSS)

  // Sonido de la cadena cayendo, sincronizado con esa misma animación
  reproducirSonido('audio-chain-fall');

  // Desactivar las ruedas para que no se muevan una vez abierto
  lockEl.querySelectorAll('.wheel').forEach(w => {
    w.style.pointerEvents = 'none';
    w.style.touchAction   = 'none';
  });
}


// ================================================================
// INICIAR CUANDO EL DOM ESTÉ LISTO
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar si estamos en la pantalla de candados
  if (progreso.pantallaActual !== 'map') {
    inicializarCandados();
  }
});
