// ================================================================
// minijuegos.js — Los 9 retos, uno por sospechoso (v2, reelaborados)
//
// Cada minijuego recibe:
//   container → el <div> donde debe dibujarse
//   onWin     → función que HAY que llamar cuando Bruno gana
// ================================================================


// ----------------------------------------------------------------
// AYUDANTES COMPARTIDOS
// ----------------------------------------------------------------

let temporizadoresActivos = [];

function registrarTemporizador(id) {
  temporizadoresActivos.push(id);
  return id;
}

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
 * Conecta un elemento tanto a touchstart (tablet) como a click
 * (para probar desde computadora), sin doble disparo en táctil.
 */
function alTocar(el, handler) {
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

function numAleatorioLocal(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// ================================================================
// 1. REY LOBO — Toca la luna 10 veces
//    - Campo más grande, la luna se mueve más rápido según se acerca al 10
//    - Si falla, aparece un botón "Reintentar" (ya no reintenta solo)
//    - Al 3er intento se vuelve tan fácil que es imposible fallar
// ================================================================
function juegoLuna(container, onWin) {
  detenerMinijuegoActual();

  let intento = 1;
  let toques  = 0;
  const META  = 10;

  function render() {
    container.innerHTML = `
      <p class="minijuego-instruccion">Toca la luna 10 veces antes de que se esconda</p>
      <div class="luna-campo" id="luna-campo">
        <button class="luna" id="luna-elemento" aria-label="Luna">🌕</button>
      </div>
      <p class="minijuego-contador" id="luna-contador">0 / ${META}</p>
    `;
    iniciarRonda();
  }

  function tiempoVisible() {
    // 3er intento en adelante: modo "imposible fallar"
    if (intento >= 3) return 3200;
    const base = 1400 + (intento - 1) * 500;
    return Math.max(base - toques * 70, 450);
  }

  function iniciarRonda() {
    const campo = container.querySelector('#luna-campo');
    const luna  = container.querySelector('#luna-elemento');

    function reposicionar() {
      const maxX = Math.max(campo.clientWidth  - 80, 0);
      const maxY = Math.max(campo.clientHeight - 80, 0);
      luna.style.left = (Math.random() * maxX) + 'px';
      luna.style.top  = (Math.random() * maxY) + 'px';
    }

    let escapeId;
    function siguienteToque() {
      reposicionar();
      escapeId = registrarTemporizador(setTimeout(fallar, tiempoVisible()));
    }

    function fallar() {
      const campoEl = container.querySelector('#luna-campo');
      campoEl.innerHTML = `
        <div class="minijuego-fallo">
          <p>¡Se escondió entre las nubes!</p>
          <button class="btn-primary" id="luna-reintentar-btn">Reintentar</button>
        </div>
      `;
      intento += 1;
      toques = 0;
      alTocar(container.querySelector('#luna-reintentar-btn'), () => render());
    }

    alTocar(luna, () => {
      clearTimeout(escapeId);
      toques += 1;
      container.querySelector('#luna-contador').textContent = `${toques} / ${META}`;
      if (toques >= META) {
        onWin();
      } else {
        siguienteToque();
      }
    });

    siguienteToque();
  }

  render();
}


// ================================================================
// 2. CHARRO NEGRO — Lotería: junta las 16 piezas voladoras
// ================================================================
function juegoLoteria(container, onWin) {
  detenerMinijuegoActual();

  const ICONOS = ['☀️','🌙','⭐','❤️','🌳','🐍','🌵','🎸','🌸','🐓','🐟','🔔','🌈','☂️','🍉','🗝️'];
  let colocadas = 0;

  container.innerHTML = `
    <p class="minijuego-instruccion">¡Las piezas de la carta salieron volando! Tócalas para regresarlas a su lugar</p>
    <div class="loteria-campo" id="loteria-campo">
      <div class="loteria-carta" id="loteria-carta"></div>
    </div>
    <p class="minijuego-contador" id="loteria-contador">0 / 16</p>
  `;

  const campo = container.querySelector('#loteria-campo');
  const carta = container.querySelector('#loteria-carta');

  ICONOS.forEach((icono, i) => {
    const casilla = document.createElement('div');
    casilla.className = 'loteria-casilla';
    casilla.dataset.index = i;
    casilla.innerHTML = `<span class="loteria-fantasma">${icono}</span>`;
    carta.appendChild(casilla);
  });

  const indicesBarajados = ICONOS.map((_, i) => i).sort(() => Math.random() - 0.5);
  const piezas = [];

  indicesBarajados.forEach(indexOriginal => {
    const pieza = document.createElement('button');
    pieza.className = 'loteria-pieza';
    pieza.textContent = ICONOS[indexOriginal];
    pieza.dataset.index = indexOriginal;
    campo.appendChild(pieza);
    piezas.push(pieza);
  });

  function posicionarAleatorio(pieza) {
    const maxX = Math.max(campo.clientWidth  - 54, 0);
    const maxY = Math.max(campo.clientHeight - 54, 0);
    pieza.style.left = (Math.random() * maxX) + 'px';
    pieza.style.top  = (Math.random() * maxY) + 'px';
    pieza.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
    pieza.style.animationDelay = (Math.random() * 1.5) + 's';
  }
  piezas.forEach(posicionarAleatorio);

  piezas.forEach(pieza => {
    alTocar(pieza, () => {
      if (pieza.classList.contains('loteria-colocada')) return;

      const idx = pieza.dataset.index;
      const casillaDestino = carta.querySelector(`.loteria-casilla[data-index="${idx}"]`);
      const rectCasilla = casillaDestino.getBoundingClientRect();
      const rectCampo = campo.getBoundingClientRect();

      pieza.style.animation = 'none';
      pieza.style.transition = 'left 0.4s ease, top 0.4s ease, opacity 0.3s ease 0.4s';
      pieza.style.left = (rectCasilla.left - rectCampo.left + 2) + 'px';
      pieza.style.top  = (rectCasilla.top  - rectCampo.top  + 2) + 'px';
      pieza.style.zIndex = 0;

      registrarTemporizador(setTimeout(() => {
        pieza.classList.add('loteria-colocada');
        casillaDestino.querySelector('.loteria-fantasma').style.opacity = '1';
        colocadas += 1;
        container.querySelector('#loteria-contador').textContent = `${colocadas} / 16`;
        if (colocadas >= 16) onWin();
      }, 420));
    });
  });
}


// ================================================================
// 3. EL EMPRESARIO — 3 operaciones matemáticas (suma/resta, 3 dígitos)
// ================================================================
function juegoMatematicas(container, onWin) {
  detenerMinijuegoActual();

  let ronda = 0;
  const TOTAL = 3;

  function generarProblema() {
    const esSuma = Math.random() < 0.5;
    let a = numAleatorioLocal(100, 899);
    let b, resultado;
    if (esSuma) {
      b = numAleatorioLocal(100, Math.max(100, 999 - a));
      resultado = a + b;
    } else {
      b = numAleatorioLocal(100, a); // b <= a para no dar negativos
      if (b > a) { const t = a; a = b; b = t; }
      resultado = a - b;
    }
    return { texto: `${a} ${esSuma ? '+' : '−'} ${b}`, resultado };
  }

  function siguienteRonda() {
    if (ronda >= TOTAL) { onWin(); return; }
    ronda += 1;

    const problema = generarProblema();
    const opciones = new Set([problema.resultado]);
    while (opciones.size < 4) {
      const delta = numAleatorioLocal(1, 20) * (Math.random() < 0.5 ? -1 : 1);
      opciones.add(Math.max(0, problema.resultado + delta));
    }
    const opcionesArr = Array.from(opciones).sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <p class="minijuego-instruccion">Operación ${ronda} de ${TOTAL}</p>
      <div class="mate-operacion">${problema.texto} = ?</div>
      <div class="mate-opciones" id="mate-opciones"></div>
    `;

    const opcionesDiv = container.querySelector('#mate-opciones');
    opcionesArr.forEach(valor => {
      const btn = document.createElement('button');
      btn.className = 'mate-btn';
      btn.textContent = valor;
      alTocar(btn, () => {
        if (valor === problema.resultado) {
          siguienteRonda();
        } else {
          btn.classList.add('parpadeo-error');
          setTimeout(() => btn.classList.remove('parpadeo-error'), 400);
        }
      });
      opcionesDiv.appendChild(btn);
    });
  }

  siguienteRonda();
}


// ================================================================
// 4. SPRINGTRAP — Linterna (3 cuartos, la puerta se mueve sola,
//    y de vez en cuando aparece un "monstruo" cerca de la luz)
// ================================================================
function juegoLinterna(container, onWin) {
  detenerMinijuegoActual();

  let cuarto = 0;
  const TOTAL_CUARTOS = 3;

  function siguienteCuarto() {
    if (cuarto >= TOTAL_CUARTOS) { onWin(); return; }
    cuarto += 1;

    container.innerHTML = `
      <p class="minijuego-instruccion">Cuarto ${cuarto} de ${TOTAL_CUARTOS}: encuentra la salida antes de que se acabe la luz</p>
      <div class="linterna-campo" id="linterna-campo">
        <div class="linterna-salida" id="linterna-salida">🚪</div>
        <div class="linterna-monstruo hidden" id="linterna-monstruo">👹</div>
        <div class="linterna-luz" id="linterna-luz"></div>
      </div>
      <div class="barra-tiempo"><div class="barra-tiempo-interna" id="linterna-barra"></div></div>
    `;

    const campo    = container.querySelector('#linterna-campo');
    const salida   = container.querySelector('#linterna-salida');
    const monstruo = container.querySelector('#linterna-monstruo');
    const luz      = container.querySelector('#linterna-luz');
    const barra    = container.querySelector('#linterna-barra');

    let luzX = campo.clientWidth / 2;
    let luzY = campo.clientHeight / 2;
    let terminado = false;

    function reposicionarSalida() {
      const maxX = Math.max(campo.clientWidth  - 50, 0);
      const maxY = Math.max(campo.clientHeight - 50, 0);
      salida.style.left = (Math.random() * maxX) + 'px';
      salida.style.top  = (Math.random() * maxY) + 'px';
    }
    reposicionarSalida();

    function mover(clientX, clientY) {
      const rect = campo.getBoundingClientRect();
      luzX = clientX - rect.left;
      luzY = clientY - rect.top;
      luz.style.left = luzX + 'px';
      luz.style.top  = luzY + 'px';
    }
    campo.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      mover(t.clientX, t.clientY);
    }, { passive: false });
    campo.addEventListener('mousemove', e => mover(e.clientX, e.clientY));

    // La puerta se reubica sola; más seguido en cuartos avanzados
    const intervaloPuerta = registrarTemporizador(
      setInterval(reposicionarSalida, Math.max(5000 - cuarto * 800, 2400))
    );

    // El monstruo aparece de vez en cuando; si está muy cerca de la luz, susto = reinicia el cuarto
    const intervaloMonstruo = registrarTemporizador(setInterval(() => {
      const maxX = Math.max(campo.clientWidth  - 60, 0);
      const maxY = Math.max(campo.clientHeight - 60, 0);
      const mx = Math.random() * maxX;
      const my = Math.random() * maxY;
      monstruo.style.left = mx + 'px';
      monstruo.style.top  = my + 'px';
      monstruo.classList.remove('hidden');

      registrarTemporizador(setTimeout(() => monstruo.classList.add('hidden'), 500));

      const distancia = Math.hypot(mx - luzX, my - luzY);
      if (distancia < 90 && !terminado) {
        terminado = true;
        detenerCuarto();
        cuarto -= 1; // repetir el mismo cuarto
        registrarTemporizador(setTimeout(siguienteCuarto, 700));
      }
    }, 3500));

    const TIEMPO_LIMITE = 13000;
    const inicio = Date.now();
    const intervaloTiempo = registrarTemporizador(setInterval(() => {
      const restante = Math.max(0, 1 - (Date.now() - inicio) / TIEMPO_LIMITE);
      barra.style.width = (restante * 100) + '%';
      if (restante <= 0 && !terminado) {
        terminado = true;
        detenerCuarto();
        cuarto -= 1; // se acabó la luz: repetir el mismo cuarto
        siguienteCuarto();
      }
    }, 100));

    function detenerCuarto() {
      clearInterval(intervaloPuerta);
      clearInterval(intervaloMonstruo);
      clearInterval(intervaloTiempo);
    }

    alTocar(salida, () => {
      if (terminado) return;
      terminado = true;
      detenerCuarto();
      siguienteCuarto();
    });
  }

  siguienteCuarto();
}


// ================================================================
// 5. PLANKTON — Memoriza los 5 ingredientes (3s, luego se borran)
// ================================================================
function juegoMemoria(container, onWin) {
  detenerMinijuegoActual();

  const ingredientes = ['🍞', '🥩', '🧀', '🍅', '🥬'];

  container.innerHTML = `
    <p class="minijuego-instruccion" id="memoria-instruccion">Memoriza el orden (3 segundos)</p>
    <div class="memoria-secuencia" id="memoria-secuencia">
      ${ingredientes.map(i => `<span class="memoria-ficha">${i}</span>`).join('')}
    </div>
    <div class="memoria-opciones" id="memoria-opciones"></div>
  `;

  registrarTemporizador(setTimeout(() => {
    // Borrar la secuencia por completo: ya no se puede "hacer trampa" viéndola
    container.querySelector('#memoria-secuencia').innerHTML = '';
    container.querySelector('#memoria-instruccion').textContent = 'Ahora tócalos en el mismo orden';

    let respuestaIdx = 0;
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
  }, 3000));
}


// ================================================================
// 6. EL LOBO — Esquiva el láser cambiando de carril a tiempo
//    (rediseñado por completo: ahora se avisa ANTES de disparar)
// ================================================================
function juegoLaser(container, onWin) {
  detenerMinijuegoActual();

  const META = 6;
  let ronda = 0;
  let posicionActual = 1; // 0 arriba, 1 medio, 2 abajo
  let carrilPeligro = null;
  let rondaActiva = false;

  container.innerHTML = `
    <p class="minijuego-instruccion">Cuando un carril se ponga en alerta roja, ¡múdate a otro carril antes de que dispare!</p>
    <div class="laser-carriles" id="laser-carriles">
      <button class="laser-carril" data-carril="0"><span class="laser-personaje-mini hidden">🐺</span></button>
      <button class="laser-carril" data-carril="1"><span class="laser-personaje-mini hidden">🐺</span></button>
      <button class="laser-carril" data-carril="2"><span class="laser-personaje-mini hidden">🐺</span></button>
    </div>
    <p class="minijuego-contador" id="laser-contador">0 / ${META}</p>
  `;

  const carrilesEls = container.querySelectorAll('.laser-carril');

  function actualizarPersonaje() {
    carrilesEls.forEach((c, i) => {
      c.querySelector('.laser-personaje-mini').classList.toggle('hidden', i !== posicionActual);
    });
  }
  actualizarPersonaje();

  carrilesEls.forEach(carrilEl => {
    alTocar(carrilEl, () => {
      posicionActual = Number(carrilEl.dataset.carril);
      actualizarPersonaje();
    });
  });

  function nuevaRonda() {
    rondaActiva = true;
    carrilPeligro = Math.floor(Math.random() * 3);
    carrilesEls[carrilPeligro].classList.add('laser-alerta');

    registrarTemporizador(setTimeout(() => {
      if (!rondaActiva) return;
      rondaActiva = false;
      carrilesEls.forEach(c => c.classList.remove('laser-alerta'));
      if (posicionActual === carrilPeligro) {
        fallar();
      } else {
        acierto();
      }
    }, 1500));
  }

  function acierto() {
    ronda += 1;
    container.querySelector('#laser-contador').textContent = `${ronda} / ${META}`;
    if (ronda >= META) {
      onWin();
    } else {
      registrarTemporizador(setTimeout(nuevaRonda, 500));
    }
  }

  function fallar() {
    container.querySelector('#laser-contador').textContent = '¡Te alcanzó el láser! Reintentando...';
    registrarTemporizador(setTimeout(() => {
      ronda = 0;
      container.querySelector('#laser-contador').textContent = `0 / ${META}`;
      nuevaRonda();
    }, 1000));
  }

  nuevaRonda();
}


// ================================================================
// 7. VILLANO DRAGÓN — Memorama: encuentra los 3 pares de oro
//    (evita las piedras falsas), volteando 2 cartas a la vez
// ================================================================
function juegoOro(container, onWin) {
  detenerMinijuegoActual();

  const simbolosOro   = ['💰', '👑', '🟨'];
  const simbolosFalso = ['🪨', '⚪', '🥔'];
  let mazo = [...simbolosOro, ...simbolosOro, ...simbolosFalso, ...simbolosFalso];
  mazo = mazo.sort(() => Math.random() - 0.5);

  let paresOro = 0;
  let primeraSeleccion = null;
  let bloqueado = false;

  container.innerHTML = `
    <p class="minijuego-instruccion">Encuentra los 3 pares de ORO verdadero (evita las piedras)</p>
    <div class="oro-memorama" id="oro-memorama"></div>
    <p class="minijuego-contador" id="oro-contador">0 / 3 pares de oro</p>
  `;

  const grid = container.querySelector('#oro-memorama');

  mazo.forEach(simbolo => {
    const carta = document.createElement('button');
    carta.className = 'oro-carta';
    carta.dataset.simbolo = simbolo;
    carta.dataset.esOro = simbolosOro.includes(simbolo) ? '1' : '0';
    carta.textContent = '❓';
    grid.appendChild(carta);

    alTocar(carta, () => {
      if (bloqueado || carta.classList.contains('oro-carta-resuelta') || carta === primeraSeleccion) return;

      carta.textContent = simbolo;
      carta.classList.add('oro-carta-volteada');

      if (!primeraSeleccion) {
        primeraSeleccion = carta;
        return;
      }

      bloqueado = true;
      const actual = primeraSeleccion;
      const coinciden = actual.dataset.simbolo === carta.dataset.simbolo;

      registrarTemporizador(setTimeout(() => {
        if (coinciden) {
          actual.classList.add('oro-carta-resuelta');
          carta.classList.add('oro-carta-resuelta');
          if (carta.dataset.esOro === '1') {
            paresOro += 1;
            container.querySelector('#oro-contador').textContent = `${paresOro} / 3 pares de oro`;
            if (paresOro >= 3) { onWin(); }
          }
        } else {
          actual.textContent = '❓';
          carta.textContent = '❓';
          actual.classList.remove('oro-carta-volteada');
          carta.classList.remove('oro-carta-volteada');
        }
        primeraSeleccion = null;
        bloqueado = false;
      }, 700));
    });
  });
}


// ================================================================
// 8. EL PROTOTIPO — Laberinto más grande (7x7) con 2 guardias
//    que patrullan de un lado a otro
// ================================================================
function juegoLaberinto(container, onWin) {
  detenerMinijuegoActual();

  // 0 libre, 1 pared, 2 inicio (informativo), 3 meta.
  // Las filas 2 y 4 (donde patrullan los guardias) están COMPLETAMENTE
  // abiertas a propósito: así el guardia solo ocupa una celda a la vez
  // y siempre queda espacio de sobra para rodearlo, en vez de bloquear
  // el único paso posible.
  const MAPA = [
    [2, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 3],
  ];

  // Los guardias patrullan de un lado a otro de su fila (ping-pong)
  const rutaGuardia1 = [
    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
    { x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 },
  ];
  const rutaGuardia2 = [
    { x: 5, y: 4 }, { x: 4, y: 4 }, { x: 3, y: 4 }, { x: 2, y: 4 },
    { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
  ];
  let pasoGuardia1 = 0, pasoGuardia2 = 0;
  let pos = { x: 0, y: 0 };

  container.innerHTML = `
    <p class="minijuego-instruccion">Llega a la salida. Evita las paredes Y a los guardias que patrullan</p>
    <div class="laberinto-grid laberinto-grid-7" id="laberinto-grid"></div>
    <div class="laberinto-controles">
      <button class="btn-secondary" id="lab-arriba">⬆️</button>
      <div class="laberinto-fila-controles">
        <button class="btn-secondary" id="lab-izq">⬅️</button>
        <button class="btn-secondary" id="lab-der">➡️</button>
      </div>
      <button class="btn-secondary" id="lab-abajo">⬇️</button>
    </div>
  `;

  const grid = container.querySelector('#laberinto-grid');

  function posGuardias() {
    return [rutaGuardia1[pasoGuardia1], rutaGuardia2[pasoGuardia2]];
  }

  function dibujar() {
    grid.innerHTML = '';
    const guardias = posGuardias();
    MAPA.forEach((fila, y) => {
      fila.forEach((celda, x) => {
        const div = document.createElement('div');
        div.className = 'laberinto-celda';
        if (celda === 1) div.classList.add('laberinto-peligro');
        if (celda === 3) div.classList.add('laberinto-meta');
        if (guardias.some(g => g.x === x && g.y === y)) div.classList.add('laberinto-guardia');
        if (pos.x === x && pos.y === y) div.classList.add('laberinto-jugador');
        grid.appendChild(div);
      });
    });
  }

  function chocaConGuardia() {
    return posGuardias().some(g => g.x === pos.x && g.y === pos.y);
  }

  function mover(dx, dy) {
    const nx = pos.x + dx, ny = pos.y + dy;
    if (nx < 0 || nx > 6 || ny < 0 || ny > 6) return;
    if (MAPA[ny][nx] === 1) { pos = { x: 0, y: 0 }; dibujar(); return; }
    pos = { x: nx, y: ny };
    if (chocaConGuardia()) { pos = { x: 0, y: 0 }; dibujar(); return; }
    dibujar();
    if (MAPA[ny][nx] === 3) {
      clearInterval(intervaloGuardias);
      onWin();
    }
  }

  alTocar(container.querySelector('#lab-arriba'), () => mover(0, -1));
  alTocar(container.querySelector('#lab-abajo'),  () => mover(0, 1));
  alTocar(container.querySelector('#lab-izq'),    () => mover(-1, 0));
  alTocar(container.querySelector('#lab-der'),    () => mover(1, 0));

  const intervaloGuardias = registrarTemporizador(setInterval(() => {
    pasoGuardia1 = (pasoGuardia1 + 1) % rutaGuardia1.length;
    pasoGuardia2 = (pasoGuardia2 + 1) % rutaGuardia2.length;
    if (chocaConGuardia()) pos = { x: 0, y: 0 };
    dibujar();
  }, 800));

  dibujar();
}


// ================================================================
// 9. BLUE — Escóndete en la dirección donde NO está mirando
// ================================================================
function juegoEscondite(container, onWin) {
  detenerMinijuegoActual();

  const META = 6;
  let logrados = 0;
  let miradaActual = 1; // 0 izquierda, 1 centro, 2 derecha

  container.innerHTML = `
    <p class="minijuego-instruccion">Escóndete en el lugar donde Blue NO esté mirando</p>
    <div class="escondite-campo">
      <div class="escondite-blue" id="escondite-blue">👀</div>
    </div>
    <p class="minijuego-contador" id="escondite-contador">0 / ${META}</p>
    <div class="escondite-spots">
      <button class="btn-secondary" data-spot="0">⬅️ Izquierda</button>
      <button class="btn-secondary" data-spot="1">⬆️ Centro</button>
      <button class="btn-secondary" data-spot="2">➡️ Derecha</button>
    </div>
  `;

  const blueEl   = container.querySelector('#escondite-blue');
  const contador = container.querySelector('#escondite-contador');
  const FLECHAS  = ['👈', '👀', '👉'];

  function cambiarMirada() {
    miradaActual = Math.floor(Math.random() * 3);
    blueEl.textContent = FLECHAS[miradaActual];
    registrarTemporizador(setTimeout(cambiarMirada, 900 + Math.random() * 700));
  }
  cambiarMirada();

  container.querySelectorAll('[data-spot]').forEach(btn => {
    alTocar(btn, () => {
      const spot = Number(btn.dataset.spot);
      if (spot === miradaActual) {
        logrados = 0;
        contador.textContent = `0 / ${META}`;
      } else {
        logrados += 1;
        contador.textContent = `${logrados} / ${META}`;
        if (logrados >= META) onWin();
      }
    });
  });
}


// ================================================================
// REGISTRO DE MINIJUEGOS
// ================================================================
window.MINIJUEGOS = {
  luna:        juegoLuna,
  loteria:     juegoLoteria,
  matematicas: juegoMatematicas,
  linterna:    juegoLinterna,
  memoria:     juegoMemoria,
  laser:       juegoLaser,
  oro:         juegoOro,
  laberinto:   juegoLaberinto,
  escondite:   juegoEscondite,
};
