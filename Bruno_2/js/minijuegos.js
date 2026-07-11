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
// 2. CHARRO NEGRO — Lotería: ARRASTRA cada pieza a su casilla exacta
// ================================================================
function juegoLoteria(container, onWin) {
  detenerMinijuegoActual();

  const ICONOS = ['☀️','🌙','⭐','❤️','🌳','🐍','🌵','🎸','🌸','🐓','🐟','🔔','🌈','☂️','🍉','🗝️'];
  let colocadas = 0;

  container.innerHTML = `
    <p class="minijuego-instruccion">Arrastra cada pieza voladora hasta SU casilla exacta en la carta</p>
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

  indicesBarajados.forEach(indexOriginal => {
    const pieza = document.createElement('div');
    pieza.className = 'loteria-pieza';
    pieza.textContent = ICONOS[indexOriginal];
    pieza.dataset.index = indexOriginal;
    campo.appendChild(pieza);
    posicionarAleatorio(pieza);
    hacerArrastrable(pieza);
  });

  function posicionarAleatorio(pieza) {
    const maxX = Math.max(campo.clientWidth  - 58, 0);
    const maxY = Math.max(campo.clientHeight - 58, 0);
    pieza.style.left = (Math.random() * maxX) + 'px';
    pieza.style.top  = (Math.random() * maxY) + 'px';
    pieza.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
    pieza.style.animationDelay = (Math.random() * 1.5) + 's';
  }

  /**
   * hacerArrastrable(pieza)
   * Conecta la pieza a eventos de arrastre reales (dedo o mouse).
   * Al soltarla, SOLO se acomoda si el CENTRO de la pieza quedó
   * dentro de SU casilla correcta (no cualquier casilla, ni con
   * solo tocar el área general de la carta). Si no es su lugar,
   * simplemente se queda donde la soltaron.
   */
  function hacerArrastrable(pieza) {
    let arrastrando = false;
    let offsetX = 0, offsetY = 0;

    function iniciar(clientX, clientY) {
      if (pieza.classList.contains('loteria-colocada')) return;
      arrastrando = true;
      pieza.style.animation = 'none'; // deja de flotar mientras se arrastra
      pieza.style.transition = 'none';
      pieza.classList.add('loteria-arrastrando');
      const rect = pieza.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
    }

    function mover(clientX, clientY) {
      if (!arrastrando) return;
      const rectCampo = campo.getBoundingClientRect();
      let x = clientX - rectCampo.left - offsetX;
      let y = clientY - rectCampo.top - offsetY;
      x = Math.max(0, Math.min(x, campo.clientWidth  - pieza.offsetWidth));
      y = Math.max(0, Math.min(y, campo.clientHeight - pieza.offsetHeight));
      pieza.style.left = x + 'px';
      pieza.style.top  = y + 'px';
    }

    function soltar() {
      if (!arrastrando) return;
      arrastrando = false;
      pieza.classList.remove('loteria-arrastrando');

      const idx = pieza.dataset.index;
      const casillaCorrecta = carta.querySelector(`.loteria-casilla[data-index="${idx}"]`);
      const rectPieza = pieza.getBoundingClientRect();
      const rectCasilla = casillaCorrecta.getBoundingClientRect();
      const centroX = rectPieza.left + rectPieza.width / 2;
      const centroY = rectPieza.top + rectPieza.height / 2;

      const esSuLugar = centroX >= rectCasilla.left && centroX <= rectCasilla.right &&
                         centroY >= rectCasilla.top  && centroY <= rectCasilla.bottom;

      if (esSuLugar) {
        const rectCampo = campo.getBoundingClientRect();
        pieza.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.3s ease 0.2s';
        pieza.style.left = (rectCasilla.left - rectCampo.left + rectCasilla.width  / 2 - pieza.offsetWidth  / 2) + 'px';
        pieza.style.top  = (rectCasilla.top  - rectCampo.top  + rectCasilla.height / 2 - pieza.offsetHeight / 2) + 'px';
        pieza.classList.add('loteria-colocada');
        casillaCorrecta.querySelector('.loteria-fantasma').style.opacity = '1';

        colocadas += 1;
        container.querySelector('#loteria-contador').textContent = `${colocadas} / 16`;
        registrarTemporizador(setTimeout(() => { pieza.style.opacity = '0'; }, 210));
        if (colocadas >= 16) registrarTemporizador(setTimeout(onWin, 400));
      } else {
        // No era su lugar: se queda flotando justo donde la soltaron
        registrarTemporizador(setTimeout(() => {
          if (!pieza.classList.contains('loteria-colocada')) {
            pieza.style.animation = 'loteriaFlotar 3s ease-in-out infinite';
          }
        }, 30));
      }
    }

    pieza.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      iniciar(t.clientX, t.clientY);
    }, { passive: false });
    pieza.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      mover(t.clientX, t.clientY);
    }, { passive: false });
    pieza.addEventListener('touchend', soltar);

    pieza.addEventListener('mousedown', e => {
      e.preventDefault();
      iniciar(e.clientX, e.clientY);
      const onMove = ev => mover(ev.clientX, ev.clientY);
      const onUp = () => {
        soltar();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
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
    return { a, b, esSuma, resultado };
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
      <div class="mate-vertical">
        <div class="mate-fila-num">${problema.a}</div>
        <div class="mate-fila-num mate-fila-b">
          <span class="mate-signo">${problema.esSuma ? '+' : '−'}</span>${problema.b}
        </div>
        <div class="mate-linea"></div>
      </div>
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
    <p class="minijuego-instruccion" id="memoria-instruccion">Memoriza el orden...</p>
    <div class="memoria-secuencia" id="memoria-secuencia"></div>
    <div class="memoria-opciones" id="memoria-opciones"></div>
  `;

  const secuenciaDiv = container.querySelector('#memoria-secuencia');
  let i = 0;

  // Mostrar los ingredientes UNO POR UNO, en orden ascendente, hasta
  // que los 5 estén visibles a la vez.
  function mostrarSiguiente() {
    if (i < ingredientes.length) {
      const span = document.createElement('span');
      span.className = 'memoria-ficha';
      span.textContent = ingredientes[i];
      secuenciaDiv.appendChild(span);
      i += 1;
      registrarTemporizador(setTimeout(mostrarSiguiente, 600));
      return;
    }

    // Ya se ven los 5: esperar 3 segundos completos con la secuencia
    // visible, y HASTA ENTONCES borrarla para que responda de memoria.
    registrarTemporizador(setTimeout(() => {
      secuenciaDiv.innerHTML = '';
      container.querySelector('#memoria-instruccion').textContent = 'Ahora tócalos en el mismo orden';
      montarOpciones();
    }, 3000));
  }

  function montarOpciones() {
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
  }

  mostrarSiguiente();
}


