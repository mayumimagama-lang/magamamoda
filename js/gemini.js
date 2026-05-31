// ============================================================
// GEMINI AI — Asistente Inteligente para JUMILA ERP
// ============================================================

const GeminiAI = {
  API_KEY: 'AIzaSyBn2QmYmNVwqYpSZNzZwayool9i9Tda0IU',
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  historial: [],
  abierto: false,

  // ─── CONTEXTO DEL ERP ───
  _getContexto() {
    var hoy = new Date().toISOString().split('T')[0];
    var totalVentas = (DB.ventas || []).reduce(function(s, v) { return s + v.total; }, 0);
    var ventasHoy = (DB.ventas || []).filter(function(v) { return v.fecha === hoy && v.estado !== 'ANULADO'; });
    var totalHoy = ventasHoy.reduce(function(s, v) { return s + v.total; }, 0);
    var productosAgotados = (DB.productos || []).filter(function(p) { return p.stock === 0; }).length;
    var productosBajos = (DB.productos || []).filter(function(p) { return p.stock > 0 && p.stock <= 10; }).length;
    var topProductos = (DB.productos || []).slice(0, 5).map(function(p) {
      return p.nombre + ' (S/' + p.precio_venta + ', stock: ' + p.stock + ')';
    }).join(', ');

    return 'Eres un asistente inteligente integrado en JUMILA ERP, el sistema de gestión empresarial de MAGAMA Fashion Store, una tienda de ropa en Huánuco, Perú.\n\n' +
      'DATOS ACTUALES DEL NEGOCIO:\n' +
      '- Empresa: ' + (DB.empresa ? DB.empresa.nombre : 'MAGAMA') + '\n' +
      '- RUC: ' + (DB.empresa ? DB.empresa.ruc : '') + '\n' +
      '- Sucursal: ' + (DB.empresa ? DB.empresa.sucursal : '') + '\n' +
      '- Fecha de hoy: ' + hoy + '\n' +
      '- Ventas de hoy: ' + ventasHoy.length + ' comprobantes por S/ ' + totalHoy.toFixed(2) + '\n' +
      '- Total histórico de ventas: S/ ' + totalVentas.toFixed(2) + '\n' +
      '- Total de productos registrados: ' + (DB.productos || []).length + '\n' +
      '- Productos agotados: ' + productosAgotados + '\n' +
      '- Productos con stock bajo (≤10): ' + productosBajos + '\n' +
      '- Total de clientes: ' + (DB.clientes || []).length + '\n' +
      '- Total de comprobantes: ' + (DB.ventas || []).length + '\n' +
      '- Algunos productos: ' + topProductos + '\n\n' +
      'MÓDULOS DEL ERP: POS (Punto de Venta), Ventas, Productos, Clientes, Inventario, Caja, Reportes, Cotizaciones, Kardex, Agenda, Herramientas, Finanzas.\n\n' +
      'Responde siempre en español, de forma clara y concisa. Si te preguntan sobre el negocio, usa los datos reales proporcionados arriba. Si te preguntan cómo hacer algo en el ERP, explica los pasos. Sé amable y profesional.';
  },

  // ─── ENVIAR MENSAJE ───
  async enviar() {
    var input = document.getElementById('gemini-input');
    var mensaje = input ? input.value.trim() : '';
    if (!mensaje) return;

    input.value = '';
    input.disabled = true;
    document.getElementById('gemini-send-btn').disabled = true;

    this._agregarMensaje('usuario', mensaje);
    this._mostrarTyping();

    try {
      var mensajes = [{
        role: 'user',
        parts: [{ text: this._getContexto() + '\n\nUsuario: ' + mensaje }]
      }];

      if (this.historial.length > 0) {
        mensajes = this.historial.concat([{
          role: 'user',
          parts: [{ text: mensaje }]
        }]);
        mensajes[0].parts[0].text = this._getContexto() + '\n\n' + mensajes[0].parts[0].text;
      }

      var response = await fetch(this.API_URL + '?key=' + this.API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: mensajes,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      });

      var data = await response.json();

      if (data.candidates && data.candidates[0]) {
        var respuesta = data.candidates[0].content.parts[0].text;
        this._quitarTyping();
        this._agregarMensaje('gemini', respuesta);

        // Guardar en historial
        this.historial.push({ role: 'user', parts: [{ text: mensaje }] });
        this.historial.push({ role: 'model', parts: [{ text: respuesta }] });

        // Limitar historial a últimas 10 conversaciones
        if (this.historial.length > 20) {
          this.historial = this.historial.slice(-20);
        }
      } else {
        this._quitarTyping();
        this._agregarMensaje('gemini', 'Lo siento, no pude procesar tu consulta. Intenta de nuevo.');
      }
    } catch (e) {
      this._quitarTyping();
      this._agregarMensaje('gemini', 'Error de conexión. Verifica tu internet e intenta de nuevo.');
      console.error('Gemini error:', e);
    }

    input.disabled = false;
    document.getElementById('gemini-send-btn').disabled = false;
    input.focus();
  },

  // ─── UI HELPERS ───
  _agregarMensaje(tipo, texto) {
    var container = document.getElementById('gemini-messages');
    if (!container) return;

    var div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;align-items:flex-start;' +
      (tipo === 'usuario' ? 'flex-direction:row-reverse;' : '');

    var avatar = document.createElement('div');
    avatar.style.cssText = 'width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0;' +
      (tipo === 'usuario'
        ? 'background:linear-gradient(135deg,#0096ff,#d4af37);color:white;'
        : 'background:linear-gradient(135deg,#4285f4,#34a853);color:white;');
    avatar.textContent = tipo === 'usuario' ? 'TÚ' : 'AI';

    var burbuja = document.createElement('div');
    burbuja.style.cssText = 'max-width:80%;padding:10px 14px;border-radius:' +
      (tipo === 'usuario' ? '14px 4px 14px 14px' : '4px 14px 14px 14px') +
      ';font-size:13px;line-height:1.5;' +
      (tipo === 'usuario'
        ? 'background:linear-gradient(135deg,#0096ff,#0077cc);color:white;'
        : 'background:#1e2a3d;color:#e2e8f0;border:1px solid #2a3a52;');

    // Formatear texto con markdown básico
    burbuja.innerHTML = texto
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#0a0a1a;padding:2px 6px;border-radius:4px;font-size:12px;">$1</code>')
      .replace(/\n/g, '<br>');

    div.appendChild(avatar);
    div.appendChild(burbuja);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  _mostrarTyping() {
    var container = document.getElementById('gemini-messages');
    if (!container) return;
    var div = document.createElement('div');
    div.id = 'gemini-typing';
    div.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;align-items:center;';
    div.innerHTML = '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#4285f4,#34a853);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:white;flex-shrink:0;">AI</div>' +
      '<div style="background:#1e2a3d;border:1px solid #2a3a52;padding:10px 16px;border-radius:4px 14px 14px 14px;">' +
      '<div style="display:flex;gap:4px;align-items:center;">' +
      '<div style="width:6px;height:6px;border-radius:50%;background:#4285f4;animation:gemini-bounce 0.8s infinite;"></div>' +
      '<div style="width:6px;height:6px;border-radius:50%;background:#4285f4;animation:gemini-bounce 0.8s infinite 0.2s;"></div>' +
      '<div style="width:6px;height:6px;border-radius:50%;background:#4285f4;animation:gemini-bounce 0.8s infinite 0.4s;"></div>' +
      '</div></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  _quitarTyping() {
    var el = document.getElementById('gemini-typing');
    if (el) el.remove();
  },

  // ─── TOGGLE CHAT ───
  toggle() {
    this.abierto = !this.abierto;
    var panel = document.getElementById('gemini-panel');
    var btn = document.getElementById('gemini-fab');
    if (panel) {
      panel.style.display = this.abierto ? 'flex' : 'none';
      if (this.abierto) {
        setTimeout(function() {
          var inp = document.getElementById('gemini-input');
          if (inp) inp.focus();
        }, 100);
      }
    }
    if (btn) {
      btn.innerHTML = this.abierto
        ? '<i class="fas fa-times" style="font-size:20px;"></i>'
        : '<i class="fas fa-robot" style="font-size:20px;"></i><span style="font-size:10px;font-weight:800;letter-spacing:1px;">AI</span>';
    }
  },

  limpiar() {
    this.historial = [];
    var container = document.getElementById('gemini-messages');
    if (container) {
      container.innerHTML = '';
      this._mensajeBienvenida();
    }
  },

  _mensajeBienvenida() {
    var hoy = new Date().toISOString().split('T')[0];
    var ventasHoy = (DB.ventas || []).filter(function(v) { return v.fecha === hoy && v.estado !== 'ANULADO'; });
    var totalHoy = ventasHoy.reduce(function(s, v) { return s + v.total; }, 0);
    this._agregarMensaje('gemini',
      '¡Hola! Soy tu asistente de IA para **JUMILA ERP** 🤖\n\n' +
      'Hoy llevas **' + ventasHoy.length + ' ventas** por **S/ ' + totalHoy.toFixed(2) + '**\n\n' +
      'Puedo ayudarte con:\n' +
      '• Consultas sobre ventas y productos\n' +
      '• Análisis de tu negocio\n' +
      '• Cómo usar el sistema\n' +
      '• Cualquier pregunta que tengas\n\n' +
      '¿En qué te puedo ayudar?'
    );
  },

  // ─── INICIALIZAR ───
  init() {
    // Agregar estilos
    var style = document.createElement('style');
    style.textContent = `
      @keyframes gemini-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      @keyframes gemini-fadein {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      #gemini-panel { animation: gemini-fadein 0.2s ease; }
      #gemini-input:focus { outline: none; border-color: #4285f4 !important; }
      #gemini-messages::-webkit-scrollbar { width: 4px; }
      #gemini-messages::-webkit-scrollbar-thumb { background: #2a3a52; border-radius: 2px; }
    `;
    document.head.appendChild(style);

    // Crear botón flotante
    var fab = document.createElement('button');
    fab.id = 'gemini-fab';
    fab.onclick = function() { GeminiAI.toggle(); };
    fab.style.cssText = 'position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;' +
  'z-index:99999;' +
      'background:linear-gradient(135deg,#4285f4,#34a853);color:white;border:none;cursor:pointer;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;' +
      'box-shadow:0 4px 20px rgba(66,133,244,0.5);z-index:9999;transition:transform 0.2s,box-shadow 0.2s;';
    fab.innerHTML = '<i class="fas fa-robot" style="font-size:20px;"></i><span style="font-size:10px;font-weight:800;letter-spacing:1px;">AI</span>';
    fab.onmouseover = function() { this.style.transform = 'scale(1.1)'; this.style.boxShadow = '0 6px 28px rgba(66,133,244,0.7)'; };
    fab.onmouseout = function() { this.style.transform = 'scale(1)'; this.style.boxShadow = '0 4px 20px rgba(66,133,244,0.5)'; };
    document.body.appendChild(fab);

    // Crear panel de chat
    var panel = document.createElement('div');
    panel.id = 'gemini-panel';
    panel.style.cssText = 'position:fixed;bottom:96px;right:24px;width:380px;height:520px;' +
      'background:#0a0a1a;border:1px solid #2a3a52;border-radius:16px;' +
      'display:none;flex-direction:column;z-index:9998;' +
      'box-shadow:0 8px 40px rgba(0,0,0,0.6);overflow:hidden;';

    panel.innerHTML =
      // Header
      '<div style="padding:14px 16px;background:linear-gradient(135deg,#0d1a2e,#1a2a4a);border-bottom:1px solid #2a3a52;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#4285f4,#34a853);display:flex;align-items:center;justify-content:center;">' +
            '<i class="fas fa-robot" style="color:white;font-size:16px;"></i>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:800;color:white;">Asistente JUMILA AI</div>' +
            '<div style="font-size:10px;color:#4285f4;display:flex;align-items:center;gap:4px;">' +
              '<div style="width:6px;height:6px;border-radius:50%;background:#34a853;box-shadow:0 0 6px #34a853;"></div>' +
              'Powered by Gemini' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;">' +
          '<button onclick="GeminiAI.limpiar()" title="Limpiar chat" style="width:28px;height:28px;border-radius:6px;background:#1e2a3d;border:1px solid #2a3a52;color:#8fa5bf;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">' +
            '<i class="fas fa-trash-alt"></i>' +
          '</button>' +
          '<button onclick="GeminiAI.toggle()" title="Cerrar" style="width:28px;height:28px;border-radius:6px;background:#1e2a3d;border:1px solid #2a3a52;color:#8fa5bf;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;">' +
            '<i class="fas fa-times"></i>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // Mensajes
      '<div id="gemini-messages" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;"></div>' +

      // Sugerencias rápidas
      '<div style="padding:6px 12px;display:flex;gap:6px;overflow-x:auto;flex-shrink:0;border-top:1px solid #1e2a3d;">' +
        ['¿Cuánto vendí hoy?', '¿Qué productos están agotados?', '¿Cómo crear una venta?', '¿Cuántos clientes tengo?'].map(function(s) {
          return '<button onclick="document.getElementById(\'gemini-input\').value=\'' + s + '\';GeminiAI.enviar();" ' +
            'style="padding:4px 10px;background:#1e2a3d;border:1px solid #2a3a52;border-radius:12px;color:#8fa5bf;font-size:11px;cursor:pointer;white-space:nowrap;flex-shrink:0;">' +
            s + '</button>';
        }).join('') +
      '</div>' +

      // Input
      '<div style="padding:12px;border-top:1px solid #2a3a52;display:flex;gap:8px;flex-shrink:0;">' +
        '<input id="gemini-input" type="text" placeholder="Escribe tu consulta..." ' +
          'onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();GeminiAI.enviar();}" ' +
          'style="flex:1;padding:10px 14px;background:#1e2a3d;border:2px solid #2a3a52;border-radius:10px;color:#e2e8f0;font-size:13px;font-family:inherit;"/>' +
        '<button id="gemini-send-btn" onclick="GeminiAI.enviar()" ' +
          'style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#4285f4,#34a853);color:white;border:none;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">' +
          '<i class="fas fa-paper-plane"></i>' +
        '</button>' +
      '</div>';

    document.body.appendChild(panel);

    // Mensaje de bienvenida
    this._mensajeBienvenida();
  }
};

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Esperar a que el ERP cargue completamente
  setTimeout(function() { GeminiAI.init(); }, 3000);
});