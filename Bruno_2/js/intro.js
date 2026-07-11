// ================================================================
// intro.js — Llamada de introducción (antes de ver los candados)
//
// Flujo completo:
//   1. Bruno toca el botón START (ver main.js, que llama a
//      iniciarSecuenciaIntro() de aquí).
//   2. Aparece la pantalla de "llamada entrante": suena el ringtone,
//      vibra el celular (si el navegador lo permite) y se ven los
//      botones de Contestar / Colgar.
//   3a. Si CUELGA: la pantalla se oculta y, 10 segundos después,
//       la llamada vuelve a sonar sola (como si insistieran).
//   3b. Si CONTESTA: se oculta el ringtone y se reproduce la voz
//       del personaje (assets/audio/voz-intro.mp3). Al terminar la
//       voz aparece un botón "Continuar".
//   4. Al tocar "Continuar": se guarda el progreso, se muestra la
//      pantalla de candados y arranca su música de fondo.
//
// NOTA SOBRE LA VIBRACIÓN:
//   navigator.vibrate() SOLO funciona en Android/Chrome. En iPhone
//   o iPad (Safari) no existe esta función en ningún navegador —
//   es una limitación de Apple, no de este código. Si Bruno usa un
//   iPad, simplemente no vibrará, pero todo lo demás (sonido,
//   pantalla, voz) funciona igual.
// ================================================================


// ----------------------------------------------------------------
// VIBRACIÓN
// ----------------------------------------------------------------

let vibracionIntervalo = null;

/**
 * iniciarVibracionLlamada()
 * Hace vibrar el dispositivo en un patrón tipo "llamada entrante"
 * y lo repite cada par de segundos mientras siga sonando.
 * Si el navegador no soporta vibración (ej. Safari/iOS), no hace nada.
 */
function iniciarVibracionLlamada() {
  if (!('vibrate' in navigator)) return;

  const patron = [500, 300, 500, 300]; // vibra 500ms, pausa 300ms, repite
  navigator.vibrate(patron);

  // Repetir el patrón mientras la llamada siga sonando
  vibracionIntervalo = setInterval(() => {
    navigator.vibrate(patron);
  }, 2200);
}

/**
 * detenerVibracion()
 * Detiene cualquier vibración en curso y el intervalo que la repite.
 */
function detenerVibracion() {
  if (vibracionIntervalo) {
    clearInterval(vibracionIntervalo);
    vibracionIntervalo = null;
  }
  if ('vibrate' in navigator) navigator.vibrate(0); // 0 = cancelar vibración activa
}


// ----------------------------------------------------------------
// TEMPORIZADOR DE RELLAMADA
// ----------------------------------------------------------------

// Guarda el setTimeout de la rellamada para poder cancelarlo si hace falta
let temporizadorRellamada = null;

// Cuántos milisegundos espera antes de "volver a llamar" tras colgar
const ESPERA_RELLAMADA_MS = 10000; // 10 segundos


// ----------------------------------------------------------------
// SECUENCIA PRINCIPAL
// ----------------------------------------------------------------

/**
 * iniciarSecuenciaIntro()
 * Punto de entrada: se llama una sola vez, cuando Bruno toca START.
 */
function iniciarSecuenciaIntro() {
  mostrarLlamadaIntro();
}

/**
 * mostrarLlamadaIntro()
 * Muestra la pantalla de "llamada entrante": ringtone + vibración +
 * botones de contestar/colgar visibles.
 */
