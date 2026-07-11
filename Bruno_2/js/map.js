// ================================================================
// map.js — Mapa interactivo con pines de misión
//
// Este archivo maneja:
//   - Mostrar el mapa con pines posicionados
//   - Tres estados por pin: bloqueado / disponible / completado
//   - Abrir un modal cuando se toca un pin disponible
//   - Función completarMision() para marcar misiones como hechas
// ================================================================


// ----------------------------------------------------------------
// CONFIGURACIÓN DE MISIONES
// ----------------------------------------------------------------
// TODO: Reemplazar con las misiones reales de la historia de Bruno.
//
// Cada misión tiene:
//   id              → número único (no cambiar una vez creado)
//   nombre          → título que aparece en el pin y en el modal
//   descripcion     → texto que aparece en el modal al tocar el pin
//   x, y            → posición en el mapa en porcentaje (0-100)
//                     x=0 = izquierda, x=100 = derecha
//                     y=0 = arriba, y=100 = abajo
//   requiereCapitulo → el pin se desbloquea cuando progreso.capitulo >= este número
const MISIONES = [
  {
    id: 0,
    nombre: 'Misión 1: El Inicio',
    // TODO: Escribir la descripción real de esta misión
    descripcion: 'Tu primera misión te espera. Encuentra la señal en el lugar indicado.',
    x: 18, y: 35,
    requiereCapitulo: 1
  },
  {
    id: 1,
    nombre: 'Misión 2: El Túnel',
    // TODO: Escribir la descripción real de esta misión
    descripcion: 'Hay un pasaje secreto. Sigue las marcas en el suelo.',
    x: 48, y: 22,
    requiereCapitulo: 1
  },
  {
    id: 2,
    nombre: 'Misión 3: La Torre',
    // TODO: Escribir la descripción real de esta misión
    descripcion: 'Desde lo alto verás todo el territorio. Sube con cuidado.',
    x: 74, y: 48,
    requiereCapitulo: 2
  },
  {
    id: 3,
    nombre: 'Misión 4: El Código',
    // TODO: Escribir la descripción real de esta misión
    descripcion: 'El mensaje está cifrado. Usa lo que aprendiste en la misión anterior.',
    x: 38, y: 68,
    requiereCapitulo: 2
  },
  {
    id: 4,
    nombre: 'Misión 5: La Base',
    // TODO: Escribir la descripción real de esta misión
    descripcion: 'La base secreta está cerca. Este es el objetivo final.',
    x: 78, y: 78,
    requiereCapitulo: 3
  },
];


// ================================================================
// INICIALIZAR EL MAPA
// ================================================================

/**
 * inicializarMapa()
 * Crea los pines de misión y los posiciona en el mapa.
 * Se llama desde main.js cuando se muestra la pantalla del mapa.
 */
function inicializarMapa() {
  const container = document.getElementById('map-container');
  if (!container) return;

  // El botón flotante de contacto (Foxy) solo debe verse a partir del
  // mapa, nunca antes (ni en la llamada inicial ni en los candados).
  document.getElementById('contact-btn')?.classList.remove('hidden');

  // Limpiar pines previos (en caso de que se llame más de una vez)
  container.innerHTML = '';

  // Crear un pin por cada misión
  MISIONES.forEach(mision => {
    const estado = getEstadoMision(mision);
    const pin    = crearPin(mision, estado);
    container.appendChild(pin);
  });

  // Registrar el botón de cerrar del modal
  const btnClose = document.getElementById('modal-close');
  if (btnClose) {
    btnClose.onclick = cerrarModal;
  }

  // Cerrar modal al tocar fuera del cuadro de contenido
  const modal = document.getElementById('mission-modal');
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) cerrarModal();
    });
  }
}


// ================================================================
// ESTADO DE MISIONES
// ================================================================

/**
 * getEstadoMision(mision)
 * Determina el estado visual de un pin según el progreso actual.
 * @returns {'bloqueado' | 'disponible' | 'completado'}
 */
