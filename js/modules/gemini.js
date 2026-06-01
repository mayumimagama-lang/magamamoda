// ============================================================
// MAGAMA SHOP · ASISTENTE IA — para JUMILA ERP
// ------------------------------------------------------------
// La clave de Gemini vive SEGURA dentro del Apps Script
// (lado servidor). Este archivo NO contiene ninguna clave.
// Incluye modo CLARO y OSCURO (botón sol/luna en la barra).
// ============================================================

const GeminiAI = {

  // URL del proxy (Apps Script v15 con Gemini). NO es secreto.
  // ⚠️ Debe ser EXACTAMENTE la que copiaste con "Copy" y terminar en /exec.
  PROXY_URL: 'https://script.google.com/macros/s/AKfycbzopc9-UZI3fNvav1c1_Tar52kRy_gom7grN5-q4MdlTOQ6SSvD_BH2CSmTmgW1j_EfXg/exec',

  SUGERENCIAS: [
    { icon: '📊', texto: '¿Cuántas ventas tengo hoy y por cuánto?' },
    { icon: '📦', texto: '¿Qué productos tienen stock bajo?' },
    { icon: '🚫', texto: '¿Qué productos están agotados?' },
    { icon: '🧾', texto: 'Dame un resumen del día' },
    { icon: '👥', texto: '¿Cuántos clientes tengo registrados?' },
    { icon: '💡', texto: 'Dame una recomendación para vender más' }
  ],

  historial: [],
  abierto: false,
  cargando: false,

  init() {
    if (document.getElementById('magamaIA-fab')) return;
    this._inyectarUI();
    this._eventos();
    let t = 'oscuro';
    try { t = localStorage.getItem('magamaIA_tema') || 'oscuro'; } catch (e) {}
    this._aplicarTema(t);
  },

  _inyectarUI() {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap');

      #magamaIA-root *, #magamaIA-root *::before, #magamaIA-root *::after { box-sizing: border-box; margin: 0; }
      #magamaIA-root { font-family: 'Manrope', system-ui, sans-serif; }

      /* Boton flotante (se mantiene dorado en ambos modos) */
      #magamaIA-fab {
        position: fixed; bottom: 26px; right: 26px;
        width: 64px; height: 64px; border-radius: 50%;
        border: none; cursor: pointer; z-index: 999999;
        background: radial-gradient(120% 120% at 30% 25%, #e7c489 0%, #cf9b54 55%, #a8763a 100%);
        color: #2a2014; display: flex; align-items: center; justify-content: center;
        box-shadow: 0 10px 28px rgba(180,130,60,.45), inset 0 1px 1px rgba(255,255,255,.5);
        transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease;
      }
      #magamaIA-fab:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 16px 36px rgba(180,130,60,.6); }
      #magamaIA-fab:active { transform: scale(.96); }
      #magamaIA-fab svg { width: 30px; height: 30px; }
      #magamaIA-fab .magamaIA-pip {
        position: absolute; top: 4px; right: 4px; width: 13px; height: 13px;
        background: #38c172; border: 2.5px solid #cf9b54; border-radius: 50%;
      }

      /* Panel — variables de tema (OSCURO por defecto) */
      #magamaIA-panel {
        --mia-panel-bg: linear-gradient(168deg, #1d1b22 0%, #161419 100%);
        --mia-header-bg: linear-gradient(120deg, #221f27, #1a181f);
        --mia-border: rgba(216,168,92,.18);
        --mia-text: #f3ede2;
        --mia-text2: #e9e5dd;
        --mia-muted: #9a9aa6;
        --mia-surface: #272530;
        --mia-surface-border: rgba(255,255,255,.05);
        --mia-strong: #f0d9a8;
        --mia-input-bg: #262430;
        --mia-input-border: #34313d;
        --mia-input-text: #ede9e2;
        --mia-chip-bg: #221f27;
        --mia-chip-border: rgba(255,255,255,.07);
        --mia-chip-hover: #2a2731;
        --mia-msgrow-bg: #1a181f;
        --mia-scroll: #3a3742;
        --mia-hbtn-bg: rgba(255,255,255,.06);
        --mia-hbtn-text: #cbb48a;
        --mia-placeholder: #75717e;
        --mia-shadow: rgba(0,0,0,.5);

        position: fixed; bottom: 104px; right: 26px;
        width: 410px; max-width: calc(100vw - 28px);
        height: 640px; max-height: calc(100vh - 140px);
        z-index: 999999; border-radius: 22px; overflow: hidden;
        display: flex; flex-direction: column;
        background: var(--mia-panel-bg);
        border: 1px solid var(--mia-border);
        box-shadow: 0 24px 70px var(--mia-shadow);
        transform-origin: bottom right;
        animation: magamaIA-in .32s cubic-bezier(.21,1.02,.46,1) both;
      }
      /* Tema CLARO */
      #magamaIA-panel.magamaIA-light {
        --mia-panel-bg: linear-gradient(168deg, #ffffff 0%, #faf6ef 100%);
        --mia-header-bg: linear-gradient(120deg, #fdfaf5, #f6f1e8);
        --mia-border: rgba(180,130,60,.30);
        --mia-text: #2a2630;
        --mia-text2: #33303a;
        --mia-muted: #8a8694;
        --mia-surface: #f5f1ea;
        --mia-surface-border: rgba(0,0,0,.06);
        --mia-strong: #a8763a;
        --mia-input-bg: #f4f0e9;
        --mia-input-border: #e3ddd0;
        --mia-input-text: #2a2630;
        --mia-chip-bg: #f6f2ec;
        --mia-chip-border: rgba(0,0,0,.08);
        --mia-chip-hover: #efe9df;
        --mia-msgrow-bg: #f7f3ec;
        --mia-scroll: #d8d2c6;
        --mia-hbtn-bg: rgba(0,0,0,.05);
        --mia-hbtn-text: #9c7a40;
        --mia-placeholder: #9a9488;
        --mia-shadow: rgba(120,90,40,.22);
      }
      #magamaIA-panel.magamaIA-hidden { display: none; }
      @keyframes magamaIA-in { from { opacity: 0; transform: translateY(18px) scale(.94); } to { opacity: 1; transform: none; } }

      /* Header */
      #magamaIA-header {
        padding: 16px 18px; position: relative;
        background: var(--mia-header-bg);
        border-bottom: 1px solid var(--mia-border);
        display: flex; align-items: center; gap: 12px;
      }
      #magamaIA-header::after {
        content: ''; position: absolute; left: 18px; right: 18px; bottom: -1px; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(216,168,92,.6), transparent);
      }
      #magamaIA-logo {
        width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
        background: radial-gradient(120% 120% at 30% 25%, #e7c489, #b5853f);
        display: flex; align-items: center; justify-content: center; color: #241b0f;
        font-family: 'Playfair Display', serif; font-weight: 700; font-size: 17px;
        box-shadow: inset 0 1px 1px rgba(255,255,255,.5);
      }
      #magamaIA-titulos { flex: 1; min-width: 0; }
      #magamaIA-marca {
        font-family: 'Playfair Display', serif; font-weight: 600; font-size: 17px;
        color: var(--mia-text); letter-spacing: .4px; line-height: 1.1;
      }
      #magamaIA-estado { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--mia-muted); margin-top: 2px; }
      #magamaIA-estado .magamaIA-dot { width: 7px; height: 7px; border-radius: 50%; background: #38c172; box-shadow: 0 0 0 0 rgba(56,193,114,.6); animation: magamaIA-pulse 2s infinite; }
      @keyframes magamaIA-pulse { 0% { box-shadow: 0 0 0 0 rgba(56,193,114,.5);} 70%{ box-shadow: 0 0 0 7px rgba(56,193,114,0);} 100%{ box-shadow:0 0 0 0 rgba(56,193,114,0);} }
      .magamaIA-hbtn {
        width: 32px; height: 32px; border-radius: 9px; border: none; cursor: pointer;
        background: var(--mia-hbtn-bg); color: var(--mia-hbtn-text); font-size: 15px;
        display: flex; align-items: center; justify-content: center; transition: background .2s; flex-shrink: 0;
      }
      .magamaIA-hbtn:hover { background: rgba(216,168,92,.2); color: #d9b878; }

      /* Mensajes */
      #magamaIA-mensajes {
        flex: 1; overflow-y: auto; padding: 18px 16px; display: flex; flex-direction: column; gap: 14px;
        scrollbar-width: thin; scrollbar-color: var(--mia-scroll) transparent;
      }
      #magamaIA-mensajes::-webkit-scrollbar { width: 7px; }
      #magamaIA-mensajes::-webkit-scrollbar-thumb { background: var(--mia-scroll); border-radius: 4px; }

      .magamaIA-fila { display: flex; gap: 9px; align-items: flex-end; animation: magamaIA-msg .28s ease both; }
      @keyframes magamaIA-msg { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: none; } }
      .magamaIA-fila.user { flex-direction: row-reverse; }
      .magamaIA-av {
        width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center; font-size: 14px;
        background: radial-gradient(120% 120% at 30% 25%, #e7c489, #b5853f); color: #241b0f;
      }
      .magamaIA-burbuja { max-width: 78%; padding: 11px 14px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
      .magamaIA-bot .magamaIA-burbuja {
        background: var(--mia-surface); color: var(--mia-text2); border: 1px solid var(--mia-surface-border);
        border-radius: 16px 16px 16px 5px;
      }
      .magamaIA-user .magamaIA-burbuja {
        background: linear-gradient(135deg, #dcae66, #c2913f); color: #221a0d; font-weight: 500;
        border-radius: 16px 16px 5px 16px;
      }
      .magamaIA-burbuja strong { font-weight: 700; }
      .magamaIA-bot .magamaIA-burbuja strong { color: var(--mia-strong); }
      .magamaIA-hora { font-size: 10px; color: var(--mia-muted); margin-top: 4px; padding: 0 4px; }
      .magamaIA-fila.user .magamaIA-hora { text-align: right; }

      /* Bienvenida + chips */
      #magamaIA-bienvenida { display: flex; flex-direction: column; gap: 14px; }
      .magamaIA-welcome-card {
        background: var(--mia-surface); border: 1px solid var(--mia-border); border-radius: 16px;
        padding: 16px; color: var(--mia-text2);
      }
      .magamaIA-welcome-card h4 { font-family: 'Playfair Display', serif; font-weight: 600; font-size: 16px; color: var(--mia-text); margin-bottom: 5px; }
      .magamaIA-welcome-card p { font-size: 13px; color: var(--mia-muted); line-height: 1.5; }
      .magamaIA-chips { display: flex; flex-direction: column; gap: 8px; }
      .magamaIA-chip {
        text-align: left; cursor: pointer; font-family: inherit;
        background: var(--mia-chip-bg); border: 1px solid var(--mia-chip-border); color: var(--mia-text2);
        padding: 11px 13px; border-radius: 12px; font-size: 13px; display: flex; align-items: center; gap: 10px;
        transition: border-color .2s, transform .12s, background .2s;
      }
      .magamaIA-chip:hover { border-color: rgba(216,168,92,.55); background: var(--mia-chip-hover); transform: translateX(2px); }
      .magamaIA-chip .ic { font-size: 16px; }

      /* Indicador escribiendo */
      .magamaIA-typing { display: flex; gap: 4px; padding: 6px 2px; }
      .magamaIA-typing span { width: 7px; height: 7px; border-radius: 50%; background: #c2913f; opacity: .5; animation: magamaIA-bounce 1.2s infinite; }
      .magamaIA-typing span:nth-child(2){ animation-delay: .15s; }
      .magamaIA-typing span:nth-child(3){ animation-delay: .3s; }
      @keyframes magamaIA-bounce { 0%,60%,100%{ transform: translateY(0); opacity:.4; } 30%{ transform: translateY(-5px); opacity:1; } }

      /* Input */
      #magamaIA-input-row {
        display: flex; gap: 9px; padding: 13px 14px;
        background: var(--mia-msgrow-bg); border-top: 1px solid var(--mia-surface-border); align-items: center;
      }
      #magamaIA-input {
        flex: 1; background: var(--mia-input-bg); border: 1px solid var(--mia-input-border); color: var(--mia-input-text);
        border-radius: 13px; padding: 12px 14px; font-size: 14px; font-family: inherit; outline: none;
        transition: border-color .2s;
      }
      #magamaIA-input::placeholder { color: var(--mia-placeholder); }
      #magamaIA-input:focus { border-color: rgba(216,168,92,.7); }
      #magamaIA-send {
        width: 46px; height: 46px; flex-shrink: 0; border: none; cursor: pointer; border-radius: 13px;
        background: linear-gradient(135deg, #dcae66, #c2913f); color: #241b0f;
        display: flex; align-items: center; justify-content: center; transition: transform .12s, filter .2s;
      }
      #magamaIA-send:hover { filter: brightness(1.08); }
      #magamaIA-send:active { transform: scale(.92); }
      #magamaIA-send svg { width: 20px; height: 20px; }

      @media (max-width: 480px) {
        #magamaIA-panel { right: 12px; left: 12px; width: auto; bottom: 90px; height: calc(100vh - 110px); }
        #magamaIA-fab { bottom: 18px; right: 18px; }
      }
    `;
    document.head.appendChild(style);

    const sparkle = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 5.4 5.4 1.7-5.4 1.7L12 16.2l-1.7-5.4L4.9 9.1l5.4-1.7z"/><path d="M18.5 14l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9z"/></svg>';

    const cont = document.createElement('div');
    cont.id = 'magamaIA-root';
    cont.innerHTML = `
      <button id="magamaIA-fab" title="Asistente IA MAGAMA">${sparkle}<span class="magamaIA-pip"></span></button>
      <div id="magamaIA-panel" class="magamaIA-hidden">
        <div id="magamaIA-header">
          <div id="magamaIA-logo">M</div>
          <div id="magamaIA-titulos">
            <div id="magamaIA-marca">MAGAMA SHOP · IA</div>
            <div id="magamaIA-estado"><span class="magamaIA-dot"></span> Asistente en línea</div>
          </div>
          <button class="magamaIA-hbtn" id="magamaIA-tema" title="Cambiar tema">☀️</button>
          <button class="magamaIA-hbtn" id="magamaIA-limpiar" title="Limpiar conversación">&#8635;</button>
          <button class="magamaIA-hbtn" id="magamaIA-min" title="Cerrar">&times;</button>
        </div>
        <div id="magamaIA-mensajes"></div>
        <div id="magamaIA-input-row">
          <input id="magamaIA-input" type="text" placeholder="Pregúntame sobre tu negocio..." autocomplete="off" />
          <button id="magamaIA-send" title="Enviar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(cont);
  },

  _eventos() {
    document.getElementById('magamaIA-fab').onclick = () => this.toggle();
    document.getElementById('magamaIA-min').onclick = () => this.toggle();
    document.getElementById('magamaIA-limpiar').onclick = () => this.limpiar();
    document.getElementById('magamaIA-tema').onclick = () => this.cambiarTema();
    document.getElementById('magamaIA-send').onclick = () => this.enviar();
    document.getElementById('magamaIA-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.enviar(); }
    });
  },

  // ── Tema claro / oscuro ──
  _aplicarTema(tema) {
    const panel = document.getElementById('magamaIA-panel');
    const btn = document.getElementById('magamaIA-tema');
    if (tema === 'claro') {
      panel.classList.add('magamaIA-light');
      btn.textContent = '🌙'; btn.title = 'Cambiar a modo oscuro';
    } else {
      panel.classList.remove('magamaIA-light');
      btn.textContent = '☀️'; btn.title = 'Cambiar a modo claro';
    }
  },

  cambiarTema() {
    const panel = document.getElementById('magamaIA-panel');
    const nuevo = panel.classList.contains('magamaIA-light') ? 'oscuro' : 'claro';
    try { localStorage.setItem('magamaIA_tema', nuevo); } catch (e) {}
    this._aplicarTema(nuevo);
  },

  toggle() {
    this.abierto = !this.abierto;
    const panel = document.getElementById('magamaIA-panel');
    panel.classList.toggle('magamaIA-hidden', !this.abierto);
    if (this.abierto) {
      if (this.historial.length === 0) this._mostrarBienvenida();
      panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
      setTimeout(() => document.getElementById('magamaIA-input').focus(), 80);
    }
  },

  limpiar() {
    this.historial = [];
    this._mostrarBienvenida();
  },

  _mostrarBienvenida() {
    const cont = document.getElementById('magamaIA-mensajes');
    const chips = this.SUGERENCIAS.map((s, i) =>
      `<button class="magamaIA-chip" data-q="${i}"><span class="ic">${s.icon}</span> ${s.texto}</button>`
    ).join('');
    cont.innerHTML = `
      <div id="magamaIA-bienvenida">
        <div class="magamaIA-welcome-card">
          <h4>¡Hola! 👋 Soy tu asistente</h4>
          <p>Puedo ayudarte con tus ventas, stock, clientes y recomendaciones de tu tienda MAGAMA. Pregúntame lo que necesites o elige una opción:</p>
        </div>
        <div class="magamaIA-chips">${chips}</div>
      </div>
    `;
    cont.querySelectorAll('.magamaIA-chip').forEach(btn => {
      btn.onclick = () => this.enviar(this.SUGERENCIAS[parseInt(btn.dataset.q)].texto);
    });
  },

  _getContexto() {
    const pad = n => String(n).padStart(2, '0');
    const fechaStr = dt => dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
    const hoy = fechaStr(new Date());
    const mesActual = hoy.slice(0, 7);
    const h7 = new Date(); h7.setDate(h7.getDate() - 7);
    const limite7 = fechaStr(h7);

    const D = (typeof DB !== 'undefined') ? DB : {};
    const ventas    = (D.ventas || []).filter(v => v.estado !== 'ANULADO');
    const productos = D.productos || [];
    const clientes  = D.clientes  || [];
    const emp       = D.empresa   || {};
    const cajas     = D.cajas     || [];

    const soles = n => 'S/ ' + (parseFloat(n) || 0).toFixed(2);
    const sum = arr => arr.reduce((s, v) => s + (parseFloat(v.total) || 0), 0);

    const vHoy = ventas.filter(v => v.fecha === hoy);
    const vSem = ventas.filter(v => v.fecha >= limite7);
    const vMes = ventas.filter(v => (v.fecha || '').slice(0, 7) === mesActual);

    const porPago = {};
    ventas.forEach(v => { const m = v.metodo_pago || 'Otro'; porPago[m] = (porPago[m] || 0) + (parseFloat(v.total) || 0); });
    const pagoStr = Object.keys(porPago).map(k => `${k}: ${soles(porPago[k])}`).join(', ') || 'sin datos';

    const porSerie = {};
    ventas.forEach(v => { const s = v.serie || '¿?'; porSerie[s] = (porSerie[s] || 0) + 1; });
    const serieStr = Object.keys(porSerie).map(k => `${k}: ${porSerie[k]}`).join(', ') || 'sin datos';

    const agotados = productos.filter(p => (parseInt(p.stock) || 0) === 0);
    const bajos    = productos.filter(p => p.stock > 0 && p.stock <= (p.stock_minimo || 10));
    const valorInv = productos.reduce((s, p) => s + (parseFloat(p.precio_venta) || 0) * (parseInt(p.stock) || 0), 0);

    const porCat = {};
    productos.forEach(p => { const c = p.categoria || 'General'; porCat[c] = (porCat[c] || 0) + 1; });
    const catStr = Object.keys(porCat).map(c => `${c} (${porCat[c]})`).join(', ') || 'sin datos';

    const porTipoCli = {};
    clientes.forEach(c => { const t = c.tipo_cliente || 'cliente'; porTipoCli[t] = (porTipoCli[t] || 0) + 1; });
    const tipoCliStr = Object.keys(porTipoCli).map(t => `${t}: ${porTipoCli[t]}`).join(', ');

    const catalogo = productos
      .map(p => `${p.nombre} | ${p.categoria || 'General'} | ${soles(p.precio_venta)} | stock ${p.stock}`)
      .join('\n');

    const cajaAbierta = cajas.find(c => c.estado === 'ABIERTA');
    const cajaStr = cajaAbierta ? `ABIERTA (monto inicial ${soles(cajaAbierta.monto_inicial)})` : 'Sin caja abierta';

    return `Eres el asistente inteligente de MAGAMA SHOP, integrado en JUMILA ERP, una tienda de ropa en Huánuco, Perú. Responde SIEMPRE en español, breve y claro. Usa **negritas** para cifras y guiones para listas. Si algo no está en los datos, dilo con honestidad y NO inventes cifras.

=== EMPRESA ===
${emp.nombre || ''} | RUC ${emp.ruc || ''} | ${emp.sucursal || ''}
Fecha de hoy: ${hoy}

=== VENTAS (sin anuladas) ===
- Hoy: ${vHoy.length} comprobantes, ${soles(sum(vHoy))}
- Últimos 7 días: ${vSem.length} comprobantes, ${soles(sum(vSem))}
- Mes actual: ${vMes.length} comprobantes, ${soles(sum(vMes))}
- Histórico: ${ventas.length} comprobantes, ${soles(sum(ventas))}
- Por método de pago: ${pagoStr}
- Por serie (comprobantes): ${serieStr}

=== INVENTARIO ===
- Productos registrados: ${productos.length}
- Valor del inventario (a precio venta): ${soles(valorInv)}
- Agotados: ${agotados.length} | Stock bajo: ${bajos.length}
- Categorías: ${catStr}

=== CLIENTES ===
- Total: ${clientes.length} (${tipoCliStr})

=== ESTADO DE CAJA ===
${cajaStr}

=== CATÁLOGO COMPLETO (nombre | categoría | precio | stock) ===
${catalogo}`;
  },

  async enviar(textoForzado) {
    const input = document.getElementById('magamaIA-input');
    const texto = (typeof textoForzado === 'string' ? textoForzado : (input.value || '')).trim();
    if (!texto || this.cargando) return;

    const bienv = document.getElementById('magamaIA-bienvenida');
    if (bienv) bienv.remove();

    input.value = '';
    this._pintarMensaje('user', texto);
    this.historial.push({ rol: 'user', texto });

    this.cargando = true;
    const idCarga = this._pintarTyping();

    try {
      const prompt = this._getContexto() + '\n\nPREGUNTA DEL USUARIO: ' + texto;
      const res = await fetch(this.PROXY_URL, {
        method: 'POST',
        body: JSON.stringify({ accion: 'gemini', prompt: prompt }),
        redirect: 'follow'
      });
      const data = await res.json();
      this._quitar(idCarga);

      if (data.ok && data.respuesta) {
        this._pintarMensaje('bot', data.respuesta);
        this.historial.push({ rol: 'bot', texto: data.respuesta });
      } else {
        this._pintarMensaje('bot', '⚠️ No pude obtener respuesta en este momento. ' + (data.error || ''));
      }
    } catch (e) {
      this._quitar(idCarga);
      this._pintarMensaje('bot', '⚠️ Error de conexión. Revisa tu internet e inténtalo de nuevo.');
    } finally {
      this.cargando = false;
    }
  },

  _pintarMensaje(tipo, texto) {
    const cont = document.getElementById('magamaIA-mensajes');
    const fila = document.createElement('div');
    fila.className = 'magamaIA-fila ' + tipo;
    const av = tipo === 'bot' ? '<div class="magamaIA-av">✦</div>' : '<div class="magamaIA-av">🧑</div>';
    const cuerpo = tipo === 'bot' ? this._formatear(texto) : this._escapar(texto);
    fila.innerHTML = `${av}<div><div class="magamaIA-burbuja">${cuerpo}</div><div class="magamaIA-hora">${this._hora()}</div></div>`;
    cont.appendChild(fila);
    cont.scrollTop = cont.scrollHeight;
  },

  _pintarTyping() {
    const cont = document.getElementById('magamaIA-mensajes');
    const id = 'magamaIA-t-' + Date.now();
    const fila = document.createElement('div');
    fila.id = id; fila.className = 'magamaIA-fila bot';
    fila.innerHTML = `<div class="magamaIA-av">✦</div><div class="magamaIA-burbuja"><div class="magamaIA-typing"><span></span><span></span><span></span></div></div>`;
    cont.appendChild(fila);
    cont.scrollTop = cont.scrollHeight;
    return id;
  },

  _quitar(id) { const el = document.getElementById(id); if (el) el.remove(); },

  _hora() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  _escapar(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },

  _formatear(t) {
    let s = this._escapar(t);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|\n)\s*[\*\-]\s+(.+)/g, '$1• $2');
    s = s.replace(/\n/g, '<br>');
    return s;
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GeminiAI.init());
} else {
  GeminiAI.init();
}
