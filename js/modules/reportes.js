// ============================================================
// MÓDULO: REPORTES Y ESTADÍSTICAS — Versión Profesional
// ============================================================

const ReportesModule = {

  _periodo:    'mes',   // hoy | semana | mes | personalizado
  _fechaDesde: '',
  _fechaHasta: '',
  _vistaActual: 'dashboard', // dashboard | ventas | inventario | clientes | metodos | categorias

  // ─── HELPERS ───
  _fechaLocal() {
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _fechaMes() {
    var d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-01';
  },
  _fechaSemana() {
    var d=new Date(); d.setDate(d.getDate()-6);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  },
  _getDesde() {
    if(this._periodo==='hoy')    return this._fechaLocal();
    if(this._periodo==='semana') return this._fechaSemana();
    if(this._periodo==='mes')    return this._fechaMes();
    return this._fechaDesde||this._fechaMes();
  },
  _getHasta() {
    if(this._periodo!=='personalizado') return this._fechaLocal();
    return this._fechaHasta||this._fechaLocal();
  },
  _ventasFiltradas() {
    var desde=this._getDesde(), hasta=this._getHasta();
    return (DB.ventas||[]).filter(function(v){
      return v.fecha>=desde && v.fecha<=hasta && v.estado!=='ANULADO';
    });
  },
  _formatFecha(f) {
    if(!f)return''; var p=f.split('-'); return p[2]+'/'+p[1]+'/'+p[0];
  },
  _moneda(n) { return 'S/ '+(n||0).toFixed(2); },

  // ─── RENDER PRINCIPAL ───
  render() {
    App.setTabs2('Reportes y Estadísticas','REPORTES');
    if(this._vistaActual==='ventas')      return this.renderReporteVentas();
    if(this._vistaActual==='inventario')  return this.renderReporteInventario();
    if(this._vistaActual==='clientes')    return this.renderReporteClientes();
    if(this._vistaActual==='metodos')     return this.renderReporteMetodos();
    if(this._vistaActual==='categorias')  return this.renderReporteCategorias();
    return this.renderDashboard();
  },

  // ─── DASHBOARD ───
  renderDashboard() {
    var self    = this;
    var ventas  = this._ventasFiltradas();
    var hoy     = this._fechaLocal();
    var vHoy    = (DB.ventas||[]).filter(function(v){return v.fecha===hoy&&v.estado!=='ANULADO';});
    var tTotal  = ventas.reduce(function(s,v){return s+v.total;},0);
    var tHoy    = vHoy.reduce(function(s,v){return s+v.total;},0);
    var nVentas = ventas.length;
    var ticketProm = nVentas>0?(tTotal/nVentas):0;

    // Utilidad estimada
    var utilidad = ventas.reduce(function(s,v){
      return s+(v.items||[]).reduce(function(ss,i){
        var p=(DB.productos||[]).find(function(x){return x.id===i.prod_id;});
        var costo=p?(p.precio_compra||0):0;
        return ss+(i.total-(costo*i.qty));
      },0);
    },0);

    // ── SELECTOR PERÍODO ──
    var periodos=[['hoy','Hoy'],['semana','7 días'],['mes','Este mes'],['personalizado','Personalizado']];
    var selectorPeriodo =
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        periodos.map(function(p){
          var act=self._periodo===p[0];
          return '<button onclick="ReportesModule._periodo=\''+p[0]+'\';App.renderPage();" style="padding:7px 16px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-600)')+';">'+p[1]+'</button>';
        }).join('') +
        (this._periodo==='personalizado' ?
          '<input type="date" value="'+this._getDesde()+'" onchange="ReportesModule._fechaDesde=this.value;App.renderPage();" style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;"/>' +
          '<span style="font-size:12px;color:var(--gray-400);">—</span>' +
          '<input type="date" value="'+this._getHasta()+'" onchange="ReportesModule._fechaHasta=this.value;App.renderPage();" style="padding:6px 10px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;"/>' : '') +
      '</div>';

    // ── KPIs ──
    var kpis = [
      {i:'fa-receipt',     bg:'#eff6ff',c:'#2563eb', v:nVentas,            s:'comprobantes',     l:'Ventas del Período'},
      {i:'fa-dollar-sign', bg:'#f0fdf4',c:'#16a34a', v:this._moneda(tTotal),s:'acumulado',        l:'Total Período'},
      {i:'fa-chart-line',  bg:'#f5f3ff',c:'#7c3aed', v:this._moneda(utilidad),s:'estimado',       l:'Utilidad Estimada'},
      {i:'fa-calculator',  bg:'#fffbeb',c:'#d97706', v:this._moneda(ticketProm),s:'por comprobante',l:'Ticket Promedio'},
      {i:'fa-calendar-day',bg:'#fdf4ff',c:'#a21caf', v:vHoy.length,        s:'S/ '+tHoy.toFixed(2),l:'Ventas Hoy'},
      {i:'fa-boxes',       bg:'#fef2f2',c:'#dc2626', v:(DB.productos||[]).filter(function(p){return p.stock===0;}).length, s:'agotados', l:'Productos Agotados'},
    ];

    var statsBar = '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;">' +
      kpis.map(function(k){
        return '<div style="padding:14px 16px;background:white;border-radius:12px;border:1.5px solid var(--gray-200);display:flex;align-items:center;gap:10px;">' +
          '<div style="width:38px;height:38px;border-radius:10px;background:'+k.bg+';color:'+k.c+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas '+k.i+'"></i></div>' +
          '<div><div style="font-size:15px;font-weight:900;color:'+k.c+';">'+k.v+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+k.l+'</div>' +
          '<div style="font-size:10px;color:var(--gray-500);">'+k.s+'</div></div>' +
        '</div>';
      }).join('')+'</div>';

    // ── GRÁFICA BARRAS 7 DÍAS ──
    var dias7=[]; var dAux=new Date();
    for(var i=6;i>=0;i--){
      var dd=new Date(dAux); dd.setDate(dd.getDate()-i);
      var fff=dd.getFullYear()+'-'+String(dd.getMonth()+1).padStart(2,'0')+'-'+String(dd.getDate()).padStart(2,'0');
      var tot=(DB.ventas||[]).filter(function(v){return v.fecha===fff&&v.estado!=='ANULADO';}).reduce(function(s,v){return s+v.total;},0);
      dias7.push({
        fecha:dd.toLocaleDateString('es-PE',{day:'2-digit',month:'short'}),
        total:tot,
        esHoy:fff===hoy
      });
    }
    var maxD=Math.max.apply(null,dias7.map(function(d){return d.total;}),1)||1;

    var graficaBars = '<div style="display:flex;align-items:flex-end;gap:8px;height:160px;padding:0 8px;">' +
      dias7.map(function(d){
        var h=d.total>0?Math.max(8,Math.round(d.total/maxD*130)):4;
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
          '<div style="font-size:9px;font-weight:700;color:var(--gray-600);">'+(d.total>0?'S/'+d.total.toFixed(0):'')+'</div>' +
          '<div style="width:100%;background:'+(d.esHoy?'linear-gradient(180deg,#16a34a,#22c55e)':'linear-gradient(180deg,#2563eb,#60a5fa)')+';border-radius:5px 5px 0 0;height:'+h+'px;min-height:4px;transition:height 0.5s;"></div>' +
          '<div style="font-size:9px;color:var(--gray-500);text-align:center;font-weight:'+(d.esHoy?'800':'400')+';color:'+(d.esHoy?'#16a34a':'var(--gray-500)')+';">'+d.fecha+'</div>' +
        '</div>';
      }).join('') +
    '</div>';

    // ── TOP PRODUCTOS ──
    var topProds = this._topProductos(5);

    // ── VENTAS POR MÉTODO ──
    var metodos = {};
    ventas.forEach(function(v){
      var m=(v.metodo_pago||'EFECTIVO').split('(')[0].split('+')[0].trim();
      if(m.includes('YAPE')) m='YAPE/PLIN';
      else if(m.includes('TARJETA')) m='TARJETA';
      else if(m.includes('EFECTIVO')) m='EFECTIVO';
      if(!metodos[m])metodos[m]={total:0,cnt:0};
      metodos[m].total+=v.total; metodos[m].cnt++;
    });
    var metodoColors={'EFECTIVO':'#16a34a','TARJETA':'#2563eb','YAPE/PLIN':'#7c3aed','COMBINADO':'#0891b2'};
    var metodosList=Object.keys(metodos).sort(function(a,b){return metodos[b].total-metodos[a].total;});
    var maxMet=metodosList.length?metodos[metodosList[0]].total||1:1;

    // ── CARDS DE REPORTES ──
    var reportCards = [
      {i:'fa-file-invoice-dollar',t:'Reporte de Ventas',     c:'#2563eb',bg:'#eff6ff',v:'ventas'},
      {i:'fa-boxes',              t:'Reporte de Inventario', c:'#16a34a',bg:'#f0fdf4',v:'inventario'},
      {i:'fa-users',              t:'Reporte de Clientes',   c:'#7c3aed',bg:'#f5f3ff',v:'clientes'},
      {i:'fa-credit-card',        t:'Métodos de Pago',       c:'#0891b2',bg:'#f0f9ff',v:'metodos'},
      {i:'fa-tags',               t:'Ventas por Categoría',  c:'#d97706',bg:'#fffbeb',v:'categorias'},
      {i:'fa-file-csv',           t:'Exportar CSV',          c:'#dc2626',bg:'#fef2f2',v:'exportar'},
    ];

    return '<div class="page-header"><div>' +
        '<h2 class="page-title"><i class="fas fa-chart-bar" style="color:var(--accent);margin-right:8px;"></i>Reportes y Estadísticas</h2>' +
        '<p class="text-muted text-sm">Análisis de rendimiento del negocio</p>' +
      '</div>' +
      '<div class="page-actions">'+selectorPeriodo+'</div>' +
    '</div>' +
    statsBar +
    '<div style="display:grid;grid-template-columns:3fr 2fr;gap:16px;margin-bottom:16px;">' +

      // Gráfica barras
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
          '<span style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-chart-bar" style="color:var(--accent);margin-right:6px;"></i>Ventas Últimos 7 Días</span>' +
          '<span style="font-size:11px;color:var(--gray-400);"><span style="display:inline-block;width:10px;height:10px;background:#16a34a;border-radius:2px;margin-right:4px;"></span>Hoy</span>' +
        '</div>' +
        '<div style="padding:16px 20px;">'+graficaBars+'</div>' +
      '</div>' +

      // Top productos
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<span style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-star" style="color:#f59e0b;margin-right:6px;"></i>Top Productos</span>' +
        '</div>' +
        '<div style="padding:8px 0;">' +
          (topProds.length===0 ?
            '<div style="text-align:center;padding:24px;color:var(--gray-400);font-size:13px;">Sin ventas en este período</div>' :
            topProds.map(function(p,i){
              var colors=['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed'];
              var pct=topProds[0].total>0?Math.round(p.total/topProds[0].total*100):0;
              return '<div style="padding:10px 20px;">' +
                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">' +
                  '<span style="width:22px;height:22px;border-radius:50%;background:'+colors[i]+';color:white;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+(i+1)+'</span>' +
                  '<div style="flex:1;min-width:0;">' +
                    '<div style="font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+p.nombre+'</div>' +
                    '<div style="font-size:10px;color:var(--gray-400);">'+p.vendido+' uds · S/'+p.total.toFixed(0)+'</div>' +
                  '</div>' +
                '</div>' +
                '<div style="height:4px;background:var(--gray-100);border-radius:2px;"><div style="width:'+pct+'%;height:100%;background:'+colors[i]+';border-radius:2px;"></div></div>' +
              '</div>';
            }).join('')
          ) +
        '</div>' +
      '</div>' +

    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +

      // Métodos de pago
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<span style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-credit-card" style="color:#0891b2;margin-right:6px;"></i>Métodos de Pago</span>' +
        '</div>' +
        '<div style="padding:14px 20px;">' +
          (metodosList.length===0 ?
            '<div style="text-align:center;padding:20px;color:var(--gray-400);">Sin datos</div>' :
            metodosList.map(function(m){
              var pct=Math.round(metodos[m].total/maxMet*100);
              var c=metodoColors[m]||'#6b7280';
              return '<div style="margin-bottom:12px;">' +
                '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                  '<span style="font-size:12px;font-weight:700;">'+m+'</span>' +
                  '<span style="font-size:12px;font-weight:800;color:'+c+';">S/ '+metodos[m].total.toFixed(2)+'</span>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                  '<div style="flex:1;height:8px;background:var(--gray-100);border-radius:4px;">' +
                    '<div style="width:'+pct+'%;height:100%;background:'+c+';border-radius:4px;"></div>' +
                  '</div>' +
                  '<span style="font-size:11px;color:var(--gray-400);min-width:40px;">'+metodos[m].cnt+' vtas</span>' +
                '</div>' +
              '</div>';
            }).join('')
          ) +
        '</div>' +
      '</div>' +

      // Resumen tipo comprobante
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
          '<span style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-file-invoice" style="color:#7c3aed;margin-right:6px;"></i>Por Tipo de Comprobante</span>' +
        '</div>' +
        '<div style="padding:14px 20px;">' +
          (function(){
            var tipos={};
            ventas.forEach(function(v){
              var t=v.tipo||'N. VENTA';
              if(!tipos[t])tipos[t]={total:0,cnt:0};
              tipos[t].total+=v.total;tipos[t].cnt++;
            });
            var tipoColors={'N. VENTA':'#ea580c','BOL':'#2563eb','FAC':'#7c3aed'};
            var tipoLabels={'N. VENTA':'Nota de Venta','BOL':'Boleta','FAC':'Factura'};
            var total=Object.values(tipos).reduce(function(s,t){return s+t.total;},0)||1;
            return Object.keys(tipos).length===0 ?
              '<div style="text-align:center;padding:20px;color:var(--gray-400);">Sin datos</div>' :
              Object.keys(tipos).map(function(t){
                var c=tipoColors[t]||'#6b7280';
                var pct=Math.round(tipos[t].total/total*100);
                return '<div style="margin-bottom:12px;">' +
                  '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                    '<span style="font-size:12px;font-weight:700;">'+(tipoLabels[t]||t)+'</span>' +
                    '<span style="font-size:12px;font-weight:800;color:'+c+';">'+pct+'% · S/ '+tipos[t].total.toFixed(0)+'</span>' +
                  '</div>' +
                  '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<div style="flex:1;height:8px;background:var(--gray-100);border-radius:4px;">' +
                      '<div style="width:'+pct+'%;height:100%;background:'+c+';border-radius:4px;"></div>' +
                    '</div>' +
                    '<span style="font-size:11px;color:var(--gray-400);min-width:40px;">'+tipos[t].cnt+' vtas</span>' +
                  '</div>' +
                '</div>';
              }).join('');
          })() +
        '</div>' +
      '</div>' +
    '</div>' +

    // Cards de reportes
    '<div class="card">' +
      '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);">' +
        '<span style="font-size:13px;font-weight:800;color:var(--gray-800);"><i class="fas fa-folder-open" style="color:var(--accent);margin-right:6px;"></i>Reportes Detallados</span>' +
      '</div>' +
      '<div style="padding:16px 20px;display:grid;grid-template-columns:repeat(6,1fr);gap:12px;">' +
        reportCards.map(function(r){
          return '<div onclick="'+(r.v==='exportar'?'ReportesModule.exportarCSV()':'ReportesModule._vistaActual=\''+r.v+'\';App.renderPage();')+'" ' +
            'style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 12px;border-radius:14px;border:2px solid var(--gray-200);background:white;cursor:pointer;transition:all 0.15s;text-align:center;" ' +
            'onmouseover="this.style.borderColor=\''+r.c+'\';this.style.background=\''+r.bg+'\';this.style.transform=\'translateY(-2px)\';" ' +
            'onmouseout="this.style.borderColor=\'var(--gray-200)\';this.style.background=\'white\';this.style.transform=\'none\';">' +
            '<div style="width:44px;height:44px;border-radius:12px;background:'+r.bg+';display:flex;align-items:center;justify-content:center;">' +
              '<i class="fas '+r.i+'" style="font-size:20px;color:'+r.c+';"></i>' +
            '</div>' +
            '<div style="font-size:12px;font-weight:700;color:var(--gray-700);">'+r.t+'</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  },

  // ─── REPORTE VENTAS ───
  renderReporteVentas() {
    var ventas  = this._ventasFiltradas();
    var self    = this;
    var total   = ventas.reduce(function(s,v){return s+v.total;},0);
    var promedio= ventas.length?total/ventas.length:0;

    var filas = ventas.length===0 ?
      '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--gray-400);">Sin ventas en este período</td></tr>' :
      ventas.map(function(v){
        var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
        var tipoColor=v.tipo==='BOL'?'#2563eb':v.tipo==='FAC'?'#7c3aed':'#ea580c';
        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:9px 12px;font-size:12px;">'+self._formatFecha(v.fecha)+'</td>' +
          '<td style="padding:9px 8px;">' +
            '<span style="font-size:10px;font-weight:800;background:'+tipoColor+'18;color:'+tipoColor+';padding:2px 7px;border-radius:4px;">'+v.tipo+'</span>' +
            '<div style="font-size:12px;font-weight:700;color:'+tipoColor+';">'+v.serie+'-'+v.numero+'</div>' +
          '</td>' +
          '<td style="padding:9px 8px;font-size:12px;font-weight:600;">'+(cli?cli.nombre:'N/A')+'</td>' +
          '<td style="padding:9px 8px;font-size:12px;">'+(v.metodo_pago||'').substring(0,18)+'</td>' +
          '<td style="padding:9px 8px;font-size:11px;color:var(--gray-400);">'+(v.cajero||'—')+'</td>' +
          '<td style="padding:9px 8px;font-size:14px;font-weight:900;color:var(--accent);">S/ '+v.total.toFixed(2)+'</td>' +
          '<td style="padding:9px 8px;">' +
            '<span style="padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;background:'+(v.estado==='ACEPTADO'?'#f0fdf4':v.estado==='ANULADO'?'#fef2f2':'#fffbeb')+';color:'+(v.estado==='ACEPTADO'?'#16a34a':v.estado==='ANULADO'?'#dc2626':'#d97706')+';">'+v.estado+'</span>' +
          '</td>' +
        '</tr>';
      }).join('');

    return this._layoutReporte('📋 Reporte de Ventas',
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">' +
        [
          {l:'Comprobantes', v:ventas.length,           c:'#2563eb',bg:'#eff6ff'},
          {l:'Total Ventas', v:this._moneda(total),     c:'#16a34a',bg:'#f0fdf4'},
          {l:'Ticket Prom.', v:this._moneda(promedio),  c:'#7c3aed',bg:'#f5f3ff'},
          {l:'Anulados',     v:(DB.ventas||[]).filter(function(v){return v.estado==='ANULADO';}).length, c:'#dc2626',bg:'#fef2f2'},
        ].map(function(k){
          return '<div style="padding:14px;background:white;border-radius:10px;border:1.5px solid var(--gray-200);text-align:center;">' +
            '<div style="font-size:20px;font-weight:900;color:'+k.c+';">'+k.v+'</div>' +
            '<div style="font-size:11px;color:var(--gray-400);margin-top:2px;">'+k.l+'</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
            '<th style="padding:9px 12px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Fecha</th>' +
            '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Comprobante</th>' +
            '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cliente</th>' +
            '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Método</th>' +
            '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Cajero</th>' +
            '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Total</th>' +
            '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">Estado</th>' +
          '</tr></thead>' +
          '<tbody>'+filas+'</tbody>' +
          '<tfoot><tr style="background:var(--gray-50);border-top:2px solid var(--gray-200);">' +
            '<td colspan="5" style="padding:10px 12px;font-size:13px;font-weight:800;">TOTAL ('+ventas.length+' comprobantes)</td>' +
            '<td style="padding:10px 8px;font-size:16px;font-weight:900;color:var(--accent);">S/ '+total.toFixed(2)+'</td>' +
            '<td></td>' +
          '</tr></tfoot>' +
        '</table>' +
      '</div>',
      true
    );
  },

  // ─── REPORTE INVENTARIO ───
  renderReporteInventario() {
    var prods = (DB.productos||[]).slice().sort(function(a,b){return a.stock-b.stock;});
    var agotados = prods.filter(function(p){return p.stock===0;});
    var bajos    = prods.filter(function(p){return p.stock>0&&p.stock<=(p.stock_minimo||10);});
    var normales = prods.filter(function(p){return p.stock>(p.stock_minimo||10);});
    var valorTotal = prods.reduce(function(s,p){return s+p.stock*p.precio_venta;},0);

    var filas = prods.map(function(p){
      var agot=p.stock===0, bajo=!agot&&p.stock<=(p.stock_minimo||10);
      var estBg=agot?'#fef2f2':bajo?'#fffbeb':'#f0fdf4';
      var estClr=agot?'#dc2626':bajo?'#d97706':'#16a34a';
      var margen=p.precio_venta>0?((p.precio_venta-p.precio_compra)/p.precio_venta*100):0;
      return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
        '<td style="padding:9px 12px;font-family:monospace;font-size:12px;font-weight:700;">'+p.codigo+'</td>' +
        '<td style="padding:9px 8px;">' +
          '<div style="font-size:13px;font-weight:700;">'+p.nombre+'</div>' +
          '<div style="font-size:10px;color:var(--gray-400);">'+p.categoria+' · '+p.unidad+'</div>' +
        '</td>' +
        '<td style="padding:9px 8px;font-size:13px;font-weight:900;color:var(--accent);">S/ '+p.precio_venta.toFixed(2)+'</td>' +
        '<td style="padding:9px 8px;font-size:12px;color:var(--gray-500);">S/ '+p.precio_compra.toFixed(2)+'</td>' +
        '<td style="padding:9px 8px;font-size:12px;font-weight:700;color:'+(margen>=30?'#16a34a':margen>=15?'#d97706':'#dc2626')+';">'+margen.toFixed(1)+'%</td>' +
        '<td style="padding:9px 8px;">' +
          '<span style="padding:4px 12px;border-radius:20px;font-size:12px;font-weight:800;background:'+estBg+';color:'+estClr+';">'+p.stock+'</span>' +
        '</td>' +
        '<td style="padding:9px 8px;font-size:11px;color:var(--gray-400);">'+(p.stock_minimo||10)+' min</td>' +
        '<td style="padding:9px 8px;font-size:12px;font-weight:700;">S/ '+(p.stock*p.precio_venta).toFixed(2)+'</td>' +
      '</tr>';
    }).join('');

    return this._layoutReporte('📦 Reporte de Inventario',
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px;">' +
        [
          {l:'Total Productos',   v:prods.length,              c:'#2563eb',bg:'#eff6ff'},
          {l:'Agotados',          v:agotados.length,           c:'#dc2626',bg:'#fef2f2'},
          {l:'Stock Bajo',        v:bajos.length,              c:'#d97706',bg:'#fffbeb'},
          {l:'Valor Inventario',  v:this._moneda(valorTotal),  c:'#16a34a',bg:'#f0fdf4'},
        ].map(function(k){
          return '<div style="padding:14px;background:white;border-radius:10px;border:1.5px solid var(--gray-200);text-align:center;">' +
            '<div style="font-size:20px;font-weight:900;color:'+k.c+';">'+k.v+'</div>' +
            '<div style="font-size:11px;color:var(--gray-400);margin-top:2px;">'+k.l+'</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
            ['Código','Producto','P. Venta','P. Compra','Margen','Stock','Mínimo','Valor Stock'].map(function(h){
              return '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">'+h+'</th>';
            }).join('') +
          '</tr></thead>' +
          '<tbody>'+filas+'</tbody>' +
        '</table>' +
      '</div>',
      true
    );
  },

  // ─── REPORTE CLIENTES ───
  renderReporteClientes() {
    var clientes = (DB.clientes||[]).filter(function(c){return c.tipo_cliente==='cliente'&&c.doc!=='00000000';});
    var conCompras = clientes.map(function(c){
      var vCli=(DB.ventas||[]).filter(function(v){return v.cliente_id===c.id&&v.estado!=='ANULADO';});
      return {
        nombre:c.nombre, doc:c.tipo+': '+c.doc,
        ventas:vCli.length,
        total:vCli.reduce(function(s,v){return s+v.total;},0),
        ultima:vCli.length?vCli[0].fecha:'—'
      };
    }).sort(function(a,b){return b.total-a.total;});

    var filas = conCompras.length===0 ?
      '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--gray-400);">Sin clientes registrados</td></tr>' :
      conCompras.map(function(c,i){
        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:9px 12px;">' +
            '<span style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:white;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-right:8px;">'+(i+1)+'</span>' +
            '<span style="font-size:13px;font-weight:700;">'+c.nombre+'</span>' +
          '</td>' +
          '<td style="padding:9px 8px;font-size:11px;color:var(--gray-400);">'+c.doc+'</td>' +
          '<td style="padding:9px 8px;font-size:13px;font-weight:700;text-align:center;">'+c.ventas+'</td>' +
          '<td style="padding:9px 8px;font-size:14px;font-weight:900;color:var(--accent);">S/ '+c.total.toFixed(2)+'</td>' +
          '<td style="padding:9px 8px;font-size:11px;color:var(--gray-400);">'+(c.ultima!=='—'?c.ultima.split('-').reverse().join('/'):c.ultima)+'</td>' +
        '</tr>';
      }).join('');

    return this._layoutReporte('👥 Reporte de Clientes',
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">' +
        [
          {l:'Total Clientes',   v:clientes.length,  c:'#2563eb',bg:'#eff6ff'},
          {l:'Con Compras',      v:conCompras.filter(function(c){return c.ventas>0;}).length, c:'#16a34a',bg:'#f0fdf4'},
          {l:'Sin Compras',      v:conCompras.filter(function(c){return c.ventas===0;}).length, c:'#d97706',bg:'#fffbeb'},
        ].map(function(k){
          return '<div style="padding:14px;background:white;border-radius:10px;border:1.5px solid var(--gray-200);text-align:center;">' +
            '<div style="font-size:20px;font-weight:900;color:'+k.c+';">'+k.v+'</div>' +
            '<div style="font-size:11px;color:var(--gray-400);margin-top:2px;">'+k.l+'</div>' +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
            ['#  Cliente','Documento','Compras','Total Gastado','Última Compra'].map(function(h){
              return '<th style="padding:9px 8px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">'+h+'</th>';
            }).join('') +
          '</tr></thead>' +
          '<tbody>'+filas+'</tbody>' +
        '</table>' +
      '</div>',
      true
    );
  },

  // ─── REPORTE MÉTODOS ───
  renderReporteMetodos() {
    var ventas=this._ventasFiltradas();
    var metodos={};
    ventas.forEach(function(v){
      var partes=(v.metodo_pago||'EFECTIVO').split(' + ');
      partes.forEach(function(parte){
        var m=parte.split('(')[0].trim();
        if(!metodos[m])metodos[m]={total:0,cnt:0};
        metodos[m].cnt++;
        var match=parte.match(/\(S\/([\d.]+)\)/);
        metodos[m].total+=match?parseFloat(match[1]):(partes.length===1?v.total:0);
      });
      if(partes.length===1) {metodos[partes[0].split('(')[0].trim()].total=metodos[partes[0].split('(')[0].trim()].total;}
    });

    var metodos2={};
    ventas.forEach(function(v){
      var m=(v.metodo_pago||'EFECTIVO').includes('+')?'COMBINADO':(v.metodo_pago||'EFECTIVO').split('(')[0].trim();
      if(!metodos2[m])metodos2[m]={total:0,cnt:0};
      metodos2[m].total+=v.total;metodos2[m].cnt++;
    });

    var totalG=Object.values(metodos2).reduce(function(s,m){return s+m.total;},0)||1;
    var metodoColors={'EFECTIVO':'#16a34a','TARJETA':'#2563eb','YAPE':'#7c3aed','COMBINADO':'#0891b2'};

    var filas=Object.keys(metodos2).sort(function(a,b){return metodos2[b].total-metodos2[a].total;}).map(function(m){
      var c=metodoColors[m]||'#6b7280';
      var pct=(metodos2[m].total/totalG*100).toFixed(1);
      return '<tr>' +
        '<td style="padding:12px 16px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div style="width:12px;height:12px;border-radius:50%;background:'+c+';flex-shrink:0;"></div>' +
            '<span style="font-size:13px;font-weight:700;">'+m+'</span>' +
          '</div>' +
        '</td>' +
        '<td style="padding:12px 8px;text-align:center;font-size:13px;font-weight:700;">'+metodos2[m].cnt+'</td>' +
        '<td style="padding:12px 8px;font-size:14px;font-weight:900;color:'+c+';">S/ '+metodos2[m].total.toFixed(2)+'</td>' +
        '<td style="padding:12px 8px;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<div style="flex:1;height:8px;background:var(--gray-100);border-radius:4px;">' +
              '<div style="width:'+pct+'%;height:100%;background:'+c+';border-radius:4px;"></div>' +
            '</div>' +
            '<span style="font-size:12px;font-weight:700;color:'+c+';min-width:40px;">'+pct+'%</span>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    return this._layoutReporte('💳 Métodos de Pago',
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
            ['Método','Transacciones','Total','Participación'].map(function(h){
              return '<th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">'+h+'</th>';
            }).join('')+
          '</tr></thead><tbody>'+filas+'</tbody>' +
        '</table>' +
      '</div>',
      null
    );
  },

  // ─── REPORTE CATEGORÍAS ───
  renderReporteCategorias() {
    var ventas=this._ventasFiltradas();
    var cats={};
    ventas.forEach(function(v){
      (v.items||[]).forEach(function(i){
        var p=(DB.productos||[]).find(function(x){return x.id===i.prod_id;});
        var cat=p?p.categoria:'Otros';
        if(!cats[cat])cats[cat]={total:0,qty:0,ventas:0};
        cats[cat].total+=i.total;cats[cat].qty+=i.qty;cats[cat].ventas++;
      });
    });
    var totalG=Object.values(cats).reduce(function(s,c){return s+c.total;},0)||1;
    var sortedCats=Object.keys(cats).sort(function(a,b){return cats[b].total-cats[a].total;});
    var colors=['#2563eb','#16a34a','#7c3aed','#d97706','#dc2626','#0891b2','#0ea5e9','#f59e0b'];

    var filas=sortedCats.length===0?
      '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--gray-400);">Sin datos en este período</td></tr>':
      sortedCats.map(function(cat,i){
        var c=colors[i%colors.length];
        var pct=(cats[cat].total/totalG*100).toFixed(1);
        return '<tr onmouseover="this.style.background=\'var(--gray-50)\'" onmouseout="this.style.background=\'white\'">' +
          '<td style="padding:12px 16px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<span style="width:24px;height:24px;border-radius:50%;background:'+c+';color:white;font-size:11px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">'+(i+1)+'</span>' +
              '<span style="font-size:13px;font-weight:700;">'+cat+'</span>' +
            '</div>' +
          '</td>' +
          '<td style="padding:12px 8px;font-size:13px;font-weight:700;text-align:center;">'+cats[cat].qty+' uds</td>' +
          '<td style="padding:12px 8px;font-size:14px;font-weight:900;color:'+c+';">S/ '+cats[cat].total.toFixed(2)+'</td>' +
          '<td style="padding:12px 8px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div style="flex:1;height:8px;background:var(--gray-100);border-radius:4px;">' +
                '<div style="width:'+pct+'%;height:100%;background:'+c+';border-radius:4px;"></div>' +
              '</div>' +
              '<span style="font-size:12px;font-weight:700;color:'+c+';min-width:40px;">'+pct+'%</span>' +
            '</div>' +
          '</td>' +
        '</tr>';
      }).join('');

    return this._layoutReporte('🏷️ Ventas por Categoría',
      '<div style="overflow-x:auto;">' +
        '<table style="width:100%;border-collapse:collapse;">' +
          '<thead><tr style="background:var(--gray-50);border-bottom:2px solid var(--gray-200);">' +
            ['Categoría','Unidades','Total Ventas','Participación'].map(function(h){
              return '<th style="padding:9px 16px;text-align:left;font-size:11px;font-weight:800;color:var(--gray-500);text-transform:uppercase;">'+h+'</th>';
            }).join('')+
          '</tr></thead><tbody>'+filas+'</tbody>' +
        '</table>' +
      '</div>',
      null
    );
  },

  // ─── LAYOUT REPORTE ───
  _layoutReporte(titulo, contenido, onExportar) {
    var self=this;
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:var(--gray-50);border-radius:12px;border:1.5px solid var(--gray-200);margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;gap:12px;">' +
        '<button onclick="ReportesModule._vistaActual=\'dashboard\';App.renderPage();" style="background:white;color:var(--gray-700);border:1.5px solid var(--gray-200);border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer;font-size:13px;"><i class="fas fa-arrow-left" style="margin-right:5px;"></i>Volver</button>' +
        '<div style="width:2px;height:24px;background:var(--gray-200);"></div>' +
        '<div style="font-size:16px;font-weight:900;color:var(--gray-900);">'+titulo+'</div>' +
        '<span style="font-size:11px;color:var(--gray-400);">'+this._getDesde()+' — '+this._getHasta()+'</span>' +
      '</div>' +
      '<div style="display:flex;gap:8px;">' +
        this._selectorPeriodoCompacto() +
         (onExportar?'<button onclick="ReportesModule._exportar()" style="padding:7px 16px;background:white;color:#16a34a;border:1.5px solid #16a34a;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;"><i class="fas fa-file-csv" style="margin-right:5px;"></i>Exportar CSV</button>':'') +
      '</div>' +
    '</div>' +
    '<div class="card"><div style="padding:16px 20px;">'+contenido+'</div></div>';
  },

  _selectorPeriodoCompacto() {
    var self=this;
    return '<div style="display:flex;gap:4px;">' +
      [['hoy','Hoy'],['semana','7d'],['mes','Mes']].map(function(p){
        var act=self._periodo===p[0];
        return '<button onclick="ReportesModule._periodo=\''+p[0]+'\';App.renderPage();" style="padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;border:1.5px solid '+(act?'var(--accent)':'var(--gray-200)')+';background:'+(act?'var(--accent)':'white')+';color:'+(act?'white':'var(--gray-600)')+';">'+p[1]+'</button>';
      }).join('') +
    '</div>';
  },

  // ─── TOP PRODUCTOS ───
  _topProductos(n) {
    var map={};
    this._ventasFiltradas().forEach(function(v){
      (v.items||[]).forEach(function(i){
        if(!map[i.prod_id])map[i.prod_id]={nombre:i.nombre,vendido:0,total:0};
        map[i.prod_id].vendido+=i.qty;
        map[i.prod_id].total+=i.total;
      });
    });
    return Object.values(map).sort(function(a,b){return b.total-a.total;}).slice(0,n||5);
  },

  // ─── EXPORTAR ───
  exportarCSV() {
    var ventas=this._ventasFiltradas();
    var header='Fecha,Hora,Serie,Numero,Tipo,Cliente,Metodo Pago,Total,Estado,Cajero\n';
    var rows=ventas.map(function(v){
      var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
      return v.fecha+','+v.hora+','+v.serie+','+v.numero+','+v.tipo+
        ',"'+(cli?cli.nombre:'')+'",'+(v.metodo_pago||'')+','+v.total.toFixed(2)+','+v.estado+','+(v.cajero||'');
    }).join('\n');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+header+rows],{type:'text/csv;charset=utf-8;'}));
    a.download='reporte_ventas_'+this._getDesde()+'_'+this._getHasta()+'.csv';
    a.click(); URL.revokeObjectURL(a.href);
    App.toast(ventas.length+' registros exportados','success');
  },

  _exportarReporteVentas() {
    var ventas=this._ventasFiltradas();
    var header='Fecha,Hora,Serie,Numero,Tipo,Cliente,Documento,Metodo Pago,Total,Estado,Cajero\n';
    var rows=ventas.map(function(v){
      var cli=(DB.clientes||[]).find(function(c){return c.id===v.cliente_id;});
      return v.fecha+','+v.hora+','+v.serie+','+v.numero+','+v.tipo+
        ',"'+(cli?cli.nombre:'')+'",'+(cli?cli.doc:'')+','+(v.metodo_pago||'')+','+
        v.total.toFixed(2)+','+v.estado+','+(v.cajero||'');
    }).join('\n');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+header+rows],{type:'text/csv;charset=utf-8;'}));
    a.download='ventas_'+this._getDesde()+'_al_'+this._getHasta()+'.csv';
    a.click(); URL.revokeObjectURL(a.href);
    App.toast(ventas.length+' ventas exportadas','success');
  },

  _exportarReporteInventario() {
    var prods=DB.productos||[];
    var header='Codigo,Nombre,Categoria,Unidad,Precio Venta,Precio Compra,Stock,Stock Minimo,Valor Stock\n';
    var rows=prods.map(function(p){
      return '"'+p.codigo+'","'+p.nombre+'","'+(p.categoria||'')+'","'+(p.unidad||'UND')+'",'+
        p.precio_venta+','+p.precio_compra+','+p.stock+','+(p.stock_minimo||10)+','+
        (p.stock*p.precio_venta).toFixed(2);
    }).join('\n');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+header+rows],{type:'text/csv;charset=utf-8;'}));
    a.download='inventario_'+new Date().toISOString().slice(0,10)+'.csv';
    a.click(); URL.revokeObjectURL(a.href);
    App.toast(prods.length+' productos exportados','success');
  },

  _exportarReporteClientes() {
    var clientes=(DB.clientes||[]).filter(function(c){return c.tipo_cliente==='cliente'&&c.doc!=='00000000';});
    var header='Nombre,Tipo,Documento,Compras,Total Gastado,Ultima Compra\n';
    var rows=clientes.map(function(c){
      var vCli=(DB.ventas||[]).filter(function(v){return v.cliente_id===c.id&&v.estado!=='ANULADO';});
      var total=vCli.reduce(function(s,v){return s+v.total;},0);
      return '"'+c.nombre+'",'+c.tipo+','+c.doc+','+vCli.length+','+total.toFixed(2)+(vCli.length?','+vCli[0].fecha:',—');
    }).join('\n');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob(['\uFEFF'+header+rows],{type:'text/csv;charset=utf-8;'}));
    a.download='clientes_'+new Date().toISOString().slice(0,10)+'.csv';
    a.click(); URL.revokeObjectURL(a.href);
    App.toast(clientes.length+' clientes exportados','success');
  },

  // Alias por compatibilidad
  ver(tipo) { App.toast('Cargando reporte...','info'); },
  _exportar() {
  if(this._vistaActual==='ventas')          this._exportarReporteVentas();
  else if(this._vistaActual==='inventario') this._exportarReporteInventario();
  else if(this._vistaActual==='clientes')   this._exportarReporteClientes();
  else this.exportarCSV();
},

  exportarPDF() { App.toast('Usa Exportar CSV o imprime con Ctrl+P','info'); }
};