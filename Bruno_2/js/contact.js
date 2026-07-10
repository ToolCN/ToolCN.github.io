// ================================================================
// contact.js — Sistema de contacto con el personaje
//
// Este archivo maneja:
//   - El botón flotante siempre visible (estilo WhatsApp)
//   - Pantalla de llamada simulada (con botones contestar/colgar)
//   - Chat estilo WhatsApp con burbujas que aparecen una por una
//   - Cambio de modo según el capítulo de la historia
//
// PARA PERSONALIZAR:
//   - Cambia NOMBRE_PERSONAJE con el nombre real del agente
//   - Edita GUION_CHAT para escribir los mensajes por capítulo
//   - Cambia modoContacto para alternar entre llamada y chat
// ================================================================


// ----------------------------------------------------------------
// MODO DE CONTACTO
// ----------------------------------------------------------------
// TODO: Esta variable controla qué tipo de pantalla se muestra al
//       presionar el botón de contacto. Puedes cambiarla aquí para
//       probar uno u otro, o hacer que cambie según el capítulo.
//
//   'chat'    → abre el chat estilo WhatsApp
//   'llamada' → abre la pantalla de llamada entrante
//
let modoContacto = 'chat';

// Para cambiar desde la consola del navegador sin recargar la página:
//   window.setModoContacto('llamada')
//   window.setModoContacto('chat')
window.setModoContacto = modo => { modoContacto = modo; };


// ----------------------------------------------------------------
// DATOS DEL PERSONAJE
// ----------------------------------------------------------------
// TODO: Reemplazar 'Agente X' con el nombre real del personaje de la historia.
const NOMBRE_PERSONAJE = 'Agente X';


// ----------------------------------------------------------------
// GUION DEL CHAT
// ----------------------------------------------------------------
// TODO: Aquí va el guion completo de la historia de Bruno.
//
// Estructura: objeto cuyas CLAVES son números de capítulo.
// Cada valor es un array de mensajes.
// Cada mensaje tiene:
//   texto  → lo que "escribe" el personaje (puede tener emojis)
//   delay  → milisegundos antes de que aparezca ESTE mensaje
//             (contar desde que se abre el chat)
//
// El efecto "escribiendo..." aparece 700ms antes de cada mensaje.
//
const GUION_CHAT = {

  // ----- CAPÍTULO 1 -----
  1: [
    {
      texto: '¿Bruno? ¿Estás ahí? 📡',
      delay: 600
    },
    {
      texto: '¡Menos mal! Lograste abrir los candados.',
      delay: 2000
    },
    {
      texto: 'Necesito tu ayuda con una misión muy importante. No hay tiempo que perder.',
      delay: 3800
    },
    {
      texto: 'Revisa el mapa. Las estrellas marcan por dónde empezar. 🗺️',
      delay: 5600
    },
    // TODO: Continuar el guion del capítulo 1 aquí.
    //       Agrega más objetos { texto: '...', delay: ms }
  ],

  // ----- CAPÍTULO 2 -----
  2: [
    {
      texto: 'Buen trabajo en la primera parte, Bruno. 👏',
      delay: 600
    },
    {
      texto: 'Pero esto es solo el principio. Lo que viene es más difícil...',
      delay: 2200
    },
    {
      texto: 'Busca la señal en el mapa. Sabrás cuál es. ⚡',
      delay: 4000
    },
    // TODO: Continuar el guion del capítulo 2 aquí.
  ],

  // ----- CAPÍTULO 3 -----
  3: [
    {
      texto: '¡El tiempo se acaba, Bruno! ⏰',
      delay: 400
    },
    {
      texto: 'La base final está al descubierto. ¡Ve ahora!',
      delay: 1800
    },
    // TODO: Continuar el guion del capítulo 3 aquí.
  ],

};


// ================================================================
// BOTÓN FLOTANTE DE CONTACTO
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('contact-btn');
  if (!btn) return;

  btn.addEventListener('click', abrirContacto);
  btn.addEventListener('touchend', e => {
    e.preventDefault(); // Evitar que también dispare el click
    abrirContacto();
  });
});

/**
 * abrirContacto()
 * Determina si abrir llamada o chat según modoContacto actual,
 * y opcionalmente según el capítulo de la historia.
 */
function abrirContacto() {
  iniciarMusica();

  // TODO: Aquí puedes hacer que el modo cambie según el capítulo:
  //   if (progreso.capitulo === 2) modoContacto = 'llamada';

  if (modoContacto === 'llamada') {
    abrirLlamada();
  } else {
    abrirChat();
  }
}


// ================================================================
// PANTALLA DE LLAMADA
// ================================================================

let ringtoneAudio = null;

/**
 * abrirLlamada()
 * Muestra la pantalla de llamada entrante y empieza el tono.
 */
function abrirLlamada() {
  const screen = document.getElementById('screen-call');
  if (!screen) return;

  screen.classList.remove('hidden');
  document.getElementById('call-status-text').textContent = 'Llamada entrante...';

  // Iniciar tono de llamada
  ringtoneAudio = document.getElementById('audio-ringtone');
  if (ringtoneAudio) {
    ringtoneAudio.play().catch(() => {});
  }

  // Asignar handlers de botones (reemplazando posibles handlers anteriores)
  document.getElementById('btn-answer').onclick = contestarLlamada;
  document.getElementById('btn-hangup').onclick = colgarLlamada;
}

/**
 * contestarLlamada()
 * Acción de contestar: detiene el tono y cambia el texto de estado.
 * TODO: Aquí puedes reproducir el audio de voz del personaje:
 *       const voz = new Audio('assets/audio/llamada-cap1.mp3');
 *       voz.play();
 */
function contestarLlamada() {
  if (ringtoneAudio) ringtoneAudio.pause();

  document.getElementById('call-status-text').textContent = 'Conectado...';

  // TODO: Reproducir el audio de la llamada del personaje aquí.
  //       Por ahora auto-cuelga después de 5 segundos como placeholder.
  setTimeout(() => colgarLlamada(), 5000);
}

/**
 * colgarLlamada()
 * Cierra la pantalla de llamada y detiene todos los audios relacionados.
 */
function colgarLlamada() {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
  }

  const screen = document.getElementById('screen-call');
  if (screen) screen.classList.add('hidden');
}


// ================================================================
// PANTALLA DE CHAT
// ================================================================

// Bandera para saber si el chat está abierto (para no seguir
// agregando mensajes después de que se cierre)
let chatAbierto = false;

/**
 * abrirChat()
 * Muestra el chat y empieza a mostrar los mensajes del capítulo actual.
 */
function abrirChat() {
  const screen = document.getElementById('screen-chat');
  if (!screen) return;

  screen.classList.remove('hidden');
  chatAbierto = true;

  // Limpiar mensajes anteriores
  const mensajesEl = document.getElementById('chat-messages');
  mensajesEl.innerHTML = '';

  // Ocultar indicador de "escribiendo..."
  ocultarTyping();

  // Obtener el guion del capítulo actual
  const cap      = progreso.capitulo || 1;
  const mensajes = GUION_CHAT[cap] || GUION_CHAT[1];

  // Mostrar los mensajes uno por uno con delays
  mostrarMensajesSecuenciales(mensajes);

  // Botón de cerrar
  const btnClose = document.getElementById('chat-close');
  if (btnClose) btnClose.onclick = cerrarChat;
}

/**
 * mostrarMensajesSecuenciales(mensajes)
 * Programa la aparición de cada mensaje con su delay.
 * 700ms antes de cada mensaje muestra el indicador de "escribiendo..."
 */
function mostrarMensajesSecuenciales(mensajes) {
  mensajes.forEach(msg => {
    const delayTyping  = Math.max(0, msg.delay - 700);
    const delayMensaje = msg.delay;

    // Mostrar "escribiendo..." antes del mensaje
    setTimeout(() => {
      if (!chatAbierto) return;
      mostrarTyping();
    }, delayTyping);

    // Mostrar el mensaje real
    setTimeout(() => {
      if (!chatAbierto) return;
      ocultarTyping();
      agregarBurbuja(msg.texto, 'incoming');
    }, delayMensaje);
  });
}

/**
 * agregarBurbuja(texto, tipo)
 * Crea una burbuja de mensaje y la agrega al chat con animación de entrada.
 * @param {string} texto - Contenido del mensaje
 * @param {string} tipo  - 'incoming' (del personaje) o 'outgoing' (de Bruno, para uso futuro)
 */
function agregarBurbuja(texto, tipo) {
  const mensajesEl = document.getElementById('chat-messages');
  if (!mensajesEl) return;

  const burbuja = document.createElement('div');
  burbuja.className  = `chat-bubble ${tipo}`;
  burbuja.textContent = texto;

  mensajesEl.appendChild(burbuja);

  // Animar entrada (la clase 'visible' activa la transición CSS)
  requestAnimationFrame(() => burbuja.classList.add('visible'));

  // Scroll automático al último mensaje
  mensajesEl.scrollTop = mensajesEl.scrollHeight;
}

/**
 * mostrarTyping() / ocultarTyping()
 * Controlan el indicador de "el agente está escribiendo..."
 */
function mostrarTyping() {
  const el = document.getElementById('chat-typing');
  if (el) {
    el.classList.add('visible');
    // Scroll para que el indicador sea visible
    const mensajesEl = document.getElementById('chat-messages');
    if (mensajesEl) mensajesEl.scrollTop = mensajesEl.scrollHeight;
  }
}

function ocultarTyping() {
  const el = document.getElementById('chat-typing');
  if (el) el.classList.remove('visible');
}

/**
 * cerrarChat()
 * Cierra la pantalla de chat.
 */
function cerrarChat() {
  chatAbierto = false;
  ocultarTyping();
  const screen = document.getElementById('screen-chat');
  if (screen) screen.classList.add('hidden');
}
