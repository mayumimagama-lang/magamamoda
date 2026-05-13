// ============================================================
// MÓDULO: INICIO — Dashboard Profesional v3
// ============================================================

const InicioModule = {
  periodo: '7',
  _charts: {},

  _fechaLocal(d) {
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },

  _diasPeriodo() {
    var dias = this.periodo==='mes' ? 30 : parseInt(this.periodo);
    var result = [];
    for (var i=dias-1; i>=0; i--) {
      var d = new Date(); d.setDate(d.getDate()-i);
      result.push({ fecha:this._fechaLocal(d), label:d.toLocaleDateString('es-PE',{day:'2-digit',month:'short'}) });
    }
    return result;
  },

  _fechaAnterior() {
    var dias = this.periodo==='mes' ? 30 : parseInt(this.periodo);
    var d2   = new Date(); d2.setDate(d2.getDate()-1);
    var d1   = new Date(); d1.setDate(d1.getDate()-dias*2);
    return { inicio:this._fechaLocal(d1), fin:this._fechaLocal(d2) };
  },

  _tendencia(actual, anterior) {
    if (anterior===0) return { pct:'—', up:true };
    var pct = ((actual-anterior)/anterior*100).toFixed(1);
    return { pct:(pct>0?'+':'')+pct+'%', up:parseFloat(pct)>=0 };
  },

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Panel Principal','');
    var dat  = this._calcularDatos();
    var hoy  = this._fechaLocal(new Date());
    var hora = new Date().getHours();
    // ✅ CORRECTO
var saludo = hora<12?'🌅 Buenos días':hora<18?'🌤️ Buenas tardes':'🌙 Buenas noches';
    saludo = hora<12?'🌅 Buenos días':hora<18?'🌤️ Buenas tardes':'🌙 Buenas noches';
    var nombre = DB.usuarioActual ? DB.usuarioActual.nombre.split(' ')[0] : 'Equipo';

    // Tendencias respecto al período anterior
    var ant   = this._calcularDatosAnteriores();
    var tVen  = this._tendencia(dat.totalPeriodo, ant.totalPeriodo);
    var tHoy  = this._tendencia(dat.totalHoy, ant.totalHoy);
    var tTick = this._tendencia(dat.ticketProm, ant.ticketProm);
    var tUtil = this._tendencia(dat.utilidad, ant.utilidad);

    var html = '';

    // ── HEADER ──
    html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:12px;">' +
      '<div>' +
        '<h2 style="font-size:22px;font-weight:900;color:var(--gray-900);margin:0 0 4px;">'+saludo+', '+nombre+'</h2>' +
        '<p style="color:var(--gray-500);font-size:13px;margin:0;">' +
          new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+
          ' &nbsp;·&nbsp; '+DB.empresa.nombre +
        '</p>' +
      '</div>' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
        '<div style="display:flex;background:var(--gray-100);border-radius:10px;padding:4px;gap:2px;">' +
          [['7','7 días'],['30','30 días'],['mes','Este mes']].map(function(it){
            var act = InicioModule.periodo===it[0];
            return '<button onclick="InicioModule.setPeriodo(\''+it[0]+'\')" style="padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;border:none;cursor:pointer;transition:all 0.2s;'+
              'background:'+(act?'white':'transparent')+';color:'+(act?'var(--accent)':'var(--gray-500)')+';box-shadow:'+(act?'0 1px 4px rgba(0,0,0,0.1)':'none')+'">' +
              it[1]+'</button>';
          }).join('')+
        '</div>' +
        '<button onclick="App.navigate(\'pos\')" style="padding:9px 18px;background:var(--accent);color:white;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">' +
          '<i class="fas fa-cash-register"></i>Abrir POS</button>' +
      '</div>' +
    '</div>';

    // ── KPI CARDS ──
    var kpiData = [
      { grad:'linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%)', icon:'fa-dollar-sign',
        label:'Ventas del Período', val:'S/ '+dat.totalPeriodo.toFixed(2),
        sub:dat.cantPeriodo+' comprobantes', trend:tVen, click:'' },
      { grad:'linear-gradient(135deg,#064e3b 0%,#16a34a 100%)', icon:'fa-bolt',
        label:'Ventas de Hoy', val:'S/ '+dat.totalHoy.toFixed(2),
        sub:dat.cantHoy+' ventas hoy', trend:tHoy, click:'' },
      { grad:'linear-gradient(135deg,#7c2d12 0%,#ea580c 100%)', icon:'fa-receipt',
        label:'Ticket Promedio', val:'S/ '+dat.ticketProm.toFixed(2),
        sub:'Por comprobante', trend:tTick, click:'' },
      { grad:'linear-gradient(135deg,#4a1d96 0%,#7c3aed 100%)', icon:'fa-chart-line',
        label:'Utilidad Bruta', val:'S/ '+dat.utilidad.toFixed(2),
        sub:dat.margen.toFixed(1)+'% de margen', trend:tUtil, click:'' },
      { grad:'linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)', icon:'fa-exclamation-triangle',
        label:'Alertas de Stock', val:String(dat.alertasTotal),
        sub:dat.sinStock+' agotados · '+dat.stockBajo+' bajos',
        trend:null, click:' onclick="App.navigate(\'inventario\')" style="cursor:pointer;"' },
    ];

    html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px;">';
    kpiData.forEach(function(k) {
      html += '<div class="kpi-card" style="background:'+k.grad+';position:relative;overflow:hidden;"'+k.click+'>' +
        '<div style="position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>' +
        '<div style="position:absolute;bottom:-30px;right:10px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>' +
        '<div class="kpi-icon"><i class="fas '+k.icon+'"></i></div>' +
        '<div class="kpi-label">'+k.label+'</div>' +
        '<div class="kpi-value">'+k.val+'</div>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">' +
          '<div class="kpi-sub">'+k.sub+'</div>' +
          (k.trend ? '<span style="font-size:10px;font-weight:800;padding:2px 6px;border-radius:10px;background:rgba(255,255,255,0.15);color:white;">'+k.trend.pct+'</span>' : '') +
        '</div>' +
      '</div>';
    });
    html += '</div>';

    // ── ACCIONES RÁPIDAS ──
    var acciones = [
      { icon:'fa-plus-circle',  label:'Nueva Venta',     color:'#16a34a', bg:'#f0fdf4', page:'ventas',      fn:'VentasModule.nuevaVenta();App.navigate(\'ventas\')' },
      { icon:'fa-shopping-cart',label:'Punto de Venta',  color:'#2563eb', bg:'#eff6ff', page:'pos',          fn:'App.navigate(\'pos\')' },
      { icon:'fa-file-alt',     label:'Cotización',      color:'#7c3aed', bg:'#f5f3ff', page:'cotizaciones', fn:'App.navigate(\'cotizaciones\');setTimeout(function(){CotizacionesModule.nueva();},100)' },
      { icon:'fa-user-plus',    label:'Nuevo Cliente',   color:'#0891b2', bg:'#ecfeff', page:'clientes',     fn:'App.navigate(\'clientes\');setTimeout(function(){ClientesModule.nuevo();},100)' },
      { icon:'fa-box',          label:'Nuevo Producto',  color:'#d97706', bg:'#fffbeb', page:'productos',    fn:'App.navigate(\'productos\');setTimeout(function(){ProductosModule.nuevo();},100)' },
      { icon:'fa-warehouse',    label:'Inventario',      color:'#dc2626', bg:'#fef2f2', page:'inventario',   fn:'App.navigate(\'inventario\')' },
      { icon:'fa-cash-register',label:'Caja',            color:'#065f46', bg:'#f0fdf4', page:'caja',         fn:'App.navigate(\'caja\')' },
      { icon:'fa-chart-bar',    label:'Reportes',        color:'#1e3a5f', bg:'#eff6ff', page:'reportes',     fn:'App.navigate(\'reportes\')' },
    ];

    html += '<div class="card" style="margin-bottom:18px;">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);">' +
        '<span style="font-size:13px;font-weight:800;color:var(--gray-700);">⚡ Acciones Rápidas</span>' +
      '</div>' +
      '<div style="padding:14px 18px;display:grid;grid-template-columns:repeat(8,1fr);gap:10px;">' +
        acciones.map(function(a) {
          return '<div onclick="'+a.fn+'" style="display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 8px;border-radius:12px;cursor:pointer;transition:all 0.2s;border:1.5px solid var(--gray-200);background:white;" '+
            'onmouseover="this.style.background=\''+a.bg+'\';this.style.borderColor=\''+a.color+'\';this.style.transform=\'translateY(-2px)\'" '+
            'onmouseout="this.style.background=\'white\';this.style.borderColor=\'var(--gray-200)\';this.style.transform=\'none\'">' +
            '<div style="width:40px;height:40px;border-radius:10px;background:'+a.bg+';color:'+a.color+';display:flex;align-items:center;justify-content:center;font-size:16px;">' +
              '<i class="fas '+a.icon+'"></i>' +
            '</div>' +
            '<span style="font-size:11px;font-weight:700;color:var(--gray-700);text-align:center;line-height:1.3;">'+a.label+'</span>' +
          '</div>';
        }).join('')+
      '</div>' +
    '</div>';

    // ── FILA GRÁFICAS: LÍNEA VENTAS + DONUT MÉTODOS ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 300px;gap:16px;margin-bottom:16px;">';

    // Gráfica línea - Boletas/Facturas
    var totBOL=0,cntBOL=0;
    this._diasPeriodo().forEach(function(d){
      DB.ventas.forEach(function(v){
        if(v.fecha===d.fecha&&(v.tipo==='BOL'||v.tipo==='FAC')){totBOL+=v.total;cntBOL++;}
      });
    });
    html += '<div class="card">' +
      '<div class="card-header" style="padding:14px 18px;">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-file-invoice" style="color:#2563eb;margin-right:6px;"></i>Boletas y Facturas</div>' +
          '<div style="font-size:11px;color:var(--gray-400);margin-top:1px;">'+cntBOL+' documentos emitidos</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:16px;font-weight:900;color:#2563eb;">S/ '+totBOL.toFixed(2)+'</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:0 14px 14px;"><canvas id="chartBOL" height="100"></canvas></div>' +
    '</div>';

    // Gráfica línea - Notas de Venta
    var totNV=0,cntNV=0;
    this._diasPeriodo().forEach(function(d){
      DB.ventas.forEach(function(v){
        if(v.fecha===d.fecha&&v.tipo==='N. VENTA'){totNV+=v.total;cntNV++;}
      });
    });
    html += '<div class="card">' +
      '<div class="card-header" style="padding:14px 18px;">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-file-alt" style="color:#ea580c;margin-right:6px;"></i>Notas de Venta</div>' +
          '<div style="font-size:11px;color:var(--gray-400);margin-top:1px;">'+cntNV+' notas emitidas</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<div style="font-size:16px;font-weight:900;color:#ea580c;">S/ '+totNV.toFixed(2)+'</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:0 14px 14px;"><canvas id="chartNV" height="100"></canvas></div>' +
    '</div>';

    // Donut métodos de pago
    html += '<div class="card">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-credit-card" style="color:#7c3aed;margin-right:6px;"></i>Métodos de Pago</div>' +
      '</div>' +
      '<div style="padding:12px;display:flex;flex-direction:column;align-items:center;">' +
        '<canvas id="chartMetodosPago" height="140" width="140" style="max-width:140px;"></canvas>' +
        '<div id="legendMetodos" style="margin-top:10px;width:100%;"></div>' +
      '</div>' +
    '</div>';

    html += '</div>';

    // ── FILA: TOP PRODUCTOS + CATEGORÍAS ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +
      '<div class="card">' +
        '<div class="card-header" style="padding:14px 18px;">' +
          '<span style="font-size:13px;font-weight:800;"><i class="fas fa-trophy" style="color:#d97706;margin-right:6px;"></i>Top 6 Productos Vendidos</span>' +
        '</div>' +
        '<div style="padding:0 14px 14px;"><canvas id="chartTopProductos" height="160"></canvas></div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-header" style="padding:14px 18px;">' +
          '<span style="font-size:13px;font-weight:800;"><i class="fas fa-tags" style="color:#16a34a;margin-right:6px;"></i>Ventas por Categoría</span>' +
        '</div>' +
        '<div style="padding:0 14px 14px;"><canvas id="chartCategorias" height="160"></canvas></div>' +
      '</div>' +
    '</div>';

    // ── FILA: ÚLTIMAS VENTAS + STOCK + AGENDA ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;">';

    // Últimas ventas
    html += '<div class="card">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-size:13px;font-weight:800;"><i class="fas fa-receipt" style="color:#16a34a;margin-right:6px;"></i>Últimas Ventas</div>' +
        '<button onclick="App.navigate(\'ventas\')" style="font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:700;">Ver todas →</button>' +
      '</div>';
    var ultVentas = DB.ventas.slice(0,6);
    if (ultVentas.length === 0) {
      html += '<div style="text-align:center;padding:32px;color:var(--gray-400);"><i class="fas fa-inbox" style="font-size:28px;display:block;margin-bottom:8px;opacity:0.3;"></i>Sin ventas</div>';
    } else {
      ultVentas.forEach(function(v) {
        var c = DB.clientes.find(function(x){return x.id===v.cliente_id;});
        var nombre = c ? c.nombre.substring(0,22) : 'Público General';
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--gray-100);">' +
          '<div style="width:34px;height:34px;border-radius:9px;background:#f0fdf4;color:#16a34a;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;"><i class="fas fa-file-invoice"></i></div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+nombre+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+v.serie+'-'+v.numero+' · '+v.fecha+'</div>' +
          '</div>' +
          '<div style="text-align:right;flex-shrink:0;">' +
            '<div style="font-size:13px;font-weight:800;color:var(--gray-800);">S/ '+v.total.toFixed(2)+'</div>' +
            '<span style="font-size:9px;padding:2px 6px;border-radius:4px;font-weight:800;background:'+(v.estado==='ACEPTADO'?'#dcfce7':'#fee2e2')+';color:'+(v.estado==='ACEPTADO'?'#16a34a':'#dc2626')+';">'+(v.estado==='ACEPTADO'?'ACEPT.':'N.ENV.')+'</span>' +
          '</div>' +
        '</div>';
      });
    }
    html += '</div>';

    // Alertas stock
    html += '<div class="card">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-size:13px;font-weight:800;color:#dc2626;"><i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>Alertas Stock</div>' +
        '<button onclick="App.navigate(\'inventario\')" style="font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:700;">Ver →</button>' +
      '</div>';
    var alertas = DB.productos.filter(function(p){return (p.stock||0)<=10;}).slice(0,6);
    if (!alertas.length) {
      html += '<div style="text-align:center;padding:32px;color:var(--gray-400);"><i class="fas fa-check-circle" style="font-size:28px;color:#16a34a;display:block;margin-bottom:8px;"></i>Sin alertas</div>';
    } else {
      alertas.forEach(function(p) {
        var agot = (p.stock||0)===0;
        html += '<div style="display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--gray-100);">' +
          '<div style="width:34px;height:34px;border-radius:9px;background:'+(agot?'#fef2f2':'#fffbeb')+';color:'+(agot?'#dc2626':'#d97706')+';display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;">' +
            '<i class="fas '+(agot?'fa-times-circle':'fa-exclamation-circle')+'"></i></div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+p.nombre+'</div>' +
            '<div style="font-size:10px;color:var(--gray-400);">'+p.categoria+'</div>' +
          '</div>' +
          '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;flex-shrink:0;background:'+(agot?'#fef2f2':'#fffbeb')+';color:'+(agot?'#dc2626':'#d97706')+';">'+(agot?'AGOTADO':(p.stock||0)+' uds')+'</span>' +
        '</div>';
      });
    }
    html += '</div>';

    // Agenda
    var hoyStr = this._fechaLocal(new Date());
    var proximos = (DB.agenda||[]).filter(function(a){return !a.completado;})
      .sort(function(a,b){return a.fecha.localeCompare(b.fecha);}).slice(0,6);
    var agColors  = {pago:'#16a34a',reunion:'#2563eb',vencimiento:'#dc2626',recordatorio:'#d97706'};
    var agEmojis  = {pago:'💰',reunion:'🤝',vencimiento:'⏰',recordatorio:'📝'};

    html += '<div class="card">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-size:13px;font-weight:800;"><i class="fas fa-calendar-alt" style="color:#2563eb;margin-right:6px;"></i>Próximos Eventos</div>' +
        '<button onclick="App.navigate(\'agenda\')" style="font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer;font-weight:700;">Ver →</button>' +
      '</div>';
    if (!proximos.length) {
      html += '<div style="text-align:center;padding:32px;color:var(--gray-400);"><i class="fas fa-calendar-check" style="font-size:28px;display:block;margin-bottom:8px;opacity:0.3;"></i>Sin eventos</div>';
    } else {
      proximos.forEach(function(a) {
        var venc = a.fecha < hoyStr;
        var esHoy= a.fecha === hoyStr;
        html += '<div style="display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid var(--gray-100);">' +
          '<div style="width:34px;height:34px;border-radius:9px;background:'+(agColors[a.tipo]||'#6b7280')+'18;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">'+(agEmojis[a.tipo]||'📅')+'</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+a.titulo+'</div>' +
            '<div style="font-size:10px;color:'+(venc?'#dc2626':esHoy?'#16a34a':'var(--gray-400)')+';">'+(esHoy?'🔴 HOY · ':'')+a.fecha+' '+a.hora+'</div>' +
          '</div>' +
          (venc?'<span style="background:#fef2f2;color:#dc2626;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:800;flex-shrink:0;">VENCIDO</span>':
           esHoy?'<span style="background:#f0fdf4;color:#16a34a;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:800;flex-shrink:0;">HOY</span>':'')+
        '</div>';
      });
    }
    html += '</div>';

    html += '</div>'; // fin fila 3

    // ── FILA FINAL: RESUMEN FINANCIERO + CUENTAS ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';

    // Resumen financiero
    html += '<div class="card">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);">' +
        '<div style="font-size:13px;font-weight:800;"><i class="fas fa-balance-scale" style="color:#7c3aed;margin-right:6px;"></i>Resumen Financiero</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:1px;">Período seleccionado</div>' +
      '</div>' +
      '<div style="padding:16px 18px;">';
    [
      {label:'Ingresos (Ventas)',   val:dat.totalPeriodo, color:'#16a34a', icon:'fa-arrow-circle-up',   bg:'#f0fdf4'},
      {label:'Egresos (Compras)',   val:dat.totalCompras,  color:'#dc2626', icon:'fa-arrow-circle-down', bg:'#fef2f2'},
      {label:'Utilidad Bruta',      val:dat.utilidad,      color:'#2563eb', icon:'fa-chart-line',        bg:'#eff6ff'},
      {label:'IGV Cobrado',         val:dat.igvTotal,      color:'#d97706', icon:'fa-percent',           bg:'#fffbeb'},
    ].forEach(function(f) {
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--gray-100);">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:34px;height:34px;border-radius:9px;background:'+f.bg+';color:'+f.color+';display:flex;align-items:center;justify-content:center;"><i class="fas '+f.icon+'" style="font-size:13px;"></i></div>' +
          '<span style="font-size:13px;color:var(--gray-700);">'+f.label+'</span>' +
        '</div>' +
        '<strong style="font-size:15px;color:'+f.color+';">S/ '+f.val.toFixed(2)+'</strong>' +
      '</div>';
    });
    html += '<div style="margin-top:14px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">' +
        '<span style="color:var(--gray-500);">Margen de Utilidad</span>' +
        '<span style="font-weight:800;color:#16a34a;">'+dat.margen.toFixed(1)+'%</span>' +
      '</div>' +
      '<div style="height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden;">' +
        '<div style="height:100%;width:'+Math.min(100,Math.max(0,dat.margen))+'%;background:linear-gradient(90deg,#16a34a,#4ade80);border-radius:4px;transition:width 0.5s;"></div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--gray-400);margin-top:4px;"><span>0%</span><span>100%</span></div>' +
    '</div></div></div>';

    // Cuentas por cobrar
    var ccPend  = (DB.cuentasCorriente||[]).filter(function(c){return c.estado!=='PAGADO';});
    var ccTotal = ccPend.reduce(function(s,c){return s+(c.saldo||0);},0);
    var ccVenc  = ccPend.filter(function(c){return c.vencimiento<hoyStr;}).length;

    html += '<div class="card">' +
      '<div style="padding:14px 18px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:800;"><i class="fas fa-hand-holding-usd" style="color:#dc2626;margin-right:6px;"></i>Cuentas por Cobrar</div>' +
          '<div style="font-size:11px;color:var(--gray-400);margin-top:1px;">'+ccPend.length+' pendientes</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:16px 18px;">' +
        (ccPend.length===0 ?
          '<div style="text-align:center;padding:24px;color:var(--gray-400);"><i class="fas fa-check-circle" style="font-size:36px;color:#16a34a;display:block;margin-bottom:10px;"></i>Sin cuentas pendientes</div>' :
          '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">' +
            '<div style="padding:12px;background:#fef2f2;border-radius:10px;text-align:center;"><div style="font-size:18px;font-weight:900;color:#dc2626;">S/ '+ccTotal.toFixed(0)+'</div><div style="font-size:10px;color:var(--gray-500);margin-top:2px;">Deuda Total</div></div>' +
            '<div style="padding:12px;background:#fffbeb;border-radius:10px;text-align:center;"><div style="font-size:18px;font-weight:900;color:#d97706;">'+ccPend.length+'</div><div style="font-size:10px;color:var(--gray-500);margin-top:2px;">Pendientes</div></div>' +
            '<div style="padding:12px;background:'+(ccVenc>0?'#fef2f2':'#f0fdf4')+';border-radius:10px;text-align:center;"><div style="font-size:18px;font-weight:900;color:'+(ccVenc>0?'#dc2626':'#16a34a')+';">'+ccVenc+'</div><div style="font-size:10px;color:var(--gray-500);margin-top:2px;">Vencidas</div></div>' +
          '</div>' +
          ccPend.slice(0,4).map(function(c) {
            var cli = (DB.clientes||[]).find(function(x){return x.id===c.cliente_id;});
            var venc = c.vencimiento < hoyStr;
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--gray-100);">' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+(cli?cli.nombre.substring(0,25):'N/A')+'</div>' +
                '<div style="font-size:10px;color:'+(venc?'#dc2626':'var(--gray-400)')+';">Vence: '+c.vencimiento+'</div>' +
              '</div>' +
              '<strong style="color:#dc2626;font-size:14px;flex-shrink:0;">S/ '+(c.saldo||0).toFixed(2)+'</strong>' +
            '</div>';
          }).join('')
        ) +
      '</div></div>';

    html += '</div>'; // fin fila final

    return html;
  },

  // ──────────────────────────────────────────────────────
  // DATOS
  // ──────────────────────────────────────────────────────
  _calcularDatos() {
    var hoyStr  = this._fechaLocal(new Date());
    var dias    = this.periodo==='mes' ? 30 : parseInt(this.periodo);
    var dInicio = new Date(); dInicio.setDate(dInicio.getDate()-dias);
    var iniStr  = this._fechaLocal(dInicio);

    var vPer = DB.ventas.filter(function(v){return v.fecha>=iniStr&&v.fecha<=hoyStr&&v.estado!=='ANULADO';});
    var vHoy = DB.ventas.filter(function(v){return v.fecha===hoyStr&&v.estado!=='ANULADO';});

    var totalPeriodo = vPer.reduce(function(s,v){return s+v.total;},0);
    var totalHoy     = vHoy.reduce(function(s,v){return s+v.total;},0);
    var cantPeriodo  = vPer.length;
    var cantHoy      = vHoy.length;
    var ticketProm   = cantPeriodo>0 ? totalPeriodo/cantPeriodo : 0;

    var utilidad = 0;
    vPer.forEach(function(v){
      (v.items||[]).forEach(function(item){
        var p = DB.productos.find(function(x){return x.id===item.prod_id;});
        if(p) utilidad += ((p.precio_venta||0)-(p.precio_compra||0))*(item.qty||item.cantidad||1);
      });
    });

    var margen       = totalPeriodo>0 ? (utilidad/totalPeriodo)*100 : 0;
    var igvTotal     = vPer.reduce(function(s,v){return s+(v.igv||0);},0);
    var totalCompras = (DB.compras||[]).reduce(function(s,c){return s+c.total;},0);
    var sinStock     = DB.productos.filter(function(p){return (p.stock||0)===0;}).length;
    var stockBajo    = DB.productos.filter(function(p){return (p.stock||0)>0&&(p.stock||0)<=10;}).length;

    return {totalPeriodo,totalHoy,cantPeriodo,cantHoy,ticketProm,utilidad,margen,igvTotal,totalCompras,sinStock,stockBajo,alertasTotal:sinStock+stockBajo};
  },

  _calcularDatosAnteriores() {
    var dias   = this.periodo==='mes' ? 30 : parseInt(this.periodo);
    var dFin   = new Date(); dFin.setDate(dFin.getDate()-dias);
    var dIni   = new Date(); dIni.setDate(dIni.getDate()-dias*2);
    var finStr = this._fechaLocal(dFin);
    var iniStr = this._fechaLocal(dIni);
    var hoyStr = this._fechaLocal(new Date());
    var ayer   = new Date(); ayer.setDate(ayer.getDate()-1);
    var ayerStr= this._fechaLocal(ayer);

    var vAnt = DB.ventas.filter(function(v){return v.fecha>=iniStr&&v.fecha<=finStr;});
    var vAyer= DB.ventas.filter(function(v){return v.fecha===ayerStr;});
    var tAnt = vAnt.reduce(function(s,v){return s+v.total;},0);
    var tAyer= vAyer.reduce(function(s,v){return s+v.total;},0);
    var cAnt = vAnt.length;
    var tProm= cAnt>0?tAnt/cAnt:0;

    var util=0;
    vAnt.forEach(function(v){(v.items||[]).forEach(function(item){var p=DB.productos.find(function(x){return x.id===item.prod_id;});if(p)util+=((p.precio_venta||0)-(p.precio_compra||0))*(item.qty||item.cantidad||1);});});

    return {totalPeriodo:tAnt,totalHoy:tAyer,ticketProm:tProm,utilidad:util};
  },

  // ──────────────────────────────────────────────────────
  // GRÁFICAS
  // ──────────────────────────────────────────────────────
  initCharts() {
    if (typeof Chart==='undefined') return;
    Object.keys(this._charts).forEach(function(k){try{InicioModule._charts[k].destroy();}catch(e){}});
    this._charts = {};

    var diasArr = this._diasPeriodo();
    var labels  = diasArr.map(function(d){return d.label;});
    var fechas  = diasArr.map(function(d){return d.fecha;});

    var C = { blue:'#2563eb', green:'#16a34a', orange:'#ea580c', purple:'#7c3aed', red:'#dc2626', gold:'#d97706', cyan:'#0891b2' };

    function sumasPorDia(filtro) {
      return fechas.map(function(f){
        var t=0; DB.ventas.forEach(function(v){if(v.fecha===f&&filtro(v))t+=v.total;}); return parseFloat(t.toFixed(2));
      });
    }

    var optsLine = {
      responsive:true, maintainAspectRatio:true,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:function(c){return ' S/ '+c.raw.toFixed(2);}}} },
      scales:{
        x:{grid:{display:false},ticks:{font:{size:10}}},
        y:{grid:{color:'rgba(148,163,184,0.1)'},beginAtZero:true,ticks:{font:{size:10},callback:function(v){return 'S/'+v;}}}
      }
    };

    // 1. BOL/FAC — gráfica de línea con gradiente
    var dataBOL = sumasPorDia(function(v){return v.tipo==='BOL'||v.tipo==='FAC';});
    var c1 = document.getElementById('chartBOL');
    if(c1){
      this._charts.bol = new Chart(c1,{
        type:'line',
        data:{labels,datasets:[{
          label:'Boletas/Facturas', data:dataBOL,
          borderColor:C.blue, backgroundColor:C.blue+'22',
          borderWidth:2.5, fill:true, tension:0.4,
          pointBackgroundColor:C.blue, pointRadius:3, pointHoverRadius:6
        }]},
        options:optsLine
      });
    }

    // 2. NV — gráfica de línea
    var dataNV = sumasPorDia(function(v){return v.tipo==='N. VENTA';});
    var c2 = document.getElementById('chartNV');
    if(c2){
      this._charts.nv = new Chart(c2,{
        type:'line',
        data:{labels,datasets:[{
          label:'Notas de Venta', data:dataNV,
          borderColor:C.orange, backgroundColor:C.orange+'22',
          borderWidth:2.5, fill:true, tension:0.4,
          pointBackgroundColor:C.orange, pointRadius:3, pointHoverRadius:6
        }]},
        options:optsLine
      });
    }

    // 3. MÉTODOS DE PAGO — donut
    var metMap = {};
    DB.ventas.forEach(function(v){
      var m = (v.metodo_pago||'EFECTIVO').split('+')[0].trim().split('(')[0].trim()||'EFECTIVO';
      metMap[m] = (metMap[m]||0)+v.total;
    });
    var mL = Object.keys(metMap);
    var mD = mL.map(function(k){return parseFloat(metMap[k].toFixed(2));});
    var mC = [C.green,C.blue,C.purple,C.orange,C.red,C.gold,C.cyan];
    var c3 = document.getElementById('chartMetodosPago');
    if(c3&&mL.length){
      this._charts.metodos = new Chart(c3,{
        type:'doughnut',
        data:{labels:mL,datasets:[{data:mD,backgroundColor:mC.slice(0,mL.length),borderWidth:2,borderColor:'#fff'}]},
        options:{responsive:false,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return ' S/ '+c.raw.toFixed(2);}}}}}
      });
      var leg = document.getElementById('legendMetodos');
      if(leg) leg.innerHTML = mL.map(function(l,i){
        return '<div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;padding:3px 0;">' +
          '<div style="display:flex;align-items:center;gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:'+mC[i]+';display:inline-block;flex-shrink:0;"></span>' +
          '<span style="color:var(--gray-600);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;">'+l+'</span></div>' +
          '<strong style="flex-shrink:0;">S/ '+mD[i].toFixed(2)+'</strong></div>';
      }).join('');
    }

    // 4. TOP 6 PRODUCTOS — barras horizontales
    var pMap = {};
    DB.ventas.forEach(function(v){(v.items||[]).forEach(function(item){pMap[item.nombre]=(pMap[item.nombre]||0)+(item.total||0);});});
    var top = Object.entries(pMap).sort(function(a,b){return b[1]-a[1];}).slice(0,6);
    var c4  = document.getElementById('chartTopProductos');
    if(c4&&top.length){
      this._charts.productos = new Chart(c4,{
        type:'bar',
        data:{
          labels:top.map(function(p){var n=p[0];return n.length>22?n.substring(0,22)+'…':n;}),
          datasets:[{
            label:'S/',
            data:top.map(function(p){return parseFloat(p[1].toFixed(2));}),
            backgroundColor:[C.blue,C.green,C.purple,C.orange,C.red,C.gold].map(function(c){return c+'cc';}),
            borderRadius:6, borderSkipped:false
          }]
        },
        options:{
          indexAxis:'y', responsive:true, maintainAspectRatio:true,
          plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return ' S/ '+c.raw.toFixed(2);}}}},
          scales:{
            x:{grid:{color:'rgba(148,163,184,0.1)'},ticks:{font:{size:10},callback:function(v){return 'S/'+v;}},beginAtZero:true},
            y:{grid:{display:false},ticks:{font:{size:10}}}
          }
        }
      });
    }

    // 5. VENTAS POR CATEGORÍA — donut con leyenda
    var catMap = {};
    DB.ventas.forEach(function(v){
      (v.items||[]).forEach(function(item){
        var p = DB.productos.find(function(x){return x.id===item.prod_id;});
        var cat = p ? (p.categoria||'Otros') : 'Otros';
        catMap[cat] = (catMap[cat]||0)+(item.total||0);
      });
    });
    var catL = Object.keys(catMap);
    var catD = catL.map(function(k){return parseFloat(catMap[k].toFixed(2));});
    var catC = [C.blue,C.green,C.purple,C.orange,C.red,C.gold,C.cyan,'#14b8a6','#f43f5e','#8b5cf6'];
    var c5   = document.getElementById('chartCategorias');
    if(c5&&catL.length){
      this._charts.categorias = new Chart(c5,{
        type:'doughnut',
        data:{labels:catL,datasets:[{data:catD,backgroundColor:catC.slice(0,catL.length),borderWidth:2,borderColor:'#fff'}]},
        options:{
          responsive:true, maintainAspectRatio:true, cutout:'50%',
          plugins:{
            legend:{
              position:'right',
              labels:{font:{size:10},padding:8,
                generateLabels:function(chart){
                  return chart.data.labels.map(function(l,i){
                    return {text:l+'  S/'+catD[i].toFixed(0),fillStyle:chart.data.datasets[0].backgroundColor[i],strokeStyle:'#fff',lineWidth:2,index:i};
                  });
                }
              }
            },
            tooltip:{callbacks:{label:function(c){return ' S/ '+c.raw.toFixed(2);}}}
          }
        }
      });
    }
  },

  setPeriodo(p) { this.periodo=p; App.renderPage(); }
};