// ================================================================
// 6. EL LOBO — Esquiva el láser cambiando de carril a tiempo
//    (rediseñado por completo: ahora se avisa ANTES de disparar)
// ================================================================
function juegoLaser(container, onWin) {
  detenerMinijuegoActual();

  const META = 8;
  let ronda = 0;
  let posicionActual = 1; // 0 arriba, 1 medio, 2 abajo
  let carrilesPeligro = [];

  container.innerHTML = `
    <p class="minijuego-instruccion">Un carril parpadeará en VERDE 3 veces de aviso — cuando se ponga ROJO, no debes estar ahí</p>
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

  /**
   * elegirCarriles()
   * A partir de la ronda 6, se activan 2 carriles peligrosos a la
   * vez (solo queda 1 carril seguro) — mucho más difícil.
   */
  function elegirCarriles() {
    const cantidad = ronda >= 5 ? 2 : 1;
    const disponibles = [0, 1, 2].sort(() => Math.random() - 0.5);
    return disponibles.slice(0, cantidad);
  }

  function nuevaRonda() {
    carrilesPeligro = elegirCarriles();

    // Fase de aviso: parpadea en VERDE exactamente 3 veces (6 cambios
    // de estado = 3 ciclos de encendido/apagado). La velocidad del
    // parpadeo se acelera un poco en rondas avanzadas.
    let parpadeos = 0;
    const totalParpadeos = 6;
    const velocidad = Math.max(300 - ronda * 12, 170);

    const intervaloAviso = registrarTemporizador(setInterval(() => {
      carrilesPeligro.forEach(c => carrilesEls[c].classList.toggle('laser-aviso-verde'));
      parpadeos += 1;

      if (parpadeos >= totalParpadeos) {
        clearInterval(intervaloAviso);
        carrilesPeligro.forEach(c => carrilesEls[c].classList.remove('laser-aviso-verde'));

        // Ahora sí: peligro real (rojo)
        carrilesPeligro.forEach(c => carrilesEls[c].classList.add('laser-alerta'));

        registrarTemporizador(setTimeout(() => {
          carrilesPeligro.forEach(c => carrilesEls[c].classList.remove('laser-alerta'));
          if (carrilesPeligro.includes(posicionActual)) {
            fallar();
          } else {
            acierto();
          }
        }, 650));
      }
    }, velocidad));
  }

  function acierto() {
    ronda += 1;
    container.querySelector('#laser-contador').textContent = `${ronda} / ${META}`;
    if (ronda >= META) {
      onWin();
    } else {
      registrarTemporizador(setTimeout(nuevaRonda, 450));
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
  const simbolosFalso = ['🪨', '⚪', '🥔', '🦴', '🧊'];
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
  // Las filas 2, 4 y 6 (donde patrullan los guardias) están COMPLETAMENTE
  // abiertas a propósito: así cada guardia solo ocupa una celda a la vez
  // y siempre queda espacio de sobra para rodearlo.
  const N = 9;
  const MAPA = [
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 1, 1, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 3],
  ];

  // 3 guardias-policía patrullando de un lado a otro de su fila
  const rutaGuardia1 = [
    { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
    { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 6, y: 2 }, { x: 5, y: 2 }, { x: 4, y: 2 },
    { x: 3, y: 2 }, { x: 2, y: 2 },
  ];
  const rutaGuardia2 = [
    { x: 7, y: 4 }, { x: 6, y: 4 }, { x: 5, y: 4 }, { x: 4, y: 4 }, { x: 3, y: 4 },
    { x: 2, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
    { x: 5, y: 4 }, { x: 6, y: 4 },
  ];
  const rutaGuardia3 = [
    { x: 1, y: 6 }, { x: 3, y: 6 }, { x: 5, y: 6 }, { x: 7, y: 6 },
    { x: 5, y: 6 }, { x: 3, y: 6 },
  ];
  let pasoGuardia1 = 0, pasoGuardia2 = 0, pasoGuardia3 = 0;
  let pos = { x: 0, y: 0 };

  container.innerHTML = `
    <p class="minijuego-instruccion">Llega a la salida. Evita las paredes Y a los policías que patrullan</p>
    <div class="laberinto-grid laberinto-grid-9" id="laberinto-grid"></div>
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
    return [rutaGuardia1[pasoGuardia1], rutaGuardia2[pasoGuardia2], rutaGuardia3[pasoGuardia3]];
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
        if (guardias.some(g => g.x === x && g.y === y)) {
          div.classList.add('laberinto-guardia');
          div.textContent = '👮';
        }
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
    if (nx < 0 || nx >= N || ny < 0 || ny >= N) return;
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
    pasoGuardia3 = (pasoGuardia3 + 1) % rutaGuardia3.length;
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

  const META_PROGRESO = 100;
  const AVANCE_POR_TOQUE = 9;
  let avance = 0;
  let luzVerde = true;

  container.innerHTML = `
    <p class="minijuego-instruccion">Luz verde: toca CORRER para avanzar. Luz roja: no toques nada o Blue te atrapa</p>
    <div class="escondite-semaforo">
      <div class="escondite-blue-grande" id="escondite-blue-grande">🙈</div>
      <div class="escondite-luz" id="escondite-luz">VERDE</div>
    </div>
    <div class="barra-tiempo"><div class="barra-tiempo-interna" id="escondite-avance"></div></div>
    <button class="btn-primary" id="escondite-correr-btn">🏃 Correr</button>
  `;

  const blueEl   = container.querySelector('#escondite-blue-grande');
  const luzEl    = container.querySelector('#escondite-luz');
  const barraEl  = container.querySelector('#escondite-avance');
  const btnCorrer = container.querySelector('#escondite-correr-btn');

  function actualizarBarra() {
    barraEl.style.width = avance + '%';
  }

  function cambiarLuz() {
    luzVerde = !luzVerde;
    blueEl.textContent = luzVerde ? '🙈' : '👀';
    blueEl.classList.toggle('escondite-mirando', !luzVerde);
    luzEl.textContent = luzVerde ? 'VERDE' : 'ROJO';
    luzEl.classList.toggle('escondite-luz-roja', !luzVerde);

    // La luz verde dura un poco más que la roja; ambas se acortan
    // levemente conforme se acerca a la meta, para más tensión al final.
    const factor = 1 - (avance / META_PROGRESO) * 0.35;
    const duracion = luzVerde
      ? numAleatorioLocal(1100, 2000) * factor
      : numAleatorioLocal(900, 1700) * factor;

    registrarTemporizador(setTimeout(cambiarLuz, duracion));
  }
  cambiarLuz();

  function atrapado() {
    avance = Math.max(0, avance - 35); // retrocede, no se va a cero de golpe
    actualizarBarra();
    blueEl.classList.add('escondite-atrapado');
    registrarTemporizador(setTimeout(() => blueEl.classList.remove('escondite-atrapado'), 350));
  }

  alTocar(btnCorrer, () => {
    if (luzVerde) {
      avance = Math.min(META_PROGRESO, avance + AVANCE_POR_TOQUE);
      actualizarBarra();
      if (avance >= META_PROGRESO) onWin();
    } else {
      atrapado();
    }
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
