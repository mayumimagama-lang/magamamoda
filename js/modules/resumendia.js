// ============================================================
// MÓDULO: RESUMEN DEL DÍA — Diseño premium MAGAMA
// ============================================================

const ResumenDiaModule = {

    _fechaActual: null,

    cambiarFecha(fecha) {
    this._fechaActual = fecha;
    App.renderPage();
    setTimeout(function() {
      var input = document.getElementById('resumenFecha');
      if (input) input.value = ResumenDiaModule._fechaActual;
    }, 50);
  },

  _navDia(delta) {
    var base = this._fechaActual || this._fechaLocal(new Date());
    var d = new Date(base + 'T12:00:00');
    d.setDate(d.getDate() + delta);
    var nueva = this._fechaLocal(d);
    var hoy = this._fechaLocal(new Date());
    if (nueva > hoy) nueva = hoy;
    this.cambiarFecha(nueva);
  },

  _fechaLocal(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  },

  _parsearMetodo(metodo, total) {
    var r = { EFECTIVO:0, YAPE:0, TARJETA:0, COMBINADO:0 };
    if (!metodo) { r.EFECTIVO = total; return r; }
    var m = metodo.toUpperCase();
    if (m.includes('+')) { r.COMBINADO = total; return r; }
    if (m.includes('YAPE') || m.includes('PLIN')) { r.YAPE = total; return r; }
    if (m.includes('TARJETA') || m.includes('VISA')) { r.TARJETA = total; return r; }
    r.EFECTIVO = total;
    return r;
  },

  _horaLabel(hora) {
    if (!hora) return '--';
    var h = parseInt(hora.substring(0,2));
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return h12 + ':00 ' + ampm;
  },

  render() {
    App.setTabs2('Resumen del Día', '');
    var hoy = this._fechaLocal(new Date());
    var fechaVer = this._fechaActual || hoy;
    var ventasHoy = DB.ventas.filter(function(v){ return v.fecha === fechaVer; });

    var totalHoy   = ventasHoy.reduce(function(s,v){ return s+v.total; }, 0);
    var cantHoy    = ventasHoy.length;
    var ticketProm = cantHoy > 0 ? totalHoy / cantHoy : 0;

    var desglose   = { EFECTIVO:0, YAPE:0, TARJETA:0, COMBINADO:0 };
    var cantMetodo = { EFECTIVO:0, YAPE:0, TARJETA:0, COMBINADO:0 };
    ventasHoy.forEach(function(v) {
      var res = ResumenDiaModule._parsearMetodo(v.metodo_pago, v.total);
      Object.keys(res).forEach(function(k) {
        if (res[k] > 0) { desglose[k] += res[k]; cantMetodo[k]++; }
      });
    });

    // Ventas por hora
    var porHora = {};
    for (var h = 0; h < 24; h++) porHora[h] = 0;
    ventasHoy.forEach(function(v) {
      var hr = parseInt((v.hora||'00:00').substring(0,2));
      porHora[hr] += v.total;
    });
    var horaPicoNum = 0;
    for (var hk = 0; hk < 24; hk++) {
      if (porHora[hk] > porHora[horaPicoNum]) horaPicoNum = hk;
    }
    var horaPicoLabel = porHora[horaPicoNum] > 0 ? ResumenDiaModule._horaLabel(String(horaPicoNum).padStart(2,'0') + ':00') : '--';

    // Por tipo comprobante
    var porTipo = {};
    ventasHoy.forEach(function(v) {
      var t = v.tipo || 'N. VENTA';
      if (!porTipo[t]) porTipo[t] = { total:0, cant:0 };
      porTipo[t].total += v.total;
      porTipo[t].cant++;
    });

    var fechaFormato = new Date(fechaVer + 'T12:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    var html = '';

    // ── HERO BANNER ──
    html += '<div style="background:linear-gradient(135deg,#050510 0%,#0a0a2a 50%,#050510 100%);border-radius:16px;padding:28px 32px;margin-bottom:20px;position:relative;overflow:hidden;border:1px solid rgba(212,175,55,0.2);">' +
      '<div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;border:1px solid rgba(0,150,255,0.1);"></div>' +
      '<div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;border:1px solid rgba(212,175,55,0.08);"></div>' +
      '<div style="position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(180deg,transparent,#0096ff,#d4af37,transparent);"></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;">' +
        '<div>' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<div style="width:8px;height:8px;border-radius:50%;background:#16a34a;box-shadow:0 0 8px rgba(22,163,74,0.8);"></div>' +
            '<span style="font-size:10px;color:rgba(22,163,74,0.9);font-weight:700;letter-spacing:2px;">EN VIVO</span>' +
          '</div>' +
          '<h1 style="font-size:24px;font-weight:900;color:#fff;margin:0 0 4px;">📊 Resumen del Día</h1>' +
          '<p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;text-transform:capitalize;">' + fechaFormato + '</p>' +
        '</div>' +
        '<div style="text-align:center;">' +
          '<div style="font-size:10px;color:rgba(212,175,55,0.6);letter-spacing:2px;margin-bottom:4px;">TOTAL RECAUDADO</div>' +
          '<div style="font-size:38px;font-weight:900;background:linear-gradient(90deg,#0096ff,#d4af37);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;line-height:1;">S/ ' + totalHoy.toFixed(2) + '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;">' + cantHoy + ' comprobantes emitidos</div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;">' +
          '<div style="text-align:center;padding:12px 18px;background:rgba(0,150,255,0.08);border:1px solid rgba(0,150,255,0.2);border-radius:12px;">' +
            '<div style="font-size:18px;font-weight:800;color:#0096ff;">S/ ' + ticketProm.toFixed(2) + '</div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;">TICKET PROM.</div>' +
          '</div>' +
          '<div style="text-align:center;padding:12px 18px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:12px;">' +
            '<div style="font-size:18px;font-weight:800;color:#d4af37;">' + horaPicoLabel + '</div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;">HORA PICO</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">' +
  // Selector de fecha
  '<div style="display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(212,175,55,0.3);border-radius:10px;padding:8px 12px;">' +
    '<i class="fas fa-calendar-alt" style="color:#d4af37;font-size:13px;"></i>' +
    '<input type="date" id="resumenFecha" value="' + hoy + '" ' +
      'onchange="ResumenDiaModule.cambiarFecha(this.value)" ' +
      'style="background:transparent;border:none;outline:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;"/>' +
    '<button onclick="ResumenDiaModule.cambiarFecha(\'' + hoy + '\')" ' +
      'style="background:rgba(212,175,55,0.2);border:none;border-radius:6px;color:#d4af37;font-size:10px;font-weight:800;padding:3px 8px;cursor:pointer;letter-spacing:0.5px;">HOY</button>' +
  '</div>' +
  // Botones navegación días
  '<div style="display:flex;gap:6px;">' +
    '<button onclick="ResumenDiaModule._navDia(-1)" style="padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;cursor:pointer;">' +
      '<i class="fas fa-chevron-left"></i> Ayer' +
    '</button>' +
    '<button onclick="App.navigate(\'pos\')" style="padding:8px 12px;background:linear-gradient(135deg,#b8860b,#d4af37);border:none;border-radius:8px;color:#050510;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:5px;">' +
      '<i class="fas fa-cash-register"></i> POS' +
    '</button>' +
    '<button onclick="ResumenDiaModule._navDia(1)" style="padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;cursor:pointer;">' +
      'Sig. <i class="fas fa-chevron-right"></i>' +
    '</button>' +
  '</div>' +
'</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    // ── MÉTODOS DE PAGO — 4 cards grandes ──
    html += '<div style="margin-bottom:16px;">' +
      '<div style="font-size:10px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">' +
        '<i class="fas fa-coins" style="color:#d4af37;margin-right:6px;"></i>Desglose por Método de Pago' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">';

    var metodos = [
      { key:'EFECTIVO',  label:'Efectivo',    sub:'Billetes y monedas', icon:'fa-money-bill-wave', color:'#16a34a', grad:'135deg,#052e16,#14532d', glow:'22,163,74' },
      { key:'YAPE',      label:'Yape / Plin', sub:'Billetera digital',  icon:'fa-mobile-alt',       color:'#a855f7', grad:'135deg,#2e1065,#4c1d95', glow:'168,85,247' },
      { key:'TARJETA',   label:'Tarjeta',     sub:'Débito y crédito',   icon:'fa-credit-card',      color:'#0096ff', grad:'135deg,#020218,#1e3a5f', glow:'0,150,255' },
      { key:'COMBINADO', label:'Combinado',   sub:'Pago mixto',         icon:'fa-random',           color:'#d4af37', grad:'135deg,#1c1500,#3d2e00', glow:'212,175,55' }
    ];

    metodos.forEach(function(m) {
      var monto = desglose[m.key] || 0;
      var cant  = cantMetodo[m.key] || 0;
      var pct   = totalHoy > 0 ? (monto / totalHoy * 100) : 0;
      var activo = monto > 0;

      html += '<div style="background:linear-gradient(' + m.grad + ');border-radius:14px;padding:20px;border:1px solid rgba(' + m.glow + ',0.25);' +
        (activo ? 'box-shadow:0 4px 20px rgba(' + m.glow + ',0.2);' : 'opacity:0.45;') + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
          '<div style="width:40px;height:40px;border-radius:10px;background:rgba(' + m.glow + ',0.2);display:flex;align-items:center;justify-content:center;font-size:18px;color:' + m.color + ';">' +
            '<i class="fas ' + m.icon + '"></i>' +
          '</div>' +
          '<span style="font-size:10px;font-weight:800;color:rgba(255,255,255,0.35);background:rgba(255,255,255,0.08);padding:3px 8px;border-radius:20px;">' +
            cant + ' ops' +
          '</span>' +
        '</div>' +
        '<div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);margin-bottom:2px;">' + m.label + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:10px;">' + m.sub + '</div>' +
        '<div style="font-size:28px;font-weight:900;color:' + m.color + ';margin-bottom:4px;line-height:1;">S/ ' + monto.toFixed(2) + '</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:10px;">' + pct.toFixed(1) + '% del total</div>' +
        '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">' +
          '<div style="height:100%;width:' + Math.min(100,pct) + '%;background:' + m.color + ';border-radius:2px;box-shadow:0 0 6px rgba(' + m.glow + ',0.5);"></div>' +
        '</div>' +
      '</div>';
    });

    html += '</div></div>';

    // ── GRÁFICO HORAS + TIPO COMPROBANTE ──
    html += '<div style="display:grid;grid-template-columns:1fr 320px;gap:16px;margin-bottom:16px;">';

    // Gráfico por hora
    html += '<div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-bar" style="color:#0096ff;margin-right:6px;"></i>Ventas por Hora</span></div>' +
      '<div class="card-body" style="padding:16px;">';

    var maxHora = 0;
    for (var hh2 = 6; hh2 <= 22; hh2++) { if (porHora[hh2] > maxHora) maxHora = porHora[hh2]; }

    if (maxHora === 0) {
      html += '<div style="text-align:center;padding:36px;color:var(--gray-400);"><i class="fas fa-clock" style="font-size:32px;display:block;margin-bottom:8px;"></i><p>Sin ventas aún</p></div>';
    } else {
      html += '<div style="display:flex;align-items:flex-end;gap:5px;height:110px;">';
      for (var hh = 6; hh <= 22; hh++) {
        var val = porHora[hh] || 0;
        var pctBar = maxHora > 0 ? (val / maxHora * 100) : 0;
        var esPico = hh === horaPicoNum && val > 0;
        var barColor = esPico ? '#d4af37' : (val > 0 ? '#0096ff' : 'var(--gray-200)');
        var hLbl = (hh % 12 || 12) + (hh < 12 ? 'a' : 'p');
        html += '<div title="' + ResumenDiaModule._horaLabel(String(hh).padStart(2,'0')+':00') + ': S/ ' + val.toFixed(2) + '" ' +
          'style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:default;">' +
          '<div style="width:100%;height:' + Math.max(4,pctBar) + '%;background:' + barColor + ';border-radius:3px 3px 0 0;' +
            (esPico ? 'box-shadow:0 0 8px rgba(212,175,55,0.6);' : '') + '"></div>' +
          '<span style="font-size:9px;color:var(--gray-400);">' + hLbl + '</span>' +
        '</div>';
      }
      html += '</div>';
      html += '<div style="display:flex;gap:16px;margin-top:10px;padding-top:10px;border-top:1px solid var(--gray-200);">' +
        '<span style="font-size:11px;color:var(--gray-500);display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:#0096ff;display:inline-block;"></span>Con ventas</span>' +
        '<span style="font-size:11px;color:var(--gray-500);display:flex;align-items:center;gap:5px;"><span style="width:10px;height:10px;border-radius:2px;background:#d4af37;display:inline-block;"></span>Hora pico: ' + horaPicoLabel + '</span>' +
      '</div>';
    }
    html += '</div></div>';

    // Panel tipo comprobante
    var tipoConf = {
      'BOL':      { label:'Boleta de Venta',     icon:'fa-file-invoice',         color:'#0096ff', bg:'rgba(0,150,255,0.08)' },
      'FAC':      { label:'Factura Electrónica',  icon:'fa-file-invoice-dollar',  color:'#7c3aed', bg:'rgba(124,58,237,0.08)' },
      'N. VENTA': { label:'Nota de Venta',        icon:'fa-file-alt',             color:'#d4af37', bg:'rgba(212,175,55,0.08)' },
      'NV':       { label:'Nota de Venta',        icon:'fa-file-alt',             color:'#d4af37', bg:'rgba(212,175,55,0.08)' }
    };

    html += '<div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-file-invoice" style="color:#d4af37;margin-right:6px;"></i>Por Tipo</span></div>' +
      '<div class="card-body" style="padding:12px;">';

    if (!Object.keys(porTipo).length) {
      html += '<div style="text-align:center;padding:30px;color:var(--gray-400);"><i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;"></i><p>Sin comprobantes</p></div>';
    } else {
      Object.keys(porTipo).forEach(function(t) {
        var d = porTipo[t];
        var cfg = tipoConf[t] || { label:t, icon:'fa-file', color:'#64748b', bg:'rgba(100,116,139,0.08)' };
        var pct = totalHoy > 0 ? (d.total / totalHoy * 100) : 0;
        html += '<div style="padding:12px;background:' + cfg.bg + ';border-radius:10px;border:1px solid ' + cfg.color + '22;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<i class="fas ' + cfg.icon + '" style="color:' + cfg.color + ';font-size:14px;"></i>' +
              '<span style="font-size:12px;font-weight:700;color:var(--gray-900);">' + cfg.label + '</span>' +
            '</div>' +
            '<span style="font-size:14px;font-weight:800;color:' + cfg.color + ';">S/ ' + d.total.toFixed(2) + '</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-500);margin-bottom:6px;">' +
            '<span>' + d.cant + ' documentos</span><span>' + pct.toFixed(0) + '%</span>' +
          '</div>' +
          '<div style="height:4px;background:var(--gray-200);border-radius:2px;overflow:hidden;">' +
            '<div style="height:100%;width:' + Math.min(100,pct) + '%;background:' + cfg.color + ';border-radius:2px;"></div>' +
          '</div>' +
        '</div>';
      });
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:linear-gradient(135deg,rgba(0,150,255,0.05),rgba(212,175,55,0.05));border-radius:10px;border:1px solid rgba(212,175,55,0.2);">' +
        '<span style="font-size:11px;font-weight:700;color:var(--gray-600);">TOTAL</span>' +
        '<span style="font-size:16px;font-weight:900;background:linear-gradient(90deg,#0096ff,#d4af37);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">S/ ' + totalHoy.toFixed(2) + '</span>' +
      '</div>';
    }
    html += '</div></div></div>'; // fin grid

    // ── TABLA VENTAS DEL DÍA ──
    html += '<div class="card"><div class="card-header" style="flex-wrap:wrap;gap:10px;">' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span class="card-title"><i class="fas fa-receipt" style="color:#0096ff;margin-right:6px;"></i>Comprobantes Emitidos Hoy</span>' +
        '<span style="background:rgba(0,150,255,0.1);color:#0096ff;font-size:11px;font-weight:800;padding:3px 10px;border-radius:20px;">' + cantHoy + '</span>' +
      '</div>' +
      // Filtros rápidos
      '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        '<button onclick="ResumenDiaModule._filtrarTabla(\'TODOS\')" id="filtro_TODOS" style="padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800;border:2px solid #0096ff;background:#0096ff;color:#fff;cursor:pointer;">Todos (' + cantHoy + ')</button>' +
        '<button onclick="ResumenDiaModule._filtrarTabla(\'EFECTIVO\')" id="filtro_EFECTIVO" style="padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800;border:2px solid #16a34a;background:transparent;color:#16a34a;cursor:pointer;">💵 Efectivo (' + cantMetodo.EFECTIVO + ')</button>' +
        '<button onclick="ResumenDiaModule._filtrarTabla(\'YAPE\')" id="filtro_YAPE" style="padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800;border:2px solid #a855f7;background:transparent;color:#a855f7;cursor:pointer;">📱 Yape (' + cantMetodo.YAPE + ')</button>' +
        '<button onclick="ResumenDiaModule._filtrarTabla(\'TARJETA\')" id="filtro_TARJETA" style="padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800;border:2px solid #0096ff;background:transparent;color:#0096ff;cursor:pointer;">💳 Tarjeta (' + cantMetodo.TARJETA + ')</button>' +
        '<button onclick="ResumenDiaModule._filtrarTabla(\'COMBINADO\')" id="filtro_COMBINADO" style="padding:6px 12px;border-radius:20px;font-size:11px;font-weight:800;border:2px solid #d4af37;background:transparent;color:#d4af37;cursor:pointer;">🔀 Combinado (' + cantMetodo.COMBINADO + ')</button>' +
      '</div>' +
      '<button onclick="App.navigate(\'pos\')" style="padding:8px 14px;background:linear-gradient(135deg,#b8860b,#d4af37);border:none;border-radius:8px;color:#050510;font-size:11px;font-weight:800;cursor:pointer;display:flex;align-items:center;gap:6px;">' +
        '<i class="fas fa-plus"></i> Nueva Venta' +
      '</button>' +
    '</div>';

    if (!ventasHoy.length) {
      html += '<div style="text-align:center;padding:60px;">' +
        '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,rgba(0,150,255,0.08),rgba(212,175,55,0.08));display:flex;align-items:center;justify-content:center;margin:0 auto 14px;border:2px dashed rgba(212,175,55,0.25);">' +
          '<i class="fas fa-store" style="font-size:28px;color:rgba(212,175,55,0.4);"></i>' +
        '</div>' +
        '<p style="font-size:15px;font-weight:700;color:var(--gray-600);margin-bottom:6px;">Sin ventas registradas hoy</p>' +
        '<p style="font-size:13px;color:var(--gray-400);">Las ventas aparecerán aquí en tiempo real</p>' +
        '<button onclick="App.navigate(\'pos\')" style="margin-top:16px;padding:11px 22px;background:linear-gradient(135deg,#b8860b,#d4af37);border:none;border-radius:10px;color:#050510;font-size:12px;font-weight:800;cursor:pointer;">' +
          '<i class="fas fa-cash-register"></i> Ir al Punto de Venta' +
        '</button>' +
      '</div>';
    } else {
      html += '<div class="table-wrapper"><table class="data-table" id="tablaVentasDia">' +
        '<thead><tr><th>#</th><th>Comprobante</th><th>Cliente</th><th>Hora</th><th>Método de Pago</th><th>Items</th><th style="text-align:right;">Total</th><th>Estado</th></tr></thead><tbody>';

      var ordenadas = ventasHoy.slice().reverse();
      ordenadas.forEach(function(v, idx) {
        var cli    = DB.clientes.find(function(x){ return x.id===v.cliente_id; });
        var nombre = cli ? cli.nombre.substring(0,26) : 'Público General';
        var items  = (v.items||[]).length;
        var m2 = (v.metodo_pago||'EFECTIVO').toUpperCase();
        var mc, mg, mi2;
        if (m2.includes('+'))                                     { mc='#d4af37'; mg='rgba(212,175,55,0.12)'; mi2='fa-random'; }
        else if (m2.includes('YAPE')||m2.includes('PLIN'))       { mc='#a855f7'; mg='rgba(168,85,247,0.12)'; mi2='fa-mobile-alt'; }
        else if (m2.includes('TARJETA')||m2.includes('VISA'))    { mc='#0096ff'; mg='rgba(0,150,255,0.12)'; mi2='fa-credit-card'; }
        else                                                       { mc='#16a34a'; mg='rgba(22,163,74,0.12)'; mi2='fa-money-bill-wave'; }

        html += '<tr data-metodo="' + (v.metodo_pago||'EFECTIVO') + '">' +
          '<td style="color:var(--gray-400);font-size:11px;">' + (ordenadas.length - idx) + '</td>' +
          '<td><div class="td-name">' + v.serie + '-' + v.numero + '</div><div class="td-sub">' + (v.tipo||'N. VENTA') + '</div></td>' +
          '<td><div style="font-size:12px;font-weight:600;color:var(--gray-800);">' + nombre + '</div></td>' +
          '<td><span style="font-size:13px;font-weight:700;color:var(--gray-700);">' + (v.hora||'--') + '</span></td>' +
          '<td><span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;background:' + mg + ';color:' + mc + ';">' +
            '<i class="fas ' + mi2 + '"></i>' + (v.metodo_pago||'EFECTIVO').substring(0,16) + '</span></td>' +
          '<td style="text-align:center;"><span style="background:var(--gray-100);color:var(--gray-600);font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;">' + items + ' items</span></td>' +
          '<td style="text-align:right;"><strong style="font-size:15px;">S/ ' + v.total.toFixed(2) + '</strong></td>' +
          '<td><span style="padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;' +
            'background:' + (v.estado==='ACEPTADO'?'#dcfce7':'#fee2e2') + ';' +
            'color:' + (v.estado==='ACEPTADO'?'#16a34a':'#dc2626') + ';">' +
            (v.estado==='ACEPTADO'?'✓ ACEPT.':'✗ NO ENV.') + '</span></td>' +
        '</tr>';
      });

      html += '</tbody></table></div>';

      // Pie de tabla
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:linear-gradient(135deg,rgba(0,150,255,0.03),rgba(212,175,55,0.03));border-top:2px solid var(--gray-200);">' +
        '<div style="display:flex;gap:20px;flex-wrap:wrap;">' +
          '<span style="font-size:12px;color:var(--gray-500);">💵 Efectivo: <strong style="color:#16a34a;">S/ ' + desglose.EFECTIVO.toFixed(2) + '</strong></span>' +
          '<span style="font-size:12px;color:var(--gray-500);">📱 Yape: <strong style="color:#a855f7;">S/ ' + desglose.YAPE.toFixed(2) + '</strong></span>' +
          '<span style="font-size:12px;color:var(--gray-500);">💳 Tarjeta: <strong style="color:#0096ff;">S/ ' + desglose.TARJETA.toFixed(2) + '</strong></span>' +
          '<span style="font-size:12px;color:var(--gray-500);">🔀 Combinado: <strong style="color:#d4af37;">S/ ' + desglose.COMBINADO.toFixed(2) + '</strong></span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">' +
          '<span style="font-size:12px;font-weight:600;color:var(--gray-600);">TOTAL DEL DÍA:</span>' +
          '<span style="font-size:22px;font-weight:900;background:linear-gradient(90deg,#0096ff,#d4af37);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">S/ ' + totalHoy.toFixed(2) + '</span>' +
        '</div>' +
      '</div>';
    }

    html += '</div>';
    return html;
  },

  _filtrarTabla(metodo) {
    // Actualizar estilos de botones
    var colores = { TODOS:'#0096ff', EFECTIVO:'#16a34a', YAPE:'#a855f7', TARJETA:'#0096ff', COMBINADO:'#d4af37' };
    Object.keys(colores).forEach(function(k) {
      var btn = document.getElementById('filtro_' + k);
      if (!btn) return;
      if (k === metodo) {
        btn.style.background = colores[k];
        btn.style.color = k === 'COMBINADO' ? '#050510' : '#fff';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = colores[k];
      }
    });

    // Filtrar filas de la tabla
    var filas = document.querySelectorAll('#tablaVentasDia tr');
    filas.forEach(function(fila) {
      if (metodo === 'TODOS') {
        fila.style.display = '';
        return;
      }
      var metodoCelda = (fila.dataset.metodo || '').toUpperCase();
      var m = metodo.toUpperCase();
      var mostrar = false;
      if (m === 'EFECTIVO'  && metodoCelda.includes('EFECTIVO') && !metodoCelda.includes('+')) mostrar = true;
      if (m === 'YAPE'      && (metodoCelda.includes('YAPE') || metodoCelda.includes('PLIN')) && !metodoCelda.includes('+')) mostrar = true;
      if (m === 'TARJETA'   && (metodoCelda.includes('TARJETA') || metodoCelda.includes('VISA')) && !metodoCelda.includes('+')) mostrar = true;
      if (m === 'COMBINADO' && metodoCelda.includes('+')) mostrar = true;
      fila.style.display = mostrar ? '' : 'none';
    });
  },
};
