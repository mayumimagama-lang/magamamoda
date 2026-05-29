// ============================================================
// MÓDULO: HERRAMIENTAS (Backup, Import/Export, WhatsApp, Utils)
// ============================================================

const HerramientasModule = {
  render() {
    App.setTabs2('Herramientas', 'SISTEMA');
    return `
      <div class="page-header">
        <h2 class="page-title">Herramientas del Sistema</h2>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;">



        <!-- Importar Productos Excel -->
        <div class="tool-card" onclick="HerramientasModule.importarProductos()">
          <div class="tool-card-icon" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-file-excel"></i></div>
          <h4>Importar Productos desde Excel</h4>
          <p>Carga masivamente productos desde una hoja Excel. Descarga la plantilla primero.</p>
          <span class="tool-badge" style="background:#f0fdf4;color:#16a34a;"><i class="fas fa-file-import"></i> Importación masiva</span>
        </div>

        <!-- Exportar Productos -->
        <div class="tool-card" onclick="HerramientasModule.exportarProductos()">
          <div class="tool-card-icon" style="background:#fffbeb;color:#d97706;"><i class="fas fa-file-download"></i></div>
          <h4>Exportar Productos a Excel</h4>
          <p>Descarga el catálogo completo de productos en formato CSV para editar en Excel.</p>
          <span class="tool-badge" style="background:#fffbeb;color:#d97706;"><i class="fas fa-table"></i> Exportar .csv</span>
        </div>

        <!-- Exportar Ventas -->
        <div class="tool-card" onclick="HerramientasModule.exportarVentas()">
          <div class="tool-card-icon" style="background:#fdf4ff;color:#7c3aed;"><i class="fas fa-file-invoice"></i></div>
          <h4>Exportar Ventas a CSV</h4>
          <p>Descarga el historial completo de ventas en formato CSV para análisis externo.</p>
          <span class="tool-badge" style="background:#fdf4ff;color:#7c3aed;"><i class="fas fa-table"></i> Exportar .csv</span>
        </div>

        <!-- WhatsApp Masivo -->
        <div class="tool-card" onclick="HerramientasModule.whatsappMasivo()">
          <div class="tool-card-icon" style="background:#f0fdf4;color:#25D366;"><i class="fab fa-whatsapp"></i></div>
          <h4>WhatsApp — Mensaje Masivo</h4>
          <p>Envía mensajes de promociones, recordatorios o avisos a tus clientes por WhatsApp.</p>
          <span class="tool-badge" style="background:#f0fdf4;color:#25D366;"><i class="fab fa-whatsapp"></i> Integración WhatsApp</span>
        </div>

        <!-- Calculadora -->
        <div class="tool-card" onclick="HerramientasModule.calculadora()">
          <div class="tool-card-icon" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-calculator"></i></div>
          <h4>Calculadora de IGV</h4>
          <p>Calcula precios con y sin IGV, márgenes de ganancia y precios de venta sugeridos.</p>
          <span class="tool-badge" style="background:#eff6ff;color:#2563eb;"><i class="fas fa-percent"></i> Calculadora tributaria</span>
        </div>

        <!-- Limpiar datos -->
        <div class="tool-card" onclick="HerramientasModule.limpiarDatos()" style="border-color:#fecaca;">
          <div class="tool-card-icon" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-trash-alt"></i></div>
          <h4 style="color:#dc2626;">Limpiar Datos de Prueba</h4>
          <p>Elimina todos los datos de ventas, clientes y productos de demostración del sistema.</p>
          <span class="tool-badge" style="background:#fef2f2;color:#dc2626;"><i class="fas fa-exclamation-triangle"></i> Acción irreversible</span>
        </div>

      </div>

      <!-- Estado del sistema -->
      <div class="card mt-5">
        <div class="card-header"><span class="card-title"><i class="fas fa-info-circle" style="color:var(--accent);margin-right:6px;"></i>Estado del Sistema</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
            ${[
              { label:'Productos', count:DB.productos.length, icon:'fas fa-boxes', color:'#2563eb' },
              { label:'Clientes', count:DB.clientes.filter(c=>c.tipo_cliente==='cliente').length, icon:'fas fa-users', color:'#16a34a' },
              { label:'Ventas', count:DB.ventas.length, icon:'fas fa-file-invoice', color:'#7c3aed' },
              { label:'Cotizaciones', count:(DB.cotizaciones||[]).length, icon:'fas fa-file-alt', color:'#d97706' },
              { label:'Eventos Agenda', count:(DB.agenda||[]).filter(a=>!a.completado).length, icon:'fas fa-calendar', color:'#0ea5e9' },
              { label:'Movs. Kardex', count:(DB.kardex||[]).length, icon:'fas fa-history', color:'#dc2626' },
            ].map(s=>`
              <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--gray-50);border-radius:var(--radius);">
                <i class="${s.icon}" style="font-size:24px;color:${s.color};"></i>
                <div><div style="font-size:22px;font-weight:800;">${s.count}</div><div style="font-size:12px;color:var(--gray-500);">${s.label}</div></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ---- BACKUP ----
  backup() {
    const data = {
      version: '1.0',
      fecha: new Date().toISOString(),
      empresa: DB.empresa,
      clientes: DB.clientes,
      productos: DB.productos,
      ventas: DB.ventas,
      cotizaciones: DB.cotizaciones||[],
      cuentasCorriente: DB.cuentasCorriente||[],
      kardex: DB.kardex||[],
      agenda: DB.agenda||[],
      notasCredito: DB.notasCredito||[],
      _sequences: DB._sequences
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `backup-jumila-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('✅ Respaldo descargado correctamente', 'success');
  },

  restaurar() {
    document.getElementById('restoreFile')?.click();
  },

  _cargarBackup(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        if (confirm(`¿Restaurar respaldo del ${data.fecha?.slice(0,10)}?\nEsto sobreescribirá los datos actuales.`)) {
          if (data.empresa)          DB.empresa          = data.empresa;
          if (data.clientes)         DB.clientes         = data.clientes;
          if (data.productos)        DB.productos        = data.productos;
          if (data.ventas)           DB.ventas           = data.ventas;
          if (data.cotizaciones)     DB.cotizaciones     = data.cotizaciones;
          if (data.cuentasCorriente) DB.cuentasCorriente = data.cuentasCorriente;
          if (data.kardex)           DB.kardex           = data.kardex;
          if (data.agenda)           DB.agenda           = data.agenda;
          if (data.notasCredito)     DB.notasCredito     = data.notasCredito;
          if (data._sequences)       DB._sequences       = data._sequences;
          App.toast('✅ Respaldo restaurado exitosamente', 'success');
          App.navigate('inicio');
        }
      } catch { App.toast('Archivo de respaldo inválido', 'error'); }
    };
    reader.readAsText(file);
  },

  // ---- IMPORTAR PRODUCTOS CSV ----
  importarProductos() {
    App.showModal('Importar Productos desde CSV', `
      <div style="background:var(--gray-50);padding:14px;border-radius:8px;margin-bottom:16px;font-size:13px;">
        <strong>Formato del archivo CSV:</strong><br/>
        <code style="font-size:11px;">codigo,nombre,categoria,precio_venta,precio_compra,stock,unidad</code><br/>
        <div style="margin-top:8px;"><button class="btn btn-outline btn-sm" onclick="HerramientasModule._descargarPlantilla()"><i class="fas fa-download"></i> Descargar Plantilla</button></div>
      </div>
      <div class="form-group">
        <label class="form-label">Pegar datos CSV aquí:</label>
        <textarea class="form-control" id="csvImport" rows="8" placeholder="codigo,nombre,categoria,precio_venta,precio_compra,stock,unidad
PROD100,Producto ejemplo,Alimentos,10.00,7.00,50,UND"></textarea>
      </div>`, [
      { text:'Importar', cls:'btn-success', cb:()=>this._procesarCSV() }
    ]);
  },

  _descargarPlantilla() {
    const csv='codigo,nombre,categoria,precio_venta,precio_compra,stock,unidad\nPROD100,Producto Ejemplo,Alimentos,10.00,7.00,50,UND\n';
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='plantilla-productos.csv'; a.click();
  },

  _procesarCSV() {
    const raw=document.getElementById('csvImport')?.value?.trim();
    if (!raw) { App.toast('Ingrese datos CSV','error'); return; }
    const lines=raw.split('\n').filter(l=>l.trim());
    const header=lines[0].toLowerCase().split(',');
    let importados=0, errores=0;
    lines.slice(1).forEach(line => {
      const cols=line.split(',').map(c=>c.trim());
      if (cols.length<4) { errores++; return; }
      const maxId=Math.max(...DB.productos.map(p=>p.id),0);
      DB.productos.push({
        id:maxId+importados+1,
        codigo:cols[0]||`PROD${maxId+importados+1}`,
        nombre:cols[1]||'Sin nombre',
        categoria:cols[2]||'General',
        precio_venta:parseFloat(cols[3])||0,
        precio_compra:parseFloat(cols[4])||0,
        stock:parseInt(cols[5])||0,
        unidad:cols[6]||'UND',
        igv:true,
        descripcion:''
      });
      importados++;
    });
    App.toast(`✅ ${importados} productos importados. ${errores>0?errores+' errores.':''}`, 'success');
    App.closeModal(); App.renderPage();
  },

  // ---- EXPORTAR PRODUCTOS CSV ----
  exportarProductos() {
    const header='Codigo,Nombre,Categoria,Precio Venta,Precio Compra,Stock,Unidad\n';
    const rows=DB.productos.map(p=>`${p.codigo},"${p.nombre}",${p.categoria},${p.precio_venta},${p.precio_compra},${p.stock},${p.unidad}`).join('\n');
    const csv=header+rows;
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`productos-jumila-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    App.toast('✅ Productos exportados en CSV', 'success');
  },

  // ---- EXPORTAR VENTAS CSV ----
  exportarVentas() {
    const header='Fecha,Hora,Comprobante,Cliente,Total,Estado\n';
    const rows=DB.ventas.map(v=>{
      const cli=DB.clientes.find(c=>c.id===v.cliente_id);
      return `${v.fecha},${v.hora},${v.serie}-${v.numero},"${cli?.nombre||'N/A'}",${v.total},${v.estado}`;
    }).join('\n');
    const csv=header+rows;
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=`ventas-jumila-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    App.toast('✅ Ventas exportadas en CSV', 'success');
  },

  // ---- WHATSAPP MASIVO ----
  whatsappMasivo() {
    App.showModal('📱 Enviar Mensaje a Clientes', `
      <div class="form-group mb-4">
        <label class="form-label">Tipo de Mensaje</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${[
            {id:'promo',label:'🎁 Promoción',template:`Estimado/a cliente, le informamos que tenemos PROMOCIONES ESPECIALES en ${DB.empresa.nombre}. Venga y ahorre. ¡Lo esperamos!`},
            {id:'cobro',label:'💰 Recordatorio de Pago',template:`Estimado/a cliente, le recordamos que tiene un saldo pendiente. Por favor comuníquese con nosotros. — ${DB.empresa.nombre}`},
            {id:'nuevo',label:'🆕 Nuevo Producto',template:`Estimado/a cliente, tenemos NUEVOS PRODUCTOS disponibles en ${DB.empresa.nombre}. ¡Visítenos!`},
            {id:'custom',label:'✍️ Personalizado',template:''},
          ].map(t=>`<button class="btn btn-outline btn-sm" onclick="document.getElementById('waMsg').value='${t.template.replace(/'/g,'\\\'')}'">
            ${t.label}
          </button>`).join('')}
        </div>
      </div>
      <div class="form-group mb-4">
        <label class="form-label">Mensaje <span class="required">*</span></label>
        <textarea class="form-control" id="waMsg" rows="4" placeholder="Escriba su mensaje aquí..."></textarea>
      </div>
      <div style="padding:12px;background:#f0fdf4;border-radius:8px;font-size:12px;color:#16a34a;">
        <i class="fab fa-whatsapp"></i> Se abrirá WhatsApp Web con el mensaje listo para enviar a cada cliente.
      </div>`, [
      { text:'<i class="fab fa-whatsapp"></i> Abrir WhatsApp', cls:'btn-whatsapp', cb:()=>{
        const msg=document.getElementById('waMsg')?.value?.trim();
        if (!msg) { App.toast('Escriba un mensaje','error'); return; }
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank');
        App.closeModal();
      }}
    ]);
  },

  // ---- CALCULADORA IGV ----
  calculadora() {
    App.showModal('🧮 Calculadora Tributaria', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div>
          <h4 style="margin-bottom:12px;font-size:14px;">💰 Precio sin IGV → con IGV</h4>
          <div class="form-group mb-3">
            <label class="form-label">Precio sin IGV (S/)</label>
            <input class="form-control" id="calc_sin_igv" type="number" step="0.01" placeholder="0.00" oninput="HerramientasModule._calcIGV()"/>
          </div>
          <div id="calc_resultado1" style="background:var(--gray-50);padding:12px;border-radius:8px;font-size:13px;min-height:80px;">
            Ingrese un precio para ver el cálculo
          </div>
        </div>
        <div>
          <h4 style="margin-bottom:12px;font-size:14px;">🏷️ Precio con IGV → sin IGV</h4>
          <div class="form-group mb-3">
            <label class="form-label">Precio con IGV (S/)</label>
            <input class="form-control" id="calc_con_igv" type="number" step="0.01" placeholder="0.00" oninput="HerramientasModule._calcSinIGV()"/>
          </div>
          <div id="calc_resultado2" style="background:var(--gray-50);padding:12px;border-radius:8px;font-size:13px;min-height:80px;">
            Ingrese un precio para ver el cálculo
          </div>
        </div>
      </div>
      <hr style="margin:16px 0;"/>
      <h4 style="margin-bottom:12px;font-size:14px;">📊 Calculadora de Margen de Ganancia</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        <div class="form-group">
          <label class="form-label">Precio Compra (S/)</label>
          <input class="form-control" id="mg_compra" type="number" step="0.01" placeholder="0.00" oninput="HerramientasModule._calcMargen()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Margen de Ganancia (%)</label>
          <input class="form-control" id="mg_margen" type="number" step="1" value="30" oninput="HerramientasModule._calcMargen()"/>
        </div>
        <div class="form-group">
          <label class="form-label">Precio Venta Sugerido</label>
          <input class="form-control" id="mg_resultado" type="number" step="0.01" disabled style="background:#f0fdf4;font-weight:800;color:#16a34a;font-size:16px;"/>
        </div>
      </div>`, []);
  },

  _calcIGV() {
    const v=parseFloat(document.getElementById('calc_sin_igv')?.value)||0;
    const igv=v*0.18; const total=v+igv;
    const el=document.getElementById('calc_resultado1');
    if (el && v>0) el.innerHTML=`<div>Precio base: <strong>S/ ${v.toFixed(2)}</strong></div><div>IGV 18%: <strong style="color:#dc2626;">S/ ${igv.toFixed(2)}</strong></div><div style="font-size:16px;font-weight:800;color:#16a34a;margin-top:8px;">Total: S/ ${total.toFixed(2)}</div>`;
  },

  _calcSinIGV() {
    const v=parseFloat(document.getElementById('calc_con_igv')?.value)||0;
    const base=v/1.18; const igv=v-base;
    const el=document.getElementById('calc_resultado2');
    if (el && v>0) el.innerHTML=`<div>Precio sin IGV: <strong>S/ ${base.toFixed(2)}</strong></div><div>IGV 18%: <strong style="color:#dc2626;">S/ ${igv.toFixed(2)}</strong></div><div style="font-size:16px;font-weight:800;color:#16a34a;margin-top:8px;">Total: S/ ${v.toFixed(2)}</div>`;
  },

  _calcMargen() {
    const compra=parseFloat(document.getElementById('mg_compra')?.value)||0;
    const margen=parseFloat(document.getElementById('mg_margen')?.value)||0;
    const venta=compra*(1+margen/100);
    const el=document.getElementById('mg_resultado'); if (el) el.value=venta.toFixed(2);
  },

  // ---- LIMPIAR DATOS ----
  limpiarDatos() {
    App.showModal('⚠️ Limpiar Datos de Prueba', `
      <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:8px;padding:16px;text-align:center;">
        <i class="fas fa-exclamation-triangle" style="font-size:36px;color:#dc2626;display:block;margin-bottom:12px;"></i>
        <strong style="font-size:16px;color:#dc2626;">¡ATENCIÓN!</strong>
        <p style="margin-top:8px;font-size:13px;color:#7f1d1d;">Esta acción eliminará TODOS los datos de ventas, compras, kardex y otros registros. Los productos y clientes se mantendrán.</p>
        <p style="margin-top:8px;font-size:13px;font-weight:700;">Esta acción no se puede deshacer.</p>
      </div>`, [
      { text:'❌ Cancelar', cls:'btn-outline', cb:()=>App.closeModal() },
      { text:'🗑️ Sí, Limpiar', cls:'btn-danger', cb:()=>{
        DB.ventas=[]; DB.compras=[]; DB.kardex=[]; DB.notasCredito=[]; DB.cotizaciones=[];
        DB.cuentasCorriente=[]; DB._sequences={NV03:1,BV03:1,FC01:1}; DB._cotSeq=1;
        App.toast('✅ Datos limpiados. El sistema está listo para uso real.','success');
        App.closeModal(); App.navigate('inicio');
      }}
    ]);
  }
};