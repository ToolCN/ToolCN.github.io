// ================================================================
// map.js — Pantalla de los 9 sospechosos
//
// Este archivo maneja:
//   - Los datos de los 9 sospechosos (nombre, slug de archivos, juego)
//   - Dibujar la cuadrícula de tarjetas (fotos + nombre + estado)
//   - Qué pasa al tocar una tarjeta (abrir su guarida, ver guarida.js)
//   - La tarjeta secreta de Buck (aparece solo cuando progreso.casoResuelto)
//   - Disparar la llamada final de Foxy 15s después del 9º sospechoso
// ================================================================


// ----------------------------------------------------------------
// DATOS DE LOS 9 SOSPECHOSOS
// ----------------------------------------------------------------
// id      → índice (0-8), no cambiar una vez creado (se usa para guardar progreso)
// slug    → texto usado en TODOS los nombres de archivo de este sospechoso
// nombre  → se muestra en la tarjeta y en la guarida
// juego   → qué minijuego le corresponde (ver js/minijuegos.js)
const SOSPECHOSOS = [
  { id: 0, slug: 'reylobo',       nombre: 'Rey Lobo',                juego: 'luna'      },
  { id: 1, slug: 'charronegro',   nombre: 'Charro Negro',            juego: 'feria'     },
  { id: 2, slug: 'empresario',    nombre: 'El Empresario',           juego: 'estrellas' },
  { id: 3, slug: 'springtrap',    nombre: 'Springtrap',              juego: 'linterna'  },
  { id: 4, slug: 'plankton',      nombre: 'Plankton',                juego: 'memoria'   },
  { id: 5, slug: 'lobo',          nombre: 'El Lobo',                 juego: 'laser'     },
  { id: 6, slug: 'villanodragon', nombre: 'Villano Dragón',          juego: 'oro'       },
  { id: 7, slug: 'prototipo',     nombre: 'El Prototipo',            juego: 'laberinto' },
  { id: 8, slug: 'blue',          nombre: 'Blue',                    juego: 'escondite' },
];

// Exponer globalmente para que guarida.js y minijuegos.js lo usen también
window.SOSPECHOSOS = SOSPECHOSOS;


// ================================================================
// INICIALIZAR LA PANTALLA DE SOSPECHOSOS
// ================================================================

/**
 * inicializarMapa()
 * Dibuja la cuadrícula completa. Se llama desde main.js cada vez
 * que se muestra la pantalla de sospechosos (incluso al volver de
 * una guarida), así que también se encarga de refrescar qué
 * tarjetas ya están marcadas como "revisadas".
 */
function inicializarMapa() {
  const grid = document.getElementById('sospechosos-grid');
  if (!grid) return;

  // El botón flotante de teléfono solo debe verse a partir de aquí
  document.getElementById('contact-btn')?.classList.remove('hidden');

  grid.innerHTML = '';

  SOSPECHOSOS.forEach(sosp => {
    grid.appendChild(crearTarjetaSospechoso(sosp));
  });

  // Tarjeta secreta de Buck (solo si ya se resolvió el caso)
  if (progreso.casoResuelto) {
    grid.appendChild(crearTarjetaBuck());
  }

  actualizarContador();
}

/**
 * actualizarContador()
 * Actualiza el texto "X de 9 revisados" arriba de la cuadrícula.
 */
function actualizarContador() {
  const el = document.getElementById('sospechosos-contador');
  if (!el) return;
  const total = progreso.sospechososRevisados.filter(Boolean).length;
  el.textContent = total >= 9
    ? '¡Los 9 revisados!'
    : `${total} de 9 revisados`;
}


// ================================================================
// TARJETAS
// ================================================================

/**
 * crearTarjetaSospechoso(sosp)
 * Construye el elemento DOM de la tarjeta de un sospechoso.
 */
function crearTarjetaSospechoso(sosp) {
  const revisado = progreso.sospechososRevisados[sosp.id];

  const card = document.createElement('div');
  card.className = 'sospechoso-card' + (revisado ? ' revisado' : '');
  card.dataset.id = sosp.id;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', sosp.nombre);

  card.innerHTML = `
    <div class="sospechoso-foto-wrap">
      <img class="sospechoso-foto" src="assets/images/sospechosos/0${sosp.id + 1}-${sosp.slug}.jpg"
           alt="${sosp.nombre}"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="sospechoso-placeholder" style="display:none;">?</div>
      ${revisado ? '<span class="sospechoso-check">✓</span>' : ''}
    </div>
    <span class="sospechoso-nombre">${sosp.nombre}</span>
  `;

  card.addEventListener('click', () => {
    if (typeof abrirGuarida === 'function') {
      abrirGuarida(sosp);
    }
  });

  return card;
}

/**
 * crearTarjetaBuck()
 * La tarjeta secreta que aparece en el centro de la cuadrícula
 * solo después de la llamada final de Foxy.
 */
function crearTarjetaBuck() {
  const card = document.createElement('div');
  card.className = 'sospechoso-card sospechoso-secreto';
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', 'El verdadero culpable');

  card.innerHTML = `
    <div class="sospechoso-foto-wrap">
      <img class="sospechoso-foto" src="assets/images/sospechosos/10-buck.jpg" alt="???"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="sospechoso-placeholder" style="display:none;">🐶</div>
    </div>
    <span class="sospechoso-nombre">¡Es él!</span>
  `;

  card.addEventListener('click', () => {
    document.getElementById('screen-buck')?.classList.remove('hidden');
  });

  return card;
}


// ================================================================
// SE LLAMA DESDE guarida.js CUANDO SE GANA UN MINIJUEGO
// ================================================================

/**
 * marcarSospechosoRevisado(sospechosoId)
 * Guarda el progreso y revisa si ya se completaron los 9 (para
 * disparar la llamada final de Foxy).
 */
function marcarSospechosoRevisado(sospechosoId) {
  progreso.sospechososRevisados[sospechosoId] = true;
  guardarProgreso(progreso);

  const total = progreso.sospechososRevisados.filter(Boolean).length;

  if (total >= 9 && !progreso.casoResuelto) {
    // Esperar 15 segundos y luego disparar la llamada final de Foxy
    setTimeout(() => {
      if (typeof iniciarLlamadaFinal === 'function') {
        iniciarLlamadaFinal();
      }
    }, 15000);
  }
}

// Exponer para que guarida.js la use
window.marcarSospechosoRevisado = marcarSospechosoRevisado;


// ================================================================
// BOTÓN DE CERRAR EL PANEL FINAL DE BUCK
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('buck-close-btn')?.addEventListener('click', () => {
    document.getElementById('screen-buck')?.classList.add('hidden');
  });

  // Si al recargar la página ya estábamos en la pantalla de sospechosos,
  // dibujar la cuadrícula (si no, main.js llama a inicializarMapa() al
  // llegar aquí desde los candados o desde una guarida).
  if (progreso.pantallaActual === 'map') {
    inicializarMapa();
  }
});
