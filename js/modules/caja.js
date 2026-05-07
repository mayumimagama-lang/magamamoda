// ============================================================
// MÓDULO: CAJA — Versión Profesional
// ============================================================

const CajaModule = {

  // ── Helpers ──
  _fechaHoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  _horaAhora() {
    return new Date().toTimeString().slice(0,8);
  },
  _getCaja() {
    if (!DB.cajas || !DB.cajas[0]) DB.cajas = [{ estado:'CERRADA', monto_inicial:0, fecha_apertura:'', hora_apertura:'' }];
    return DB.cajas[0];
  },
  _getMovimientos() {
    if (!DB.movimientosCaja) DB.movimientosCaja = [];
    return DB.movimientosCaja;
  },
  _ventasHoy() {
    return DB.ventas.filter(function(v){ return v.fecha === CajaModule._fechaHoy(); });
  },

  // ── Calcular balance actual ──
  _calcBalance() {
    var caja   = this._getCaja();
    var movs   = this._getMovimientos().filter(function(m){ return m.fecha === CajaModule._fechaHoy(); });
    var ventas = this._ventasHoy();

    var ventaEfectivo = 0, ventaYape = 0, ventaTarjeta = 0, ventaTotal = 0;

    ventas.forEach(function(v) {
      ventaTotal += v.total;
      var mp = v.metodo_pago || '';

      // Pagos combinados: "YAPE(S/50.00) + EFECTIVO(S/30.00)"
      var partes = mp.split('+');
      partes.forEach(function(parte) {
        parte = parte.trim();
        var montoMatch = parte.match(/\(S?\/?(\d+\.?\d*)\)/);
        var monto = montoMatch ? parseFloat(montoMatch[1]) : v.total;

        if (parte.includes('EFECTIVO')) ventaEfectivo += monto;
        else if (parte.includes('YAPE') || parte.includes('PLIN')) ventaYape += monto;
        else if (parte.includes('TARJETA')) ventaTarjeta += monto;
        else if (parte === mp) {
          // Pago simple sin paréntesis
          if (mp === 'EFECTIVO') ventaEfectivo += v.total;
          else if (mp === 'YAPE' || mp === 'PLIN') ventaYape += v.total;
          else if (mp === 'TARJETA') ventaTarjeta += v.total;
        }
      });
    });

    var ingresos = movs.filter(function(m){ return m.tipo==='INGRESO'; }).reduce(function(s,m){ return s+m.monto; }, 0);
    var egresos  = movs.filter(function(m){ return m.tipo==='EGRESO';  }).reduce(function(s,m){ return s+m.monto; }, 0);

    var balanceEfectivo = (caja.monto_inicial||0) + ventaEfectivo + ingresos - egresos;
    var balanceTotal    = balanceEfectivo + ventaYape + ventaTarjeta;

    return {
      montoInicial: caja.monto_inicial || 0,
      ventaEfectivo, ventaYape, ventaTarjeta, ventaTotal,
      ingresos, egresos,
      balanceEfectivo, balanceTotal,
      numVentas: ventas.length
    };
  },

  // ──────────────────────────────────────────────────────
  // RENDER PRINCIPAL
  // ──────────────────────────────────────────────────────
  render() {
    App.setTabs2('Caja', 'ARQUEO DE CAJA');
    var caja  = this._getCaja();
    var bal   = this._calcBalance();
    var movs  = this._getMovimientos().filter(function(m){ return m.fecha === CajaModule._fechaHoy(); });
    var abierta = caja.estado === 'ABIERTA';

    // ── KPIs ──
    var kpis =
      '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px;">' +

      // Estado
      '<div class="stat-card" style="border-left:4px solid '+(abierta?'#16a34a':'#dc2626')+';">' +
        '<div class="stat-icon" style="background:'+(abierta?'#f0fdf4':'#fef2f2')+';color:'+(abierta?'#16a34a':'#dc2626')+';"><i class="fas fa-cash-register"></i></div>' +
        '<div class="stat-info">' +
          '<div class="stat-value" style="font-size:15px;color:'+(abierta?'#16a34a':'#dc2626')+';">'+(abierta?'✅ ABIERTA':'🔒 CERRADA')+'</div>' +
          '<div class="stat-label">Estado de Caja</div>' +
          (abierta && caja.hora_apertura ? '<div style="font-size:10px;color:var(--gray-400);margin-top:2px;">Apertura: '+caja.hora_apertura+'</div>' : '') +
        '</div>' +
      '</div>' +

      // Balance efectivo
      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-money-bill-wave"></i></div>' +
        '<div class="stat-info">' +
          '<div class="stat-value">S/ '+bal.balanceEfectivo.toFixed(2)+'</div>' +
          '<div class="stat-label">Efectivo en Caja</div>' +
          '<div style="font-size:10px;color:var(--gray-400);margin-top:2px;">Inicial: S/'+bal.montoInicial.toFixed(2)+'</div>' +
        '</div>' +
      '</div>' +

      // Ventas del día
      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-file-invoice-dollar"></i></div>' +
        '<div class="stat-info">' +
          '<div class="stat-value">'+bal.numVentas+'</div>' +
          '<div class="stat-label">Ventas del Día</div>' +
          '<div style="font-size:10px;color:var(--gray-400);margin-top:2px;">Total: S/'+bal.ventaTotal.toFixed(2)+'</div>' +
        '</div>' +
      '</div>' +

      // Ingresos/egresos
      '<div class="stat-card">' +
        '<div class="stat-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-arrow-circle-down"></i></div>' +
        '<div class="stat-info">' +
          '<div class="stat-value" style="color:#16a34a;">+S/ '+bal.ingresos.toFixed(2)+'</div>' +
          '<div class="stat-label">Ingresos Extra</div>' +
          '<div style="font-size:10px;color:#dc2626;margin-top:2px;">Egresos: -S/'+bal.egresos.toFixed(2)+'</div>' +
        '</div>' +
      '</div>' +

      // Balance total
      '<div class="stat-card" style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border:none;">' +
        '<div class="stat-icon" style="background:rgba(255,255,255,0.15);color:white;"><i class="fas fa-chart-line"></i></div>' +
        '<div class="stat-info">' +
          '<div class="stat-value" style="color:white;font-size:18px;">S/ '+bal.balanceTotal.toFixed(2)+'</div>' +
          '<div class="stat-label" style="color:rgba(255,255,255,0.7);">Balance Total</div>' +
        '</div>' +
      '</div>' +

      '</div>';

    // ── Desglose por método de pago ──
    var desglose =
      '<div class="card" style="margin-bottom:18px;">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="font-size:12px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;">' +
            '<i class="fas fa-chart-pie" style="color:var(--accent);margin-right:6px;"></i>Desglose por Método de Pago — Hoy' +
          '</div>' +
          '<span style="font-size:12px;color:var(--gray-400);">'+this._fechaHoy()+'</span>' +
        '</div>' +
        '<div style="padding:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">' +

        // Efectivo
        '<div style="padding:16px;background:#f0fdf4;border-radius:12px;border:2px solid #86efac;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="width:36px;height:36px;border-radius:9px;background:#16a34a;display:flex;align-items:center;justify-content:center;">' +
              '<i class="fas fa-money-bill-wave" style="color:white;font-size:16px;"></i></div>' +
            '<div>' +
              '<div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;">Efectivo</div>' +
              '<div style="font-size:20px;font-weight:900;color:#15803d;">S/ '+bal.ventaEfectivo.toFixed(2)+'</div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:11px;color:#16a34a;">'+
            this._ventasHoy().filter(function(v){ return v.metodo_pago && v.metodo_pago.includes('EFECTIVO'); }).length+
          ' ventas</div>' +
        '</div>' +

        // Yape/Plin
        '<div style="padding:16px;background:#f5f3ff;border-radius:12px;border:2px solid #c4b5fd;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="width:36px;height:36px;border-radius:9px;background:#7c3aed;display:flex;align-items:center;justify-content:center;">' +
              '<i class="fas fa-mobile-alt" style="color:white;font-size:16px;"></i></div>' +
            '<div>' +
              '<div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;">Yape / Plin</div>' +
              '<div style="font-size:20px;font-weight:900;color:#6d28d9;">S/ '+bal.ventaYape.toFixed(2)+'</div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:11px;color:#7c3aed;">'+
            this._ventasHoy().filter(function(v){ return v.metodo_pago && v.metodo_pago.includes('YAPE'); }).length+
          ' ventas</div>' +
        '</div>' +

        // Tarjeta
        '<div style="padding:16px;background:#eff6ff;border-radius:12px;border:2px solid #93c5fd;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="width:36px;height:36px;border-radius:9px;background:#2563eb;display:flex;align-items:center;justify-content:center;">' +
              '<i class="fas fa-credit-card" style="color:white;font-size:16px;"></i></div>' +
            '<div>' +
              '<div style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;">Tarjeta</div>' +
              '<div style="font-size:20px;font-weight:900;color:#1d4ed8;">S/ '+bal.ventaTarjeta.toFixed(2)+'</div>' +
            '</div>' +
          '</div>' +
          '<div style="font-size:11px;color:#2563eb;">'+
            this._ventasHoy().filter(function(v){ return v.metodo_pago && v.metodo_pago.includes('TARJETA'); }).length+
          ' ventas</div>' +
        '</div>' +

        '</div>' +
      '</div>';

    // ── Acciones rápidas ──
    var acciones =
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px;">' +

      // Arqueo
      '<div onclick="CajaModule.abrirArqueo()" style="cursor:pointer;padding:22px 16px;background:white;border-radius:14px;border:2px solid '+(abierta?'#86efac':'#fca5a5')+';text-align:center;transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
        '<div style="width:52px;height:52px;border-radius:14px;background:'+(abierta?'#f0fdf4':'#fef2f2')+';display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
          '<i class="fas fa-'+(abierta?'lock-open':'lock')+'" style="font-size:22px;color:'+(abierta?'#16a34a':'#dc2626')+'"></i>' +
        '</div>' +
        '<div style="font-size:14px;font-weight:800;color:var(--gray-800);">'+(abierta?'Cerrar Caja':'Abrir Caja')+'</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:4px;">Arqueo de apertura/cierre</div>' +
      '</div>' +

      // Ingreso
      '<div onclick="CajaModule.registrarIngreso()" style="cursor:pointer;padding:22px 16px;background:white;border-radius:14px;border:2px solid var(--gray-200);text-align:center;transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
        '<div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
          '<i class="fas fa-plus-circle" style="font-size:22px;color:#16a34a;"></i>' +
        '</div>' +
        '<div style="font-size:14px;font-weight:800;color:var(--gray-800);">Ingreso</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:4px;">Registrar entrada de efectivo</div>' +
      '</div>' +

      // Egreso
      '<div onclick="CajaModule.registrarEgreso()" style="cursor:pointer;padding:22px 16px;background:white;border-radius:14px;border:2px solid var(--gray-200);text-align:center;transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
        '<div style="width:52px;height:52px;border-radius:14px;background:#fef2f2;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
          '<i class="fas fa-minus-circle" style="font-size:22px;color:#dc2626;"></i>' +
        '</div>' +
        '<div style="font-size:14px;font-weight:800;color:var(--gray-800);">Egreso</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:4px;">Registrar salida de efectivo</div>' +
      '</div>' +

      // Reporte
      '<div onclick="CajaModule.abrirReporte()" style="cursor:pointer;padding:22px 16px;background:white;border-radius:14px;border:2px solid var(--gray-200);text-align:center;transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.06);">' +
        '<div style="width:52px;height:52px;border-radius:14px;background:#eff6ff;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">' +
          '<i class="fas fa-file-invoice" style="font-size:22px;color:#2563eb;"></i>' +
        '</div>' +
        '<div style="font-size:14px;font-weight:800;color:var(--gray-800);">Reporte</div>' +
        '<div style="font-size:11px;color:var(--gray-400);margin-top:4px;">Ver movimientos del día</div>' +
      '</div>' +

      '</div>';

    // ── Movimientos del día ──
    var todosMovs = [];
    // Agregar ventas como movimientos
    this._ventasHoy().forEach(function(v) {
      todosMovs.push({ hora: v.hora, tipo: 'VENTA', concepto: v.serie+'-'+v.numero+' ('+v.metodo_pago+')', monto: v.total, color: '#16a34a', icon: 'fa-shopping-cart' });
    });
    // Agregar ingresos/egresos
    movs.forEach(function(m) {
      todosMovs.push({ hora: m.hora, tipo: m.tipo, concepto: m.concepto, monto: m.monto,
        color: m.tipo==='INGRESO'?'#16a34a':'#dc2626',
        icon: m.tipo==='INGRESO'?'fa-arrow-circle-down':'fa-arrow-circle-up' });
    });
    // Ordenar por hora
    todosMovs.sort(function(a,b){ return a.hora > b.hora ? -1 : 1; });

    var movimientosList =
      '<div class="card">' +
        '<div style="padding:14px 20px;border-bottom:1px solid var(--gray-200);display:flex;align-items:center;justify-content:space-between;">' +
          '<div style="font-size:12px;font-weight:800;color:var(--gray-500);text-transform:uppercase;letter-spacing:1px;">' +
            '<i class="fas fa-list" style="color:var(--accent);margin-right:6px;"></i>Movimientos del Día' +
            '<span style="background:var(--accent);color:white;font-size:10px;padding:1px 8px;border-radius:10px;margin-left:8px;">'+todosMovs.length+'</span>' +
          '</div>' +
          '<button onclick="CajaModule.abrirReporte()" style="background:var(--gray-100);border:none;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;color:var(--gray-600);">Ver todo</button>' +
        '</div>' +
        '<div style="padding:0;">' +
        (todosMovs.length === 0 ?
          '<div style="text-align:center;padding:40px;color:var(--gray-400);"><i class="fas fa-inbox" style="font-size:36px;display:block;margin-bottom:10px;opacity:0.3;"></i><p>Sin movimientos hoy</p></div>' :
          todosMovs.slice(0,8).map(function(m) {
            return '<div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--gray-100);">' +
              '<div style="width:36px;height:36px;border-radius:9px;flex-shrink:0;background:'+m.color+'18;display:flex;align-items:center;justify-content:center;">' +
                '<i class="fas '+m.icon+'" style="color:'+m.color+';font-size:14px;"></i>' +
              '</div>' +
              '<div style="flex:1;min-width:0;">' +
                '<div style="font-size:13px;font-weight:700;color:var(--gray-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+m.concepto+'</div>' +
                '<div style="font-size:11px;color:var(--gray-400);">'+m.hora+' · '+m.tipo+'</div>' +
              '</div>' +
              '<div style="font-size:15px;font-weight:900;color:'+m.color+';">'+(m.tipo==='EGRESO'?'-':'+')+' S/ '+m.monto.toFixed(2)+'</div>' +
            '</div>';
          }).join('')
        ) +
        '</div>' +
      '</div>';

    return (
      '<div class="page-header">' +
        '<div>' +
          '<h2 class="page-title"><i class="fas fa-cash-register" style="color:var(--accent);margin-right:8px;"></i>Caja</h2>' +
          '<p class="text-muted text-sm">'+this._fechaHoy()+' · Turno: '+(DB.usuarioActual?DB.usuarioActual.usuario:'N/A')+'</p>' +
        '</div>' +
        '<div class="page-actions">' +
          '<button class="btn btn-outline" onclick="CajaModule.imprimirCierre()"><i class="fas fa-print"></i> Imprimir Resumen</button>' +
          (abierta ?
            '<button class="btn btn-danger" onclick="CajaModule.abrirArqueo()"><i class="fas fa-lock"></i> Cerrar Caja</button>' :
            '<button class="btn btn-success" onclick="CajaModule.abrirArqueo()"><i class="fas fa-lock-open"></i> Abrir Caja</button>'
          ) +
        '</div>' +
      '</div>' +
      kpis + desglose + acciones + movimientosList
    );
  },

  // ──────────────────────────────────────────────────────
  // ARQUEO — APERTURA / CIERRE
  // ──────────────────────────────────────────────────────
  abrirArqueo() {
    var caja   = this._getCaja();
    var bal    = this._calcBalance();
    var abierta = caja.estado === 'ABIERTA';

    if (!abierta) {
      // APERTURA
      App.showModal('🏪 Apertura de Caja',
        '<div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:12px;padding:16px;margin-bottom:16px;border:2px solid #86efac;">' +
          '<div style="font-size:13px;font-weight:800;color:#15803d;margin-bottom:4px;"><i class="fas fa-lock-open" style="margin-right:6px;"></i>APERTURA DE CAJA</div>' +
          '<div style="font-size:11px;color:#16a34a;">'+this._fechaHoy()+' · '+this._horaAhora()+'</div>' +
        '</div>' +
        '<div class="form-grid">' +
          '<div class="form-group" style="grid-column:1/-1">' +
            '<label class="form-label">Monto Inicial en Efectivo (S/)</label>' +
            '<input class="form-control" id="montoApertura" type="number" step="0.01" value="200" ' +
              'style="font-size:28px;text-align:center;font-weight:900;padding:14px;" placeholder="0.00"/>' +
          '</div>' +
          '<div class="form-group" style="grid-column:1/-1">' +
            '<label class="form-label">Responsable</label>' +
            '<input class="form-control" value="'+(DB.usuarioActual?DB.usuarioActual.usuario:'')+'" readonly style="background:var(--gray-50);"/>' +
          '</div>' +
          '<div class="form-group" style="grid-column:1/-1">' +
            '<label class="form-label">Observaciones</label>' +
            '<textarea class="form-control" id="obsApertura" rows="2" placeholder="Observaciones de apertura..."></textarea>' +
          '</div>' +
        '</div>',
        [{ text:'✅ Abrir Caja', cls:'btn-success', cb: function() {
          var monto = parseFloat(document.getElementById('montoApertura')?.value) || 0;
          DB.cajas[0] = {
            estado: 'ABIERTA',
            monto_inicial: monto,
            fecha_apertura: CajaModule._fechaHoy(),
            hora_apertura: CajaModule._horaAhora(),
            responsable: DB.usuarioActual?.usuario || ''
          };
          App.toast('✅ Caja abierta con S/ '+monto.toFixed(2), 'success');
          App.closeModal();
          App.renderPage();
        }}]
      );
    } else {
      // CIERRE
      var resumenHTML =
        '<div style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border-radius:12px;padding:16px;margin-bottom:16px;border:2px solid #fca5a5;">' +
          '<div style="font-size:13px;font-weight:800;color:#dc2626;margin-bottom:4px;"><i class="fas fa-lock" style="margin-right:6px;"></i>CIERRE DE CAJA</div>' +
          '<div style="font-size:11px;color:#dc2626;">'+this._fechaHoy()+' · Apertura: '+caja.hora_apertura+'</div>' +
        '</div>' +
        '<div style="background:var(--gray-50);border-radius:10px;padding:16px;margin-bottom:14px;">' +
          '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:12px;">Resumen del Día</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:13px;">' +
            '<span>Monto inicial:</span><span style="font-weight:700;">S/ '+bal.montoInicial.toFixed(2)+'</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:13px;">' +
            '<span>Ventas efectivo:</span><span style="font-weight:700;color:#16a34a;">+ S/ '+bal.ventaEfectivo.toFixed(2)+'</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:13px;">' +
            '<span>Ventas Yape/Plin:</span><span style="font-weight:700;color:#7c3aed;">S/ '+bal.ventaYape.toFixed(2)+'</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:13px;">' +
            '<span>Ventas tarjeta:</span><span style="font-weight:700;color:#2563eb;">S/ '+bal.ventaTarjeta.toFixed(2)+'</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:13px;">' +
            '<span>Ingresos extra:</span><span style="font-weight:700;color:#16a34a;">+ S/ '+bal.ingresos.toFixed(2)+'</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--gray-200);font-size:13px;">' +
            '<span>Egresos:</span><span style="font-weight:700;color:#dc2626;">- S/ '+bal.egresos.toFixed(2)+'</span>' +
          '</div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:14px;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:10px;color:white;">' +
            '<span style="font-size:16px;font-weight:900;">EFECTIVO EN CAJA:</span>' +
            '<span style="font-size:22px;font-weight:900;">S/ '+bal.balanceEfectivo.toFixed(2)+'</span>' +
          '</div>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Efectivo contado (S/)</label>' +
          '<input class="form-control" id="montoContado" type="number" step="0.01" placeholder="0.00" value="'+bal.balanceEfectivo.toFixed(2)+'" ' +
            'style="font-size:24px;text-align:center;font-weight:900;padding:12px;" oninput="CajaModule._calcDiferencia()"/>' +
        '</div>' +
        '<div id="diferenciaCierre" style="padding:12px;border-radius:8px;text-align:center;font-weight:800;font-size:15px;background:#f0fdf4;color:#16a34a;margin-bottom:10px;">' +
          '✅ Sin diferencia' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Observaciones de cierre</label>' +
          '<textarea class="form-control" id="obsCierre" rows="2" placeholder="Observaciones..."></textarea>' +
        '</div>';

      App.showModal('🔒 Cierre de Caja', resumenHTML, [
        { text:'🔒 Confirmar Cierre', cls:'btn-danger', cb: function() {
          DB.cajas[0].estado = 'CERRADA';
          DB.cajas[0].hora_cierre = CajaModule._horaAhora();
          DB.cajas[0].monto_contado = parseFloat(document.getElementById('montoContado')?.value) || 0;
          App.toast('🔒 Caja cerrada correctamente', 'warning');
          App.closeModal();
          App.renderPage();
          setTimeout(function(){ CajaModule.imprimirCierre(); }, 300);
        }}
      ]);
      document.getElementById('modalBox').style.maxWidth = '500px';
    }
  },

  _calcDiferencia() {
    var bal     = this._calcBalance();
    var contado = parseFloat(document.getElementById('montoContado')?.value) || 0;
    var diff    = contado - bal.balanceEfectivo;
    var el      = document.getElementById('diferenciaCierre');
    if (!el) return;
    if (Math.abs(diff) < 0.01) {
      el.style.background = '#f0fdf4'; el.style.color = '#16a34a';
      el.innerHTML = '✅ Sin diferencia — Cuadra perfectamente';
    } else if (diff > 0) {
      el.style.background = '#eff6ff'; el.style.color = '#2563eb';
      el.innerHTML = '💰 Sobrante: S/ '+diff.toFixed(2);
    } else {
      el.style.background = '#fef2f2'; el.style.color = '#dc2626';
      el.innerHTML = '⚠️ Faltante: S/ '+Math.abs(diff).toFixed(2);
    }
  },

  // ──────────────────────────────────────────────────────
  // INGRESO
  // ──────────────────────────────────────────────────────
  registrarIngreso() {
    var conceptos = ['Préstamo de caja', 'Ajuste de apertura', 'Devolución', 'Otro ingreso'];
    App.showModal('💵 Registrar Ingreso de Efectivo',
      '<div style="background:#f0fdf4;border-radius:10px;padding:12px 16px;margin-bottom:14px;border:1.5px solid #86efac;">' +
        '<div style="font-size:12px;font-weight:700;color:#16a34a;"><i class="fas fa-plus-circle" style="margin-right:6px;"></i>INGRESO DE EFECTIVO — '+this._fechaHoy()+'</div>' +
      '</div>' +
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1">' +
          '<label class="form-label">Concepto <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="ingresoConcepto" type="text" list="conceptosIngreso" placeholder="Describe el ingreso..." autofocus/>' +
          '<datalist id="conceptosIngreso">'+conceptos.map(function(c){ return '<option value="'+c+'">'; }).join('')+'</datalist>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Monto (S/) <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="ingresoMonto" type="number" step="0.01" placeholder="0.00" style="font-size:22px;text-align:center;font-weight:900;padding:12px;"/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Responsable</label>' +
          '<input class="form-control" value="'+(DB.usuarioActual?DB.usuarioActual.usuario:'')+'" readonly style="background:var(--gray-50);"/>' +
        '</div>' +
      '</div>',
      [{ text:'✅ Registrar Ingreso', cls:'btn-success', cb: function() {
        var concepto = document.getElementById('ingresoConcepto')?.value?.trim();
        var monto    = parseFloat(document.getElementById('ingresoMonto')?.value) || 0;
        if (!concepto) { App.toast('Ingresa el concepto', 'error'); return; }
        if (monto <= 0) { App.toast('Ingresa un monto válido', 'error'); return; }
        if (!DB.movimientosCaja) DB.movimientosCaja = [];
        DB.movimientosCaja.push({
          id: Date.now(), tipo: 'INGRESO', concepto: concepto,
          monto: monto, fecha: CajaModule._fechaHoy(), hora: CajaModule._horaAhora(),
          responsable: DB.usuarioActual?.usuario || ''
        });
        App.toast('✅ Ingreso registrado: S/ '+monto.toFixed(2), 'success');
        App.closeModal();
        App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '460px';
  },

  // ──────────────────────────────────────────────────────
  // EGRESO
  // ──────────────────────────────────────────────────────
  registrarEgreso() {
    var conceptos = ['Pago a proveedor', 'Gastos operativos', 'Compra de insumos', 'Pago de servicios', 'Retiro de efectivo', 'Otro egreso'];
    App.showModal('💸 Registrar Egreso de Efectivo',
      '<div style="background:#fef2f2;border-radius:10px;padding:12px 16px;margin-bottom:14px;border:1.5px solid #fca5a5;">' +
        '<div style="font-size:12px;font-weight:700;color:#dc2626;"><i class="fas fa-minus-circle" style="margin-right:6px;"></i>EGRESO DE EFECTIVO — '+this._fechaHoy()+'</div>' +
      '</div>' +
      '<div class="form-grid">' +
        '<div class="form-group" style="grid-column:1/-1">' +
          '<label class="form-label">Concepto <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="egresoConcepto" type="text" list="conceptosEgreso" placeholder="Describe el egreso..." autofocus/>' +
          '<datalist id="conceptosEgreso">'+conceptos.map(function(c){ return '<option value="'+c+'">'; }).join('')+'</datalist>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Monto (S/) <span style="color:red;">*</span></label>' +
          '<input class="form-control" id="egresoMonto" type="number" step="0.01" placeholder="0.00" style="font-size:22px;text-align:center;font-weight:900;padding:12px;"/>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Responsable</label>' +
          '<input class="form-control" value="'+(DB.usuarioActual?DB.usuarioActual.usuario:'')+'" readonly style="background:var(--gray-50);"/>' +
        '</div>' +
      '</div>',
      [{ text:'✅ Registrar Egreso', cls:'btn-danger', cb: function() {
        var concepto = document.getElementById('egresoConcepto')?.value?.trim();
        var monto    = parseFloat(document.getElementById('egresoMonto')?.value) || 0;
        if (!concepto) { App.toast('Ingresa el concepto', 'error'); return; }
        if (monto <= 0) { App.toast('Ingresa un monto válido', 'error'); return; }
        if (!DB.movimientosCaja) DB.movimientosCaja = [];
        DB.movimientosCaja.push({
          id: Date.now(), tipo: 'EGRESO', concepto: concepto,
          monto: monto, fecha: CajaModule._fechaHoy(), hora: CajaModule._horaAhora(),
          responsable: DB.usuarioActual?.usuario || ''
        });
        App.toast('⚠️ Egreso registrado: S/ '+monto.toFixed(2), 'warning');
        App.closeModal();
        App.renderPage();
      }}]
    );
    document.getElementById('modalBox').style.maxWidth = '460px';
  },

  // ──────────────────────────────────────────────────────
  // REPORTE COMPLETO
  // ──────────────────────────────────────────────────────
  abrirReporte() {
    var bal       = this._calcBalance();
    var movs      = this._getMovimientos().filter(function(m){ return m.fecha === CajaModule._fechaHoy(); });
    var ventas    = this._ventasHoy();
    var caja      = this._getCaja();

    var todosMovs = [];
    ventas.forEach(function(v) {
      todosMovs.push({ hora: v.hora, tipo: 'VENTA', concepto: v.serie+'-'+v.numero, detalle: v.metodo_pago, monto: v.total, signo: '+', color: '#16a34a' });
    });
    movs.forEach(function(m) {
      todosMovs.push({ hora: m.hora, tipo: m.tipo, concepto: m.concepto, detalle: m.responsable, monto: m.monto,
        signo: m.tipo==='INGRESO'?'+':'-', color: m.tipo==='INGRESO'?'#16a34a':'#dc2626' });
    });
    todosMovs.sort(function(a,b){ return a.hora > b.hora ? -1 : 1; });

    var html =
      '<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px;padding:18px;margin-bottom:16px;color:white;">' +
        '<div style="font-size:13px;opacity:0.8;margin-bottom:4px;"><i class="fas fa-file-invoice" style="margin-right:6px;"></i>REPORTE DE CAJA</div>' +
        '<div style="font-size:11px;opacity:0.7;">'+CajaModule._fechaHoy()+' · Apertura: '+(caja.hora_apertura||'--')+'</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px;">' +
          '<div style="text-align:center;"><div style="font-size:18px;font-weight:900;">S/ '+bal.ventaTotal.toFixed(2)+'</div><div style="font-size:10px;opacity:0.7;">Total Ventas</div></div>' +
          '<div style="text-align:center;"><div style="font-size:18px;font-weight:900;">'+bal.numVentas+'</div><div style="font-size:10px;opacity:0.7;">Comprobantes</div></div>' +
          '<div style="text-align:center;"><div style="font-size:18px;font-weight:900;">S/ '+bal.balanceEfectivo.toFixed(2)+'</div><div style="font-size:10px;opacity:0.7;">Efectivo Caja</div></div>' +
        '</div>' +
      '</div>' +

      // Resumen por método
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">' +
        '<div style="padding:10px;background:#f0fdf4;border-radius:8px;text-align:center;">' +
          '<div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:4px;">Efectivo</div>' +
          '<div style="font-size:16px;font-weight:900;color:#15803d;">S/ '+bal.ventaEfectivo.toFixed(2)+'</div>' +
        '</div>' +
        '<div style="padding:10px;background:#f5f3ff;border-radius:8px;text-align:center;">' +
          '<div style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;margin-bottom:4px;">Yape/Plin</div>' +
          '<div style="font-size:16px;font-weight:900;color:#6d28d9;">S/ '+bal.ventaYape.toFixed(2)+'</div>' +
        '</div>' +
        '<div style="padding:10px;background:#eff6ff;border-radius:8px;text-align:center;">' +
          '<div style="font-size:10px;font-weight:700;color:#2563eb;text-transform:uppercase;margin-bottom:4px;">Tarjeta</div>' +
          '<div style="font-size:16px;font-weight:900;color:#1d4ed8;">S/ '+bal.ventaTarjeta.toFixed(2)+'</div>' +
        '</div>' +
      '</div>' +

      // Lista movimientos
      '<div style="font-size:11px;font-weight:800;color:var(--gray-400);text-transform:uppercase;margin-bottom:8px;">Detalle de Movimientos</div>' +
      '<div style="max-height:280px;overflow-y:auto;border-radius:8px;border:1px solid var(--gray-200);">' +
      (todosMovs.length === 0 ?
        '<div style="text-align:center;padding:24px;color:var(--gray-400);">Sin movimientos</div>' :
        todosMovs.map(function(m) {
          return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--gray-100);">' +
            '<div style="font-size:11px;color:var(--gray-400);width:50px;flex-shrink:0;">'+m.hora+'</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+m.concepto+'</div>' +
              '<div style="font-size:11px;color:var(--gray-400);">'+m.tipo+(m.detalle?' · '+m.detalle:'')+'</div>' +
            '</div>' +
            '<div style="font-size:14px;font-weight:900;color:'+m.color+';flex-shrink:0;">'+m.signo+' S/ '+m.monto.toFixed(2)+'</div>' +
          '</div>';
        }).join('')
      ) +
      '</div>';

    App.showModal('📊 Reporte de Caja', html, [
      { text:'🖨️ Imprimir', cls:'btn-primary', cb: function(){ App.closeModal(); CajaModule.imprimirCierre(); } }
    ]);
    document.getElementById('modalBox').style.maxWidth = '560px';
  },

  // ──────────────────────────────────────────────────────
  // IMPRIMIR RESUMEN DE CAJA
  // ──────────────────────────────────────────────────────
  imprimirCierre() {
    var bal    = this._calcBalance();
    var caja   = this._getCaja();
    var movs   = this._getMovimientos().filter(function(m){ return m.fecha === CajaModule._fechaHoy(); });
    var ventas = this._ventasHoy();
    var w      = window.open('', '_blank', 'width=400,height=700');
    if (!w) { App.toast('Activa ventanas emergentes para imprimir', 'warning'); return; }

    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte de Caja</title>' +
      '<style>' +
        'body{font-family:"Courier New",monospace;font-size:12px;max-width:320px;margin:0 auto;padding:14px;color:#000;}' +
        '.center{text-align:center;} .bold{font-weight:bold;} .big{font-size:15px;} .xl{font-size:20px;}' +
        'hr{border:none;border-top:1px dashed #000;margin:8px 0;}' +
        '.row{display:flex;justify-content:space-between;padding:3px 0;}' +
        '.total-box{border:2px solid #000;padding:8px;text-align:center;margin:8px 0;border-radius:4px;}' +
      '</style></head><body>' +
      '<div class="center bold big">'+DB.empresa.nombre+'</div>' +
      '<div class="center" style="font-size:11px;">'+DB.empresa.ruc+'</div>' +
      '<div class="center" style="font-size:10px;">'+DB.empresa.direccion+'</div>' +
      '<hr/>' +
      '<div class="center bold big">REPORTE DE CAJA</div>' +
      '<div class="center" style="font-size:11px;">'+CajaModule._fechaHoy()+'</div>' +
      '<div class="center" style="font-size:11px;">Apertura: '+(caja.hora_apertura||'--')+' | Cajero: '+(caja.responsable||'--')+'</div>' +
      '<hr/>' +
      '<div class="row"><span>Monto inicial:</span><span class="bold">S/ '+bal.montoInicial.toFixed(2)+'</span></div>' +
      '<div class="row"><span>Ventas efectivo:</span><span class="bold">S/ '+bal.ventaEfectivo.toFixed(2)+'</span></div>' +
      '<div class="row"><span>Ventas Yape/Plin:</span><span class="bold">S/ '+bal.ventaYape.toFixed(2)+'</span></div>' +
      '<div class="row"><span>Ventas tarjeta:</span><span class="bold">S/ '+bal.ventaTarjeta.toFixed(2)+'</span></div>' +
      '<div class="row"><span>Total ventas ('+bal.numVentas+'):</span><span class="bold">S/ '+bal.ventaTotal.toFixed(2)+'</span></div>' +
      (bal.ingresos>0?'<div class="row"><span>Ingresos extra:</span><span class="bold">+S/ '+bal.ingresos.toFixed(2)+'</span></div>':'')+
      (bal.egresos>0?'<div class="row"><span>Egresos:</span><span class="bold">-S/ '+bal.egresos.toFixed(2)+'</span></div>':'')+
      '<div class="total-box"><div class="bold">EFECTIVO EN CAJA</div><div class="xl bold">S/ '+bal.balanceEfectivo.toFixed(2)+'</div></div>' +
      (movs.length>0?
        '<hr/><div class="bold">Ingresos/Egresos:</div>' +
        movs.map(function(m){ return '<div class="row"><span>'+m.hora+' '+m.concepto+'</span><span>'+(m.tipo==='EGRESO'?'-':'+')+'S/'+m.monto.toFixed(2)+'</span></div>'; }).join('') :
        '') +
      '<hr/>' +
      '<div class="center" style="font-size:10px;">Impreso: '+new Date().toLocaleString('es-PE')+'</div>' +
      '</body></html>'
    );
    w.document.close();
    setTimeout(function(){ w.print(); }, 250);
  }
};