function getEstadoMision(mision) {
  if (progreso.misionesCompletadas[mision.id]) return 'completado';
  if (progreso.capitulo >= mision.requiereCapitulo)  return 'disponible';
  return 'bloqueado';
}


// ================================================================
// CREAR PINES
// ================================================================

// Íconos para cada estado del pin
const ICONOS_ESTADO = {
  bloqueado:  '🔒',
  disponible: '⭐',
  completado: '✅',
};

/**
 * crearPin(mision, estado)
 * Construye el elemento DOM de un pin de misión.
 * @param {Object} mision - Datos de la misión
 * @param {string} estado - 'bloqueado', 'disponible' o 'completado'
 * @returns {HTMLElement}
 */
function crearPin(mision, estado) {
  const pin = document.createElement('div');
  pin.className      = `map-pin pin-${estado}`;
  pin.style.left     = `${mision.x}%`;
  pin.style.top      = `${mision.y}%`;
  pin.dataset.id     = mision.id;
  pin.setAttribute('role', 'button');
  pin.setAttribute('aria-label', mision.nombre);

  // El anillo de pulso solo aparece en pines disponibles
  const pulsoHtml = estado === 'disponible'
    ? '<div class="pin-pulse" aria-hidden="true"></div>'
    : '';

  pin.innerHTML = `
    ${pulsoHtml}
    <div class="pin-icon" aria-hidden="true">${ICONOS_ESTADO[estado]}</div>
    <div class="pin-label">${mision.nombre}</div>
  `;

  // Solo los pines disponibles son interactivos
  if (estado === 'disponible') {
    const handler = e => {
      e.preventDefault();
      abrirModalMision(mision);
    };
    pin.addEventListener('click',    handler);
    pin.addEventListener('touchend', handler);
  }

  return pin;
}


// ================================================================
// MODAL DE MISIÓN
// ================================================================

/**
 * abrirModalMision(mision)
 * Muestra el modal con el nombre y descripción de la misión.
 * TODO: En el futuro, reemplazar el modal por la pantalla real de la misión.
 */
function abrirModalMision(mision) {
  document.getElementById('modal-title').textContent = mision.nombre;
  document.getElementById('modal-desc').textContent  = mision.descripcion;
  document.getElementById('mission-modal').classList.remove('hidden');
}

/**
 * cerrarModal()
 * Oculta el modal de misión.
 */
function cerrarModal() {
  document.getElementById('mission-modal').classList.add('hidden');
}


// ================================================================
// COMPLETAR MISIÓN (llamar cuando Bruno termine una misión)
// ================================================================

/**
 * completarMision(misionId)
 * Marca una misión como completada, guarda el progreso y refresca el mapa.
 * Llamar esta función desde la consola o desde la lógica futura de misiones:
 *   completarMision(0)  → completa la Misión 1
 *   completarMision(1)  → completa la Misión 2
 *   etc.
 */
function completarMision(misionId) {
  if (misionId < 0 || misionId >= MISIONES.length) {
    console.warn('[Bruno2] ID de misión inválido:', misionId);
    return;
  }
  progreso.misionesCompletadas[misionId] = true;
  guardarProgreso(progreso);

  // Refrescar el mapa para actualizar el pin
  inicializarMapa();
}

/**
 * avanzarCapitulo()
 * Sube el capítulo actual en 1 y desbloquea las misiones del nuevo capítulo.
 * Llamar desde la consola durante el desarrollo:
 *   avanzarCapitulo()
 */
function avanzarCapitulo() {
  progreso.capitulo += 1;
  guardarProgreso(progreso);
  inicializarMapa();
  console.log(`[Bruno2] Capítulo ahora: ${progreso.capitulo}`);
}

// Exponer globalmente para consola
window.completarMision  = completarMision;
window.avanzarCapitulo  = avanzarCapitulo;


// ================================================================
// INICIAR CUANDO EL DOM ESTÉ LISTO
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar si estamos mostrando el mapa desde el principio
  if (progreso.pantallaActual === 'map') {
    inicializarMapa();
  }
});
