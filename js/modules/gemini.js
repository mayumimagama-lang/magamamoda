// ============================================================
// GEMINI AI — Asistente Inteligente para JUMILA ERP
// ------------------------------------------------------------
// La clave de Gemini vive SEGURA dentro del Apps Script
// (lado servidor). Este archivo NO contiene ninguna clave.
// Solo llama al proxy mediante su URL pública.
// ============================================================

const GeminiAI = {

  // URL del proxy (Apps Script, versión 15 con Gemini).
  // Esto NO es secreto: es solo la dirección del proxy.
  // ⚠️ Verifica que sea EXACTAMENTE la que copiaste con el botón "Copy".
  PROXY_URL: 'https://script.google.com/macros/s/AKfycbzopc9-UZI3fNvav1c1_Tar52kRy_gom7grN5-q4MdlTOQ6SSvD_BH2CSmTmgW1j_EfXg/exec',

  historial: [],
  abierto: false,
  cargando: false,

  // ── Inicializar: inyecta el botón flotante y el panel ──
  init() {
    if (document.getElementById('geminiAI-fab')) return; // evitar duplicados
    this._inyectarUI();
    this._eventos();
  },

  _inyectarUI() {
    const style = document.createElement('style');
    style.textContent = `
      #geminiAI-root * { box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }
      #geminiAI-fab {
        position: fixed; bottom: 24px; right: 24px;
        width: 60px; height: 60px; border-radius: 50%;
        border: none; cursor: pointer; z-index: 99999;
        background: linear-gradient(135deg, #6d5efc, #4a8cff);
        color: #fff; font-size: 26px; line-height: 1;
        box-shadow: 0 6px 20px rgba(77,99,255,.45);
        display: flex; align-items: center; justify-content: center;
        transition: transform .15s ease;
      }
      #geminiAI-fab:hover { transform: scale(1.08); }
      #geminiAI-panel {
        position: fixed; bottom: 96px; right: 24px;
        width: 360px; max-width: calc(100vw - 32px);
        height: 520px; max-height: calc(100vh - 130px);
        background: #fff; border-radius: 16px; z-index: 99999;
        box-shadow: 0 12px 40px rgba(0,0,0,.25);
        display: flex; flex-direction: column; overflow: hidden;
      }
      #geminiAI-panel.geminiAI-hidden { display: none; }
      #geminiAI-header {
        background: linear-gradient(135deg, #6d5efc, #4a8cff);
        color: #fff; padding: 14px 16px; font-weight: 600; font-size: 15px;
        display: flex; align-items: center; justify-content: space-between;
      }
      #geminiAI-header .geminiAI-titulo { display: flex; align-items: center; gap: 8px; }
      #geminiAI-cerrar {
        background: rgba(255,255,255,.2); border: none; color: #fff;
        width: 26px; height: 26px; border-radius: 50%; cursor: pointer; font-size: 16px;
      }
      #geminiAI-mensajes {
        flex: 1; overflow-y: auto; padding: 14px;
        background: #f5f6fa; display: flex; flex-direction: column; gap: 10px;
      }
      .geminiAI-msg {
        max-width: 85%; padding: 10px 13px; border-radius: 14px;
        font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word;
      }
      .geminiAI-user { align-self: flex-end; background: #4a8cff; color: #fff; border-bottom-right-radius: 4px; }
      .geminiAI-bot  { align-self: flex-start; background: #fff; color: #222; border: 1px solid #e3e6ee; border-bottom-left-radius: 4px; }
      .geminiAI-cargando { opacity: .6; font-style: italic; }
      #geminiAI-input-row {
        display: flex; gap: 8px; padding: 12px; background: #fff; border-top: 1px solid #eee;
      }
      #geminiAI-input {
        flex: 1; border: 1px solid #d5d9e3; border-radius: 10px;
        padding: 10px 12px; font-size: 14px; outline: none;
      }
      #geminiAI-input:focus { border-color: #6d5efc; }
      #geminiAI-send {
        border: none; cursor: pointer; border-radius: 10px; padding: 0 16px;
        background: linear-gradient(135deg, #6d5efc, #4a8cff); color: #fff; font-weight: 600; font-size: 14px;
      }
    `;
    document.head.appendChild(style);

    const cont = document.createElement('div');
    cont.id = 'geminiAI-root';
    cont.innerHTML = `
      <button id="geminiAI-fab" title="Asistente IA">✨</button>
      <div id="geminiAI-panel" class="geminiAI-hidden">
        <div id="geminiAI-header">
          <span class="geminiAI-titulo">✨ Asistente IA — JUMILA</span>
          <button id="geminiAI-cerrar" title="Cerrar">×</button>
        </div>
        <div id="geminiAI-mensajes"></div>
        <div id="geminiAI-input-row">
          <input id="geminiAI-input" type="text" placeholder="Escribe tu pregunta..." autocomplete="off" />
          <button id="geminiAI-send">Enviar</button>
        </div>
      </div>
    `;
    document.body.appendChild(cont);
  },

  _eventos() {
    document.getElementById('geminiAI-fab').onclick = () => this.toggle();
    document.getElementById('geminiAI-cerrar').onclick = () => this.toggle();
    document.getElementById('geminiAI-send').onclick = () => this.enviar();
    document.getElementById('geminiAI-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.enviar(); }
    });
  },

  toggle() {
    this.abierto = !this.abierto;
    const panel = document.getElementById('geminiAI-panel');
    panel.classList.toggle('geminiAI-hidden', !this.abierto);
    if (this.abierto) {
      if (this.historial.length === 0) {
        this._pintarMensaje('bot', '¡Hola! Soy tu asistente del ERP JUMILA. Pregúntame sobre tus ventas, stock, clientes o lo que necesites.');
      }
      document.getElementById('geminiAI-input').focus();
    }
  },

  // ── Construir el contexto del negocio (datos en vivo del ERP) ──
  _getContexto() {
    const hoy       = new Date().toISOString().split('T')[0];
    const ventas    = (typeof DB !== 'undefined' && DB.ventas)    ? DB.ventas    : [];
    const productos = (typeof DB !== 'undefined' && DB.productos) ? DB.productos : [];
    const clientes  = (typeof DB !== 'undefined' && DB.clientes)  ? DB.clientes  : [];
    const emp       = (typeof DB !== 'undefined' && DB.empresa)   ? DB.empresa   : {};

    const totalVentas = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0);
    const ventasHoy   = ventas.filter(v => v.fecha === hoy && v.estado !== 'ANULADO');
    const totalHoy    = ventasHoy.reduce((s, v) => s + (parseFloat(v.total) || 0), 0);
    const agotados    = productos.filter(p => (parseInt(p.stock) || 0) === 0).length;
    const bajos       = productos.filter(p => p.stock > 0 && p.stock <= (p.stock_minimo || 10)).length;
    const topProductos = productos.slice(0, 10)
      .map(p => `${p.nombre} (S/ ${p.precio_venta}, stock: ${p.stock})`).join('; ');

    return `Eres un asistente inteligente integrado en JUMILA ERP, el sistema de gestión de ${emp.nombre || 'MAGAMA'}, una tienda de ropa en Huánuco, Perú. Responde SIEMPRE en español, de forma breve, clara y útil.

DATOS ACTUALES DEL NEGOCIO:
- Empresa: ${emp.nombre || ''}
- RUC: ${emp.ruc || ''}
- Sucursal: ${emp.sucursal || ''}
- Fecha de hoy: ${hoy}
- Ventas de hoy: ${ventasHoy.length} comprobantes por S/ ${totalHoy.toFixed(2)}
- Total histórico de ventas: S/ ${totalVentas.toFixed(2)}
- Productos registrados: ${productos.length}
- Productos agotados (stock 0): ${agotados}
- Productos con stock bajo: ${bajos}
- Total de clientes: ${clientes.length}
- Algunos productos: ${topProductos}`;
  },

  // ── Enviar mensaje al proxy ──
  async enviar() {
    const input = document.getElementById('geminiAI-input');
    const texto = (input.value || '').trim();
    if (!texto || this.cargando) return;

    input.value = '';
    this._pintarMensaje('user', texto);
    this.historial.push({ rol: 'user', texto: texto });

    this.cargando = true;
    const idCarga = this._pintarCargando();

    try {
      const prompt = this._getContexto() + '\n\nPREGUNTA DEL USUARIO: ' + texto;

      // POST simple (text/plain) para evitar problemas de CORS con Apps Script
      const res = await fetch(this.PROXY_URL, {
        method: 'POST',
        body: JSON.stringify({ accion: 'gemini', prompt: prompt }),
        redirect: 'follow'
      });
      const data = await res.json();

      this._quitarCargando(idCarga);

      if (data.ok && data.respuesta) {
        this._pintarMensaje('bot', data.respuesta);
        this.historial.push({ rol: 'bot', texto: data.respuesta });
      } else {
        this._pintarMensaje('bot', '⚠️ No pude obtener respuesta. ' + (data.error || ''));
      }
    } catch (e) {
      this._quitarCargando(idCarga);
      this._pintarMensaje('bot', '⚠️ Error de conexión: ' + (e.message || e));
    } finally {
      this.cargando = false;
    }
  },

  _pintarMensaje(tipo, texto) {
    const cont = document.getElementById('geminiAI-mensajes');
    const div = document.createElement('div');
    div.className = 'geminiAI-msg geminiAI-' + tipo;
    div.textContent = texto;
    cont.appendChild(div);
    cont.scrollTop = cont.scrollHeight;
  },

  _pintarCargando() {
    const cont = document.getElementById('geminiAI-mensajes');
    const id = 'geminiAI-carga-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'geminiAI-msg geminiAI-bot geminiAI-cargando';
    div.textContent = 'Escribiendo…';
    cont.appendChild(div);
    cont.scrollTop = cont.scrollHeight;
    return id;
  },

  _quitarCargando(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};

// ── Auto-iniciar cuando la página esté lista ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => GeminiAI.init());
} else {
  GeminiAI.init();
}
