// ============================================================
// MÓDULO: INICIO — Dashboard con gráficas reales
// ============================================================

const InicioModule = {
  periodo: '7',
  _charts: {},

  // Fecha local SIN problemas de zona horaria
  _fechaLocal(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  },

  // Genera array de {fecha, label} para el período
  _diasPeriodo() {
    var dias = this.periodo === 'mes' ? 30 : parseInt(this.periodo);
    var result = [];
    for (var i = dias-1; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      result.push({
        fecha: this._fechaLocal(d),
        label: d.toLocaleDateString('es-PE',{day:'2-digit',month:'short'})
      });
    }
    return result;
  },

  render() {
    App.setTabs2('Panel Principal', '');
    var dat = this._calcularDatos();
    var dias = this._diasPeriodo();

    // ── Pre-calcular datos por tipo para mini-KPIs en los cards de gráfica ──
    var totalBOL = 0, cantBOL = 0, totalNV = 0, cantNV = 0;
    dias.forEach(function(d) {
      DB.ventas.forEach(function(v) {
        if (v.fecha === d.fecha) {
          if (v.tipo === 'BOL' || v.tipo === 'FAC') { totalBOL += v.total; cantBOL++; }
          if (v.tipo === 'N. VENTA') { totalNV += v.total; cantNV++; }
        }
      });
    });

    var html = '';

    // ── BIENVENIDA + SELECTOR ──
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;">' +
      '<div>' +
        '<h2 style="font-size:22px;font-weight:800;color:var(--gray-900);margin:0;">👋 Bienvenido, ' +
          (DB.usuarioActual ? DB.usuarioActual.nombre.split(' ')[0] : 'Freddy') + '</h2>' +
        '<p style="color:var(--gray-500);font-size:13px;margin:4px 0 0;">' +
          new Date().toLocaleDateString('es-PE',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) +
          ' &nbsp;•&nbsp; ' + DB.empresa.nombre + '</p>' +
      '</div>' +
      '<div style="display:flex;background:var(--gray-100);border-radius:10px;padding:4px;gap:2px;">' +
        [['7','7 días'],['30','30 días'],['mes','Este mes']].map(function(item) {
          var activo = InicioModule.periodo === item[0];
          return '<button onclick="InicioModule.setPeriodo(\'' + item[0] + '\')" style="padding:7px 16px;border-radius:8px;' +
            'font-size:12px;font-weight:700;border:none;cursor:pointer;' +
            'background:' + (activo?'white':'transparent') + ';' +
            'color:' + (activo?'var(--accent)':'var(--gray-500)') + ';' +
            'box-shadow:' + (activo?'0 1px 4px rgba(0,0,0,0.1)':'none') + ';transition:all 0.2s;">' +
            item[1] + '</button>';
        }).join('') +
      '</div></div>';

    // ── FILA 1: 5 KPI CARDS ──
    html += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px;">';
    var kpis = [
      { bg:'linear-gradient(135deg,#1e3a5f,#2563eb)', icon:'fa-dollar-sign',
        label:'Ventas ' + (this.periodo==='mes'?'del Mes':this.periodo+' días'),
        val:'S/ '+dat.totalPeriodo.toFixed(2), sub:dat.cantPeriodo+' comprobantes' },
      { bg:'linear-gradient(135deg,#065f46,#16a34a)', icon:'fa-clock',
        label:'Ventas de Hoy', val:'S/ '+dat.totalHoy.toFixed(2), sub:dat.cantHoy+' ventas hoy' },
      { bg:'linear-gradient(135deg,#7c2d12,#ea580c)', icon:'fa-receipt',
        label:'Ticket Promedio', val:'S/ '+dat.ticketProm.toFixed(2), sub:'Por comprobante' },
      { bg:'linear-gradient(135deg,#4a1d96,#7c3aed)', icon:'fa-chart-line',
        label:'Utilidad Bruta', val:'S/ '+dat.utilidad.toFixed(2), sub:dat.margen.toFixed(1)+'% de margen' },
      { bg:'linear-gradient(135deg,#7f1d1d,#dc2626)', icon:'fa-exclamation-triangle',
        label:'Alertas Stock', val:String(dat.alertasTotal), sub:dat.sinStock+' agotados · '+dat.stockBajo+' bajos',
        click:' onclick="App.navigate(\'inventario\')"', cursor:'cursor:pointer;' }
    ];
    kpis.forEach(function(k) {
      html += '<div class="kpi-card" style="background:'+k.bg+';'+( k.cursor||'') + '"' + (k.click||'') + '>' +
        '<div class="kpi-icon"><i class="fas ' + k.icon + '"></i></div>' +
        '<div class="kpi-label">' + k.label + '</div>' +
        '<div class="kpi-value">' + k.val + '</div>' +
        '<div class="kpi-sub">' + k.sub + '</div>' +
      '</div>';
    });
    html += '</div>';

    // ── FILA 2: BOL/FAC | NV | MÉTODOS DE PAGO ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 320px;gap:16px;margin-bottom:16px;">';

    // Gráfica BOL + FAC
    html += '<div class="card">' +
      '<div class="card-header">' +
        '<div><span class="card-title"><i class="fas fa-file-invoice" style="color:#2563eb;margin-right:6px;"></i>Boletas y Facturas</span></div>' +
        '<span style="font-size:13px;font-weight:800;color:#2563eb;">S/ '+totalBOL.toFixed(2)+' · '+cantBOL+' docs</span>' +
      '</div>' +
      '<div class="card-body" style="padding:14px 18px;"><canvas id="chartBOL" height="120"></canvas></div>' +
    '</div>';

    // Gráfica NV
    html += '<div class="card">' +
      '<div class="card-header">' +
        '<div><span class="card-title"><i class="fas fa-file-alt" style="color:#ea580c;margin-right:6px;"></i>Notas de Venta</span></div>' +
        '<span style="font-size:13px;font-weight:800;color:#ea580c;">S/ '+totalNV.toFixed(2)+' · '+cantNV+' docs</span>' +
      '</div>' +
      '<div class="card-body" style="padding:14px 18px;"><canvas id="chartNV" height="120"></canvas></div>' +
    '</div>';

    // Donut Métodos de Pago
    html += '<div class="card">' +
      '<div class="card-header"><span class="card-title"><i class="fas fa-credit-card" style="color:#7c3aed;margin-right:6px;"></i>Métodos de Pago</span></div>' +
      '<div class="card-body" style="padding:12px;display:flex;flex-direction:column;align-items:center;">' +
        '<canvas id="chartMetodosPago" height="150" width="150" style="max-width:150px;"></canvas>' +
        '<div id="legendMetodos" style="margin-top:10px;width:100%;"></div>' +
      '</div></div>';

    html += '</div>'; // fin fila 2

    // ── FILA 3: TOP PRODUCTOS + CATEGORÍAS ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">';
    html += '<div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-trophy" style="color:#d97706;margin-right:6px;"></i>Top 6 Productos Vendidos</span></div>' +
      '<div class="card-body" style="padding:14px 18px;"><canvas id="chartTopProductos" height="180"></canvas></div></div>';
    html += '<div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-tags" style="color:#16a34a;margin-right:6px;"></i>Ventas por Categoría</span></div>' +
      '<div class="card-body" style="padding:14px 18px;"><canvas id="chartCategorias" height="180"></canvas></div></div>';
    html += '</div>';

    // ── FILA 4: ÚLTIMAS VENTAS + ALERTAS STOCK + AGENDA ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px;">';

    // Últimas ventas
    html += '<div class="card"><div class="card-header"><span class="card-title">Últimas Ventas</span>' +
      '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'ventas\')">Ver todas</button></div>';
    DB.ventas.slice(0,6).forEach(function(v) {
      var c = DB.clientes.find(function(x){ return x.id===v.cliente_id; });
      var nombre = c ? c.nombre.substring(0,22) : 'Público General';
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--gray-100);">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:#eff6ff;color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas fa-file-invoice"></i></div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + nombre + '</div>' +
          '<div style="font-size:11px;color:var(--gray-400);">' + v.serie + '-' + v.numero + ' · ' + v.fecha + '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-size:13px;font-weight:800;">S/ ' + v.total.toFixed(2) + '</div>' +
          '<div style="font-size:10px;padding:1px 6px;border-radius:4px;font-weight:700;background:' +
            (v.estado==='ACEPTADO'?'#dcfce7':'#fee2e2') + ';color:' + (v.estado==='ACEPTADO'?'#16a34a':'#dc2626') + ';">' +
            (v.estado==='ACEPTADO'?'ACEPT.':'N.ENV.') + '</div>' +
        '</div></div>';
    });
    html += '</div>';

    // Alertas stock
    html += '<div class="card"><div class="card-header">' +
      '<span class="card-title" style="color:var(--danger);"><i class="fas fa-exclamation-circle"></i> Alertas Stock</span>' +
      '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'inventario\')">Inventario</button></div>';
    var alertas = DB.productos.filter(function(p){ return p.stock<=10; });
    if (!alertas.length) {
      html += '<div style="text-align:center;padding:30px;color:var(--gray-400);"><i class="fas fa-check-circle" style="font-size:28px;color:#16a34a;display:block;margin-bottom:8px;"></i>Sin alertas de stock</div>';
    } else {
      alertas.slice(0,6).forEach(function(p) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--gray-100);">' +
          '<div style="width:36px;height:36px;border-radius:50%;background:' + (p.stock===0?'#fef2f2':'#fffbeb') + ';' +
            'color:' + (p.stock===0?'#dc2626':'#d97706') + ';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">' +
            '<i class="fas ' + (p.stock===0?'fa-times-circle':'fa-exclamation-circle') + '"></i></div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + p.nombre + '</div>' +
            '<div style="font-size:11px;color:var(--gray-400);">' + p.categoria + '</div>' +
          '</div>' +
          '<span style="padding:3px 8px;border-radius:20px;font-size:11px;font-weight:800;flex-shrink:0;' +
            'background:' + (p.stock===0?'#fef2f2':'#fffbeb') + ';color:' + (p.stock===0?'#dc2626':'#d97706') + ';">' +
            (p.stock===0?'AGOTADO':p.stock+' uds') + '</span></div>';
      });
    }
    html += '</div>';

    // Agenda
    html += '<div class="card"><div class="card-header">' +
      '<span class="card-title"><i class="fas fa-calendar-alt" style="color:#2563eb;margin-right:4px;"></i>Próximos Eventos</span>' +
      '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'agenda\')">Ver agenda</button></div>';
    var hoyStr = this._fechaLocal(new Date());
    var proximos = (DB.agenda||[]).filter(function(a){ return !a.completado; })
      .sort(function(a,b){ return a.fecha.localeCompare(b.fecha); }).slice(0,6);
    var coloresAg = {pago:'#16a34a',reunion:'#2563eb',vencimiento:'#dc2626',recordatorio:'#d97706'};
    var emojisAg  = {pago:'💰',reunion:'🤝',vencimiento:'⏰',recordatorio:'📝'};
    if (!proximos.length) {
      html += '<div style="text-align:center;padding:30px;color:var(--gray-400);"><i class="fas fa-calendar-check" style="font-size:28px;display:block;margin-bottom:8px;"></i>Sin eventos próximos</div>';
    }
    proximos.forEach(function(a) {
      var vencido = a.fecha < hoyStr;
      html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--gray-100);">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:' + (coloresAg[a.tipo]||'#6b7280') + '22;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">' +
          (emojisAg[a.tipo]||'📅') + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + a.titulo + '</div>' +
          '<div style="font-size:11px;color:' + (vencido?'#dc2626':'var(--gray-400)') + ';">' + a.fecha + ' ' + a.hora + '</div>' +
        '</div>' +
        (vencido?'<span style="background:#fef2f2;color:#dc2626;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700;flex-shrink:0;">VENCIDO</span>':'') +
      '</div>';
    });
    html += '</div>';

    html += '</div>'; // fin fila 4

    // ── FILA 5: RESUMEN FINANCIERO + CUENTAS CORRIENTES ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';

    // Resumen financiero
    html += '<div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-balance-scale" style="color:#7c3aed;margin-right:6px;"></i>Resumen Financiero</span></div>' +
      '<div class="card-body">';
    var filas = [
      { label:'Ingresos (Ventas)', val:dat.totalPeriodo, color:'#16a34a', icon:'fa-arrow-circle-up', bg:'#f0fdf4' },
      { label:'Egresos (Compras)', val:dat.totalCompras,  color:'#dc2626', icon:'fa-arrow-circle-down', bg:'#fef2f2' },
      { label:'Utilidad Bruta',    val:dat.utilidad,      color:'#2563eb', icon:'fa-chart-line', bg:'#eff6ff' },
      { label:'IGV Cobrado',       val:dat.igvTotal,      color:'#d97706', icon:'fa-percent', bg:'#fffbeb' }
    ];
    filas.forEach(function(f) {
      html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--gray-100);">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="width:36px;height:36px;border-radius:8px;background:'+f.bg+';color:'+f.color+';display:flex;align-items:center;justify-content:center;"><i class="fas '+f.icon+'"></i></div>' +
          '<span style="font-size:13px;color:var(--gray-700);">' + f.label + '</span>' +
        '</div>' +
        '<strong style="font-size:15px;color:'+f.color+';">S/ ' + f.val.toFixed(2) + '</strong>' +
      '</div>';
    });
    html += '<div style="margin-top:12px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--gray-500);margin-bottom:6px;">' +
        '<span>Margen de Utilidad</span><span style="font-weight:700;color:var(--success);">' + dat.margen.toFixed(1) + '%</span>' +
      '</div>' +
      '<div style="height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden;">' +
        '<div style="height:100%;width:' + Math.min(100,Math.max(0,dat.margen)) + '%;background:linear-gradient(90deg,#16a34a,#4ade80);border-radius:4px;"></div>' +
      '</div></div>';
    html += '</div></div>';

    // Cuentas corrientes
    html += '<div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-hand-holding-usd" style="color:#dc2626;margin-right:6px;"></i>Cuentas por Cobrar</span>' +
      '<button class="btn btn-outline btn-sm" onclick="App.navigate(\'cuentacorriente\')">Ver todas</button></div>' +
      '<div class="card-body">';
    var ccPend = (DB.cuentasCorriente||[]).filter(function(c){ return c.estado!=='PAGADO'; });
    var ccTotal = ccPend.reduce(function(s,c){ return s+c.saldo; }, 0);
    var ccVenc  = ccPend.filter(function(c){ return c.vencimiento < hoyStr; }).length;
    if (!ccPend.length) {
      html += '<div style="text-align:center;padding:20px;color:var(--gray-400);"><i class="fas fa-check-circle" style="font-size:36px;color:#16a34a;display:block;margin-bottom:8px;"></i>Sin cuentas pendientes</div>';
    } else {
      html += '<div style="display:flex;gap:12px;margin-bottom:16px;">' +
        '<div style="flex:1;background:#fef2f2;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:20px;font-weight:800;color:#dc2626;">S/ '+ccTotal.toFixed(2)+'</div><div style="font-size:11px;color:var(--gray-500);margin-top:2px;">Deuda Total</div></div>' +
        '<div style="flex:1;background:#fffbeb;border-radius:10px;padding:14px;text-align:center;"><div style="font-size:20px;font-weight:800;color:#d97706;">'+ccPend.length+'</div><div style="font-size:11px;color:var(--gray-500);margin-top:2px;">Pendientes</div></div>' +
        '<div style="flex:1;background:'+(ccVenc>0?'#fef2f2':'#f0fdf4')+'border-radius:10px;padding:14px;text-align:center;"><div style="font-size:20px;font-weight:800;color:'+(ccVenc>0?'#dc2626':'#16a34a')+';">'+ccVenc+'</div><div style="font-size:11px;color:var(--gray-500);margin-top:2px;">Vencidas</div></div>' +
      '</div>';
      ccPend.slice(0,3).forEach(function(c) {
        var cli = DB.clientes.find(function(x){ return x.id===c.cliente_id; });
        var venc = c.vencimiento < hoyStr;
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--gray-100);">' +
          '<div><div style="font-size:12px;font-weight:700;">' + (cli?cli.nombre.substring(0,25):'N/A') + '</div>' +
            '<div style="font-size:11px;color:'+(venc?'#dc2626':'var(--gray-400)')+';">Vence: '+c.vencimiento+'</div></div>' +
          '<strong style="color:var(--danger);">S/ '+c.saldo.toFixed(2)+'</strong>' +
        '</div>';
      });
    }
    html += '</div></div>';
    html += '</div>'; // fin fila 5

    return html;
  },

  // ───── DATOS ─────
  _calcularDatos() {
    var hoyStr   = this._fechaLocal(new Date());
    var dias     = this.periodo === 'mes' ? 30 : parseInt(this.periodo);
    var dInicio  = new Date(); dInicio.setDate(dInicio.getDate() - dias);
    var inicioStr = this._fechaLocal(dInicio);

    var vPeriodo = DB.ventas.filter(function(v){ return v.fecha >= inicioStr && v.fecha <= hoyStr; });
    var vHoy     = DB.ventas.filter(function(v){ return v.fecha === hoyStr; });

    var totalPeriodo = vPeriodo.reduce(function(s,v){ return s+v.total; }, 0);
    var totalHoy     = vHoy.reduce(function(s,v){ return s+v.total; }, 0);
    var cantPeriodo  = vPeriodo.length;
    var cantHoy      = vHoy.length;
    var ticketProm   = cantPeriodo > 0 ? totalPeriodo / cantPeriodo : 0;

    var utilidad = 0;
    vPeriodo.forEach(function(v) {
      v.items.forEach(function(item) {
        var p = DB.productos.find(function(x){ return x.id === item.prod_id; });
        if (p) utilidad += (p.precio_venta - p.precio_compra) * item.qty;
      });
    });
    var margen = totalPeriodo > 0 ? (utilidad / totalPeriodo) * 100 : 0;
    var igvTotal    = vPeriodo.reduce(function(s,v){ return s + (v.igv||0); }, 0);
    var totalCompras = DB.compras.reduce(function(s,c){ return s+c.total; }, 0);
    var sinStock  = DB.productos.filter(function(p){ return p.stock===0; }).length;
    var stockBajo = DB.productos.filter(function(p){ return p.stock>0 && p.stock<=10; }).length;

    return { totalPeriodo:totalPeriodo, totalHoy:totalHoy, cantPeriodo:cantPeriodo,
             cantHoy:cantHoy, ticketProm:ticketProm, utilidad:utilidad, margen:margen,
             igvTotal:igvTotal, totalCompras:totalCompras,
             sinStock:sinStock, stockBajo:stockBajo, alertasTotal:sinStock+stockBajo };
  },

  // ───── GRÁFICAS ─────
  initCharts() {
    if (typeof Chart === 'undefined') return;

    // Destruir gráficas anteriores
    Object.keys(this._charts).forEach(function(k) {
      try { InicioModule._charts[k].destroy(); } catch(e) {}
    });
    this._charts = {};

    var self     = this;
    var diasArr  = this._diasPeriodo();
    var labels   = diasArr.map(function(d){ return d.label; });
    var fechas   = diasArr.map(function(d){ return d.fecha; });

    // Colores
    var BLUE   = '#2563eb';
    var GREEN  = '#16a34a';
    var ORANGE = '#ea580c';
    var PURPLE = '#7c3aed';
    var RED    = '#dc2626';
    var GOLD   = '#d97706';
    var CYAN   = '#0891b2';

    // ── Función helper: suma ventas por fecha y tipo ──
    function sumaVentasPorDia(tiposFn) {
      return fechas.map(function(f) {
        var tot = 0;
        DB.ventas.forEach(function(v) {
          if (v.fecha === f && tiposFn(v)) tot += v.total;
        });
        return parseFloat(tot.toFixed(2));
      });
    }

    var chartOpsBase = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function(ctx) { return ' S/ ' + ctx.raw.toFixed(2); } } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: {
          grid: { color: '#f1f5f9' },
          beginAtZero: true,
          ticks: {
            font: { size: 10 },
            callback: function(v) { return 'S/' + v; }
          }
        }
      }
    };

    // ── 1. BOLETAS + FACTURAS ──
    var dataBOL = sumaVentasPorDia(function(v){ return v.tipo === 'BOL' || v.tipo === 'FAC'; });
    var ctx1 = document.getElementById('chartBOL');
    if (ctx1) {
      this._charts.bol = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Boletas/Facturas',
            data: dataBOL,
            backgroundColor: BLUE + 'bb',
            borderColor: BLUE,
            borderWidth: 1,
            borderRadius: 5,
            borderSkipped: false
          }]
        },
        options: chartOpsBase
      });
    }

    // ── 2. NOTAS DE VENTA ──
    var dataNV = sumaVentasPorDia(function(v){ return v.tipo === 'N. VENTA'; });
    var ctx2 = document.getElementById('chartNV');
    if (ctx2) {
      this._charts.nv = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Notas de Venta',
            data: dataNV,
            backgroundColor: ORANGE + 'bb',
            borderColor: ORANGE,
            borderWidth: 1,
            borderRadius: 5,
            borderSkipped: false
          }]
        },
        options: chartOpsBase
      });
    }

    // ── 3. MÉTODOS DE PAGO (donut) ──
    var metodosMap = {};
    DB.ventas.forEach(function(v) {
      var m = v.metodo_pago || 'EFECTIVO';
      metodosMap[m] = (metodosMap[m]||0) + v.total;
    });
    var mLabels = Object.keys(metodosMap);
    var mData   = mLabels.map(function(k){ return parseFloat(metodosMap[k].toFixed(2)); });
    var mColors = [GREEN, BLUE, PURPLE, ORANGE, RED, GOLD];
    var ctx3 = document.getElementById('chartMetodosPago');
    if (ctx3 && mLabels.length) {
      this._charts.metodos = new Chart(ctx3, {
        type: 'doughnut',
        data: { labels: mLabels, datasets:[{
          data: mData,
          backgroundColor: mColors.slice(0, mLabels.length),
          borderWidth: 2, borderColor: '#fff'
        }]},
        options: {
          responsive: false, cutout: '62%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function(ctx){ return ' S/ ' + ctx.raw.toFixed(2); } } }
          }
        }
      });
      // Leyenda manual
      var leg = document.getElementById('legendMetodos');
      if (leg) {
        leg.innerHTML = mLabels.map(function(l, i) {
          return '<div style="display:flex;align-items:center;justify-content:space-between;font-size:11px;padding:3px 0;">' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<span style="width:10px;height:10px;border-radius:50%;background:' + mColors[i] + ';display:inline-block;"></span>' +
              '<span style="color:var(--gray-600);">' + l + '</span>' +
            '</div>' +
            '<strong>S/ ' + mData[i].toFixed(2) + '</strong>' +
          '</div>';
        }).join('');
      }
    }

    // ── 4. TOP 6 PRODUCTOS (barras horizontales) ──
    var prodMap = {};
    DB.ventas.forEach(function(v) {
      v.items.forEach(function(item) {
        prodMap[item.nombre] = (prodMap[item.nombre]||0) + item.total;
      });
    });
    var topProds = Object.entries(prodMap).sort(function(a,b){ return b[1]-a[1]; }).slice(0,6);
    var ctx4 = document.getElementById('chartTopProductos');
    if (ctx4 && topProds.length) {
      this._charts.productos = new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: topProds.map(function(item){ var n=item[0]; return n.length>20?n.substring(0,20)+'…':n; }),
          datasets: [{
            label: 'Ventas S/',
            data: topProds.map(function(item){ return parseFloat(item[1].toFixed(2)); }),
            backgroundColor: [BLUE,GREEN,PURPLE,ORANGE,RED,GOLD].map(function(c){ return c+'bb'; }),
            borderRadius: 5, borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: true,
          plugins: { legend:{display:false}, tooltip:{callbacks:{label:function(ctx){return ' S/ '+ctx.raw.toFixed(2);}}} },
          scales: {
            x: { grid:{color:'#f1f5f9'}, ticks:{font:{size:10}, callback:function(v){return 'S/'+v;}}, beginAtZero:true },
            y: { grid:{display:false}, ticks:{font:{size:10}} }
          }
        }
      });
    }

    // ── 5. VENTAS POR CATEGORÍA (donut) ──
    var catMap = {};
    DB.ventas.forEach(function(v) {
      v.items.forEach(function(item) {
        var p = DB.productos.find(function(x){ return x.id===item.prod_id; });
        var cat = p ? p.categoria : 'Otros';
        catMap[cat] = (catMap[cat]||0) + item.total;
      });
    });
    var catLabels = Object.keys(catMap);
    var catData   = catLabels.map(function(k){ return parseFloat(catMap[k].toFixed(2)); });
    var catColors = [BLUE,GREEN,PURPLE,ORANGE,RED,GOLD,CYAN,'#14b8a6'];
    var ctx5 = document.getElementById('chartCategorias');
    if (ctx5 && catLabels.length) {
      this._charts.categorias = new Chart(ctx5, {
        type: 'doughnut',
        data: { labels: catLabels, datasets:[{
          data: catData,
          backgroundColor: catColors.slice(0, catLabels.length),
          borderWidth: 2, borderColor: '#fff'
        }]},
        options: {
          responsive: true, maintainAspectRatio: true, cutout: '50%',
          plugins: {
            legend: {
              position: 'right',
              labels: { font:{size:11}, padding:10,
                generateLabels: function(chart) {
                  return chart.data.labels.map(function(l,i){
                    return { text: l + '  S/'+catData[i].toFixed(0),
                      fillStyle: chart.data.datasets[0].backgroundColor[i],
                      strokeStyle:'#fff', lineWidth:2, index:i };
                  });
                }
              }
            },
            tooltip: { callbacks: { label: function(ctx){ return ' S/ '+ctx.raw.toFixed(2); } } }
          }
        }
      });
    }
  },

  setPeriodo(p) {
    this.periodo = p;
    App.renderPage();
  }
};