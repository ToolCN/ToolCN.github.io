// ================================================================
// minijuegos.js — Los 9 retos, uno por sospechoso
//
// Cada minijuego es una función que recibe:
//   container → el <div id="minijuego-container"> donde debe dibujarse
//   onWin     → función que HAY que llamar cuando Bruno gana
//
// Todos usan los mismos 2 ayudantes de abajo:
//   alTocar(el, fn)          → conecta un toque/clic de forma segura
//   registrarTemporizador(id) → para poder cancelar timers si Bruno sale antes
// ================================================================


// ----------------------------------------------------------------
// AYUDANTES COMPARTIDOS
// ----------------------------------------------------------------

// Lista de todos los setTimeout/setInterval activos del minijuego actual
let temporizadoresActivos = [];

function registrarTemporizador(id) {
  temporizadoresActivos.push(id);
  return id;
}

/**
 * detenerMinijuegoActual()
 * Cancela TODOS los temporizadores pendientes del minijuego que
 * estaba corriendo. Se llama desde guarida.js siempre que se sale
 * de una guarida o se empieza un minijuego nuevo, para que no queden
 * relojes corriendo en segundo plano.
 */
function detenerMinijuegoActual() {
  temporizadoresActivos.forEach(id => {
    clearTimeout(id);
    clearInterval(id);
  });
  temporizadoresActivos = [];
}
window.detenerMinijuegoActual = detenerMinijuegoActual;

/**
 * alTocar(el, handler)
 * Conecta un elemento tanto a touchstart (para tablet) como a click
 * (para poder probar desde una computadora), sin que se dispare dos
 * veces en pantallas táctiles.
 */