function mostrarLlamadaIntro() {
  const overlay = document.getElementById('screen-intro-call');
  if (!overlay) return;

  overlay.classList.remove('hidden');

  // Asegurar que se ve el modo "sonando" (por si veníamos de un "colgar")
  document.getElementById('intro-call-rings')?.classList.remove('hidden');
  document.getElementById('intro-call-buttons')?.classList.remove('hidden');
  document.getElementById('intro-continue-btn')?.classList.add('hidden');
  document.getElementById('intro-call-status').textContent = 'Llamada entrante...';

  // Sonido del teléfono sonando
  const ringtone = document.getElementById('audio-ringtone');
  if (ringtone) {
    ringtone.currentTime = 0;
    ringtone.play().catch(err => {
      console.log('[Bruno2] No se pudo reproducir el ringtone:', err.message);
    });
  }

  iniciarVibracionLlamada();

  // Conectar los botones (se reasignan cada vez para evitar duplicados)
  document.getElementById('intro-btn-answer').onclick = contestarIntro;
  document.getElementById('intro-btn-hangup').onclick = colgarIntro;
}

/**
 * contestarIntro()
 * Bruno contesta: se detiene el ringtone/vibración y se reproduce
 * la voz del personaje. Al terminar, aparece el botón "Continuar".
 */
function contestarIntro() {
  detenerLlamadaSonando();

  // Cambiar a modo "hablando": ocultar anillos y botones de contestar/colgar
  document.getElementById('intro-call-rings')?.classList.add('hidden');
  document.getElementById('intro-call-buttons')?.classList.add('hidden');
  document.getElementById('intro-call-status').textContent = 'Conectando...';

  const btnContinuar = document.getElementById('intro-continue-btn');
  const voz = document.getElementById('audio-intro-voz');

  if (voz) {
    voz.currentTime = 0;
    document.getElementById('intro-call-status').textContent = 'Hablando...';

    voz.play().catch(err => {
      console.log('[Bruno2] No se pudo reproducir la voz de introducción:', err.message);
    });

    // Cuando termine de hablar, mostrar "Continuar"
    voz.onended = () => {
      document.getElementById('intro-call-status').textContent = 'Llamada finalizada';
      btnContinuar.classList.remove('hidden');
    };

    // TODO: mientras no subas 'assets/audio/voz-intro.mp3', este aviso
    //       de respaldo muestra "Continuar" solo, después de 6 segundos,
    //       para que puedas seguir probando la app sin la voz todavía.
    setTimeout(() => {
      if (btnContinuar.classList.contains('hidden')) {
        btnContinuar.classList.remove('hidden');
      }
    }, 6000);
  } else {
    btnContinuar.classList.remove('hidden');
  }

  btnContinuar.onclick = terminarIntro;
}

/**
 * colgarIntro()
 * Bruno cuelga sin contestar: se oculta la pantalla y, pasados
 * ESPERA_RELLAMADA_MS, la llamada vuelve a sonar sola.
 */
function colgarIntro() {
  detenerLlamadaSonando();

  const overlay = document.getElementById('screen-intro-call');
  if (overlay) overlay.classList.add('hidden');

  temporizadorRellamada = setTimeout(() => {
    mostrarLlamadaIntro();
  }, ESPERA_RELLAMADA_MS);
}

/**
 * detenerLlamadaSonando()
 * Función auxiliar: detiene ringtone y vibración (usada tanto al
 * contestar como al colgar).
 */
function detenerLlamadaSonando() {
  const ringtone = document.getElementById('audio-ringtone');
  if (ringtone) {
    ringtone.pause();
    ringtone.currentTime = 0;
  }
  detenerVibracion();

  if (temporizadorRellamada) {
    clearTimeout(temporizadorRellamada);
    temporizadorRellamada = null;
  }
}

/**
 * terminarIntro()
 * Bruno tocó "Continuar" después de escuchar la voz: se cierra la
 * llamada, se guarda el progreso y se pasa a la pantalla de candados.
 */
function terminarIntro() {
  const overlay = document.getElementById('screen-intro-call');
  if (overlay) overlay.classList.add('hidden');

  progreso.pantallaActual = 'locks';
  guardarProgreso(progreso);

  mostrarPantalla('screen-locks');

  // Arrancar la música de fondo de los candados (toque directo del
  // usuario en "Continuar", así que el navegador lo permite sin problema)
  cambiarMusica('audio-bg');
}