function alTocar(el, handler) {
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


// ================================================================
// 1. RE​Y LOBO — Toca la luna 10 veces
// ================================================================
function juegoLuna(container, onWin) {
  detenerMinijuegoActual();

  let intento = 1;   // sube cada vez que se falla (hace el juego más fácil)
  let toques  = 0;
  const META  = 10;

  container.innerHTML = `
    <p class="minijuego-instruccion">Toca la luna 10 veces antes de que se esconda</p>
    <div class="luna-campo" id="luna-campo">
      <button class="luna" id="luna-elemento" aria-label="Luna">🌕</button>
    </div>
    <p class="minijuego-contador" id="luna-contador">0 / 10</p>
  `;

  const campo     = container.querySelector('#luna-campo');
  const luna      = container.querySelector('#luna-elemento');
  const contador  = container.querySelector('#luna-contador');
  let escapeId;

  function tiempoVisible() {
    // Empieza más lento en cada reintento (más fácil), y se acelera
    // un poco con cada toque logrado dentro de la misma ronda.
    const base = 1400 + (intento - 1) * 500;
    return Math.max(base - toques * 60, 500);
  }

  function reposicionar() {
    const maxX = Math.max(campo.clientWidth  - 70, 0);
    const maxY = Math.max(campo.clientHeight - 70, 0);
    luna.style.left = (Math.random() * maxX) + 'px';
    luna.style.top  = (Math.random() * maxY) + 'px';
  }

  function siguienteRonda() {
    reposicionar();
    escapeId = registrarTemporizador(setTimeout(fallar, tiempoVisible()));
  }

  function fallar() {
    intento += 1;
    toques = 0;
    contador.textContent = 'Se escapó... ¡de nuevo!';
    registrarTemporizador(setTimeout(() => {
      contador.textContent = `0 / ${META}`;
      siguienteRonda();
    }, 900));
  }

  alTocar(luna, () => {
    clearTimeout(escapeId);
    toques += 1;
    contador.textContent = `${toques} / ${META}`;
    if (toques >= META) {
      onWin();
    } else {
      siguienteRonda();
    }
  });

  siguienteRonda();
}


// ================================================================
// 2. CHARRO NEGRO — Encuentra el amuleto antes de que cante el gallo
// ================================================================
function juegoFeria(container, onWin) {
  detenerMinijuegoActual();

  const objetos = ['🎭', '🕯️', '🎲', '🃏', '🔮', '🎪', '🗝️', '🀄'];
  const correctoIdx = Math.floor(Math.random() * objetos.length);
  const TIEMPO_LIMITE = 9000;

  container.innerHTML = `
    <p class="minijuego-instruccion">Encuentra el amuleto correcto antes de que cante el gallo</p>
    <div class="barra-tiempo"><div class="barra-tiempo-interna" id="feria-barra"></div></div>
    <div class="feria-grid" id="feria-grid"></div>
  `;

  const grid  = container.querySelector('#feria-grid');
  const barra = container.querySelector('#feria-barra');

  objetos.forEach((emoji, i) => {
    const btn = document.createElement('button');
    btn.className = 'feria-item';
    btn.textContent = emoji;
    alTocar(btn, () => {
      if (i === correctoIdx) {
        onWin();
      } else {
        btn.classList.add('parpadeo-error');
        setTimeout(() => btn.classList.remove('parpadeo-error'), 400);
      }
    });
    grid.appendChild(btn);
  });

  const inicio = Date.now();
  const intervaloId = registrarTemporizador(setInterval(() => {
    const restante = Math.max(0, 1 - (Date.now() - inicio) / TIEMPO_LIMITE);
    barra.style.width = (restante * 100) + '%';
    if (restante <= 0) {
      clearInterval(intervaloId);
      juegoFeria(container, onWin); // cantó el gallo: reintenta con nuevo orden
    }
  }, 100));
}


// ================================================================
// 3. EL EMPRESARIO — Cuenta las estrellas (3 rondas)
// ================================================================
function juegoEstrellas(container, onWin) {
  detenerMinijuegoActual();

  let ronda = 0;
  const TOTAL_RONDAS = 3;

  function siguienteRonda() {
    if (ronda >= TOTAL_RONDAS) { onWin(); return; }
    ronda += 1;

    const cantidadReal = 3 + Math.floor(Math.random() * 6); // 3 a 8
    const estrellasHtml = '⭐'.repeat(cantidadReal);

    const opciones = new Set([cantidadReal]);
    while (opciones.size < 4) {
      const val = Math.max(1, cantidadReal + Math.floor(Math.random() * 5) - 2);
      opciones.add(val);
    }
    const opcionesArr = Array.from(opciones).sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <p class="minijuego-instruccion">Ronda ${ronda} de ${TOTAL_RONDAS}: memoriza cuántas estrellas ves</p>
      <div class="estrellas-campo" id="estrellas-campo">${estrellasHtml}</div>
      <div class="estrellas-opciones hidden" id="estrellas-opciones"></div>
    `;

    const campo = container.querySelector('#estrellas-campo');

    registrarTemporizador(setTimeout(() => {
      campo.textContent = '¿Cuántas había?';
      const opcionesDiv = container.querySelector('#estrellas-opciones');
      opcionesDiv.classList.remove('hidden');

      opcionesArr.forEach(valor => {
        const btn = document.createElement('button');
        btn.className = 'estrellas-btn';
        btn.textContent = valor;
        alTocar(btn, () => {
          if (valor === cantidadReal) {
            siguienteRonda();
          } else {
            btn.classList.add('parpadeo-error');
            setTimeout(() => btn.classList.remove('parpadeo-error'), 400);
          }
        });
        opcionesDiv.appendChild(btn);
      });
    }, 2500));
  }

  siguienteRonda();
}


// ================================================================
// 4. SPRINGTRAP — Encuentra la salida con la linterna
// ================================================================
function juegoLinterna(container, onWin) {
  detenerMinijuegoActual();

  container.innerHTML = `
    <p class="minijuego-instruccion">Mueve la linterna con el dedo y encuentra la salida antes de que se acabe la luz</p>
    <div class="linterna-campo" id="linterna-campo">
      <div class="linterna-salida" id="linterna-salida">🚪</div>
      <div class="linterna-luz" id="linterna-luz"></div>
    </div>
    <div class="barra-tiempo"><div class="barra-tiempo-interna" id="linterna-barra"></div></div>
  `;

  const campo  = container.querySelector('#linterna-campo');
  const salida = container.querySelector('#linterna-salida');
  const luz    = container.querySelector('#linterna-luz');
  const barra  = container.querySelector('#linterna-barra');

  const maxX = Math.max(campo.clientWidth  - 50, 0);
  const maxY = Math.max(campo.clientHeight - 50, 0);
  salida.style.left = (Math.random() * maxX) + 'px';
  salida.style.top  = (Math.random() * maxY) + 'px';

  function mover(clientX, clientY) {
    const rect = campo.getBoundingClientRect();
    luz.style.left = (clientX - rect.left) + 'px';
    luz.style.top  = (clientY - rect.top)  + 'px';
  }

  campo.addEventListener('touchmove', e => {
    e.preventDefault();
    const t = e.touches[0];
    mover(t.clientX, t.clientY);
  }, { passive: false });

  campo.addEventListener('mousemove', e => mover(e.clientX, e.clientY));

  alTocar(salida, () => {
    clearInterval(intervaloId);
    onWin();
  });

  const TIEMPO_LIMITE = 13000;
  const inicio = Date.now();
  const intervaloId = registrarTemporizador(setInterval(() => {
    const restante = Math.max(0, 1 - (Date.now() - inicio) / TIEMPO_LIMITE);
    barra.style.width = (restante * 100) + '%';
    if (restante <= 0) {
      clearInterval(intervaloId);
      juegoLinterna(container, onWin); // se acabó la luz: reintenta
    }
  }, 100));
}


// ================================================================
// 5. PLANKTON — Memoriza los 5 ingredientes de la Cangreburguer
// ================================================================
function juegoMemoria(container, onWin) {
  detenerMinijuegoActual();

  // TODO: ajusta este orden/emojis si quieres que coincida exacto con
  // la receta real (pan, carne, queso, tomate, lechuga, por ejemplo)
  const ingredientes = ['🍞', '🥩', '🧀', '🍅', '🥬'];

  container.innerHTML = `
    <p class="minijuego-instruccion">Memoriza el orden de los ingredientes</p>
    <div class="memoria-secuencia" id="memoria-secuencia"></div>
    <p class="minijuego-instruccion hidden" id="memoria-turno">Ahora tócalos en el mismo orden</p>
    <div class="memoria-opciones" id="memoria-opciones"></div>
  `;

  const secuenciaDiv = container.querySelector('#memoria-secuencia');
  let i = 0;

  function mostrarSiguiente() {
    if (i >= ingredientes.length) {
      container.querySelector('#memoria-turno').classList.remove('hidden');
      montarOpciones();
      return;
    }
    const span = document.createElement('span');
    span.className = 'memoria-ficha';
    span.textContent = ingredientes[i];
    secuenciaDiv.appendChild(span);
    i += 1;
    registrarTemporizador(setTimeout(mostrarSiguiente, 700));
  }

  let respuestaIdx = 0;
  function montarOpciones() {
    const opcionesDiv = container.querySelector('#memoria-opciones');
    const barajados = [...ingredientes].sort(() => Math.random() - 0.5);
    barajados.forEach(emoji => {
      const btn = document.createElement('button');
      btn.className = 'memoria-btn';
      btn.textContent = emoji;
      alTocar(btn, () => {
        if (btn.disabled) return;
        if (emoji === ingredientes[respuestaIdx]) {
          btn.disabled = true;
          btn.classList.add('memoria-btn-correcto');
          respuestaIdx += 1;
          if (respuestaIdx >= ingredientes.length) onWin();
        } else {
          juegoMemoria(container, onWin); // orden incorrecto: reintenta
        }
      });
      opcionesDiv.appendChild(btn);
    });
  }

  mostrarSiguiente();
}


// ================================================================
// 6. EL LOBO — Esquiva los rayos láser de seguridad
// ================================================================
function juegoLaser(container, onWin) {
  detenerMinijuegoActual();

  let ronda = 0;
  const META = 6;

  container.innerHTML = `
    <p class="minijuego-instruccion">Un láser va a aparecer arriba o abajo: toca la acción correcta a tiempo</p>
    <div class="laser-campo">
      <div class="laser-linea" id="laser-linea"></div>
      <div class="laser-personaje">🐺</div>
    </div>
    <p class="minijuego-contador" id="laser-contador">0 / ${META}</p>
    <div class="laser-botones">
      <button class="btn-secondary" id="laser-btn-agachar">⬇️ Agacharse</button>
      <button class="btn-secondary" id="laser-btn-saltar">⬆️ Saltar</button>
    </div>
  `;

  const linea     = container.querySelector('#laser-linea');
  const contador  = container.querySelector('#laser-contador');
  let tipoActual  = null; // 'alto' → hay que agacharse / 'bajo' → hay que saltar
  let activo      = false;

  function nuevaRonda() {
    tipoActual = Math.random() < 0.5 ? 'alto' : 'bajo';
    linea.className = 'laser-linea laser-' + tipoActual;
    activo = true;
    registrarTemporizador(setTimeout(() => { if (activo) fallar(); }, 1600));
  }

  function acierto() {
    if (!activo) return;
    activo = false;
    ronda += 1;
    contador.textContent = `${ronda} / ${META}`;
    if (ronda >= META) {
      onWin();
    } else {
      registrarTemporizador(setTimeout(nuevaRonda, 500));
    }
  }

  function fallar() {
    activo = false;
    contador.textContent = '¡Alarma activada! Reintentando...';
    registrarTemporizador(setTimeout(() => {
      ronda = 0;
      contador.textContent = `0 / ${META}`;
      nuevaRonda();
    }, 900));
  }

  alTocar(container.querySelector('#laser-btn-agachar'), () => {
    if (tipoActual === 'alto') acierto(); else fallar();
  });
  alTocar(container.querySelector('#laser-btn-saltar'), () => {
    if (tipoActual === 'bajo') acierto(); else fallar();
  });

  nuevaRonda();
}


// ================================================================
// 7. VILLANO DRAGÓN — Encuentra el oro de verdad
// ================================================================
function juegoOro(container, onWin) {
  detenerMinijuegoActual();

  const TOTAL_ORO = 5;
  const TOTAL_FALSO = 4;
  let encontrados = 0;

  const items = [];
  for (let i = 0; i < TOTAL_ORO; i++)   items.push(true);
  for (let i = 0; i < TOTAL_FALSO; i++) items.push(false);
  items.sort(() => Math.random() - 0.5);

  container.innerHTML = `
    <p class="minijuego-instruccion">Toca solo el oro de verdad (${TOTAL_ORO} piezas), evita las piedras falsas</p>
    <div class="oro-grid" id="oro-grid"></div>
    <div class="barra-tiempo"><div class="barra-tiempo-interna" id="oro-barra"></div></div>
  `;

  const grid = container.querySelector('#oro-grid');
  items.forEach(esOro => {
    const btn = document.createElement('button');
    btn.className = 'oro-item';
    btn.textContent = esOro ? '🟨' : '⚪';
    alTocar(btn, () => {
      if (btn.disabled) return;
      btn.disabled = true;
      if (esOro) {
        btn.classList.add('oro-correcto');
        encontrados += 1;
        if (encontrados >= TOTAL_ORO) {
          clearInterval(intervaloId);
          onWin();
        }
      } else {
        btn.classList.add('oro-incorrecto');
      }
    });
    grid.appendChild(btn);
  });

  const barra = container.querySelector('#oro-barra');
  const TIEMPO_LIMITE = 10000;
  const inicio = Date.now();
  const intervaloId = registrarTemporizador(setInterval(() => {
    const restante = Math.max(0, 1 - (Date.now() - inicio) / TIEMPO_LIMITE);
    barra.style.width = (restante * 100) + '%';
    if (restante <= 0) {
      clearInterval(intervaloId);
      juegoOro(container, onWin);
    }
  }, 100));
}


// ================================================================
// 8. EL PROTOTIPO — Laberinto de la fábrica de juguetes
// ================================================================
function juegoLaberinto(container, onWin) {
  detenerMinijuegoActual();

  // 0 = camino libre, 1 = zona peligrosa, 2 = inicio, 3 = meta
  const MAPA = [
    [2, 0, 1, 0, 0],
    [1, 0, 1, 0, 1],
    [0, 0, 0, 0, 1],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 3],
  ];

  let pos = { x: 0, y: 0 };

  container.innerHTML = `
    <p class="minijuego-instruccion">Guía al personaje hasta la salida, evita las zonas marcadas</p>
    <div class="laberinto-grid" id="laberinto-grid"></div>
    <div class="laberinto-controles">
      <button class="btn-secondary laberinto-btn-arriba" id="lab-arriba">⬆️</button>
      <div class="laberinto-fila-controles">
        <button class="btn-secondary" id="lab-izq">⬅️</button>
        <button class="btn-secondary" id="lab-der">➡️</button>
      </div>
      <button class="btn-secondary" id="lab-abajo">⬇️</button>
    </div>
  `;

  const grid = container.querySelector('#laberinto-grid');

  function dibujar() {
    grid.innerHTML = '';
    MAPA.forEach((fila, y) => {
      fila.forEach((celda, x) => {
        const div = document.createElement('div');
        div.className = 'laberinto-celda';
        if (celda === 1) div.classList.add('laberinto-peligro');
        if (celda === 3) div.classList.add('laberinto-meta');
        if (pos.x === x && pos.y === y) div.classList.add('laberinto-jugador');
        grid.appendChild(div);
      });
    });
  }

  function mover(dx, dy) {
    const nx = pos.x + dx;
    const ny = pos.y + dy;
    if (nx < 0 || nx > 4 || ny < 0 || ny > 4) return;

    if (MAPA[ny][nx] === 1) {
      pos = { x: 0, y: 0 }; // zona peligrosa: reinicia desde el inicio
      dibujar();
      return;
    }

    pos = { x: nx, y: ny };
    dibujar();
    if (MAPA[ny][nx] === 3) onWin();
  }

  alTocar(container.querySelector('#lab-arriba'), () => mover(0, -1));
  alTocar(container.querySelector('#lab-abajo'),  () => mover(0, 1));
  alTocar(container.querySelector('#lab-izq'),    () => mover(-1, 0));
  alTocar(container.querySelector('#lab-der'),    () => mover(1, 0));

  dibujar();
}


// ================================================================
// 9. BLUE — Escóndete cuando no esté mirando
// ================================================================
function juegoEscondite(container, onWin) {
  detenerMinijuegoActual();

  const META = 5;
  let logrados = 0;
  let mirando = false;

  container.innerHTML = `
    <p class="minijuego-instruccion">Escóndete SOLO cuando Blue no esté mirando</p>
    <div class="escondite-campo">
      <div class="escondite-blue" id="escondite-blue">🙈</div>
    </div>
    <p class="minijuego-contador" id="escondite-contador">0 / ${META}</p>
    <button class="btn-primary" id="escondite-btn">Escóndete</button>
  `;

  const blueEl    = container.querySelector('#escondite-blue');
  const contador  = container.querySelector('#escondite-contador');

  function ciclo() {
    mirando = !mirando;
    blueEl.textContent = mirando ? '👀' : '🙈';
    blueEl.className = 'escondite-blue ' + (mirando ? 'escondite-mirando' : 'escondite-no-mirando');
    registrarTemporizador(setTimeout(ciclo, 900 + Math.random() * 900));
  }

  alTocar(container.querySelector('#escondite-btn'), () => {
    if (mirando) {
      logrados = 0;
      contador.textContent = `0 / ${META}`;
    } else {
      logrados += 1;
      contador.textContent = `${logrados} / ${META}`;
      if (logrados >= META) onWin();
    }
  });

  ciclo();
}


// ================================================================
// REGISTRO DE MINIJUEGOS
// ================================================================
// La clave debe coincidir con el campo "juego" de cada sospechoso en map.js
window.MINIJUEGOS = {
  luna:       juegoLuna,
  feria:      juegoFeria,
  estrellas:  juegoEstrellas,
  linterna:   juegoLinterna,
  memoria:    juegoMemoria,
  laser:      juegoLaser,
  oro:        juegoOro,
  laberinto:  juegoLaberinto,
  escondite:  juegoEscondite,
};
