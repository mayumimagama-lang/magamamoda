// ============================================================
// MÓDULO: PRODUCTOS / SERVICIOS — Versión Profesional
// ============================================================

const ProductosModule = {
  searchTerm:      '',
  currentPage:     1,
  itemsPerPage:    10,
  categoriaFilter: 'todos',
  stockFilter:     'todos',
  sortBy:          'nombre',
  sortDir:         'asc',
  seleccionados:   [],

  // ─── GOOGLE SHEETS SYNC ───
  SHEET_URL: 'https://script.google.com/macros/s/AKfycbxkbrM53RlXDKNyDtQUTQ1dB0kzG0o3XP3KSm_hGXybJsa98zzgBqtOqyfMomCsGHT2MQ/exec',

  // accion: 'addProducto' | 'updateProducto' | 'deleteProducto'
  _syncSheet(accion, params) {
    var self = this;
    fetch(self.SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: accion, ...params })
    })
    .then(function(r){ return r.json(); })
    .then(function(d){ console.log('✅ Sheets [' + accion + '] OK:', d); })
    .catch(function(e){ console.warn('⚠ Sheets [' + accion + '] error:', e); });
  },

  // Construye el objeto de params que espera el Apps Script
  _sheetParams(p) {
    return {
      id:        p.id,
      nombre:    p.nombre,
      categoria: p.categoria || 'General',
      precio:    p.precio_venta,
      stock:     p.stock,
      imagen:    p.imagen || ''
    };
  },

  // ─── RENDER ───
  render() {
    App.setTabs2('Productos / Servicios', 'INVENTARIO');
    const filtered  = this.getFiltered();
    const paged     = this.getPaged(filtered);
    const valorTotal = DB.productos.reduce((s,p) => s + p.stock * p.precio_venta, 0);
    const prodsConPrecio = DB.productos.filter(p => p.precio_venta > 0);
    const margenProm = prodsConPrecio.length
      ? prodsConPrecio.reduce((s,p) => s + (p.precio_venta - p.precio_compra)/p.precio_venta*100, 0) / prodsConPrecio.length
      : 0;
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));

    const kpis = [
      { icon:'fa-boxes',               bg:'#eff6ff',color:'#2563eb', val:DB.productos.length,                                               label:'Total Productos',   click:"ProductosModule.stockFilter='todos';App.renderPage();" },
      { icon:'fa-check-circle',        bg:'#f0fdf4',color:'#16a34a', val:DB.productos.filter(p=>p.stock>(p.stock_minimo||10)).length,         label:'Stock Normal',      click:"ProductosModule.stockFilter='ok';App.renderPage();" },
      { icon:'fa-exclamation-triangle',bg:'#fffbeb',color:'#d97706', val:DB.productos.filter(p=>p.stock>0&&p.stock<=(p.stock_minimo||10)).length, label:'Stock Bajo',    click:"ProductosModule.stockFilter='bajo';App.renderPage();" },
      { icon:'fa-times-circle',        bg:'#fef2f2',color:'#dc2626', val:DB.productos.filter(p=>p.stock===0).length,                          label:'Sin Stock',        click:"ProductosModule.stockFilter='agotado';App.renderPage();" },
      { icon:'fa-dollar-sign',         bg:'#f0fdf4',color:'#16a34a', val:'S/ '+valorTotal.toFixed(2),                                         label:'Valor Inventario', click:'' },
      { icon:'fa-percentage',          bg:'#fdf4ff',color:'#7c3aed', val:margenProm.toFixed(1)+'%',                                           label:'Margen Promedio',  click:'' },
    ];

    // Columnas de la tabla
    const cols = [
      { key:'codigo',       label:'Código' },
      { key:'nombre',       label:'Producto / Servicio' },
      { key:'categoria',    label:'Categoría' },
      { key:'precio_venta', label:'P. Venta' },
      { key:'precio_compra',label:'P. Compra' },
      { key:'margen',       label:'Margen' },
      { key:'stock',        label:'Stock' },
      { key:'estado',       label:'Estado' },
    ];

    return `
    <div class="page-header">
      <div>
        <h2 class="page-title"><i class="fas fa-boxes" style="color:var(--accent);margin-right:8px;"></i>Productos / Servicios</h2>
        <p class="text-muted text-sm">${DB.productos.length} productos · Valor inventario: <strong style="color:var(--success);">S/ ${valorTotal.toFixed(2)}</strong></p>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline" onclick="ProductosModule.importarCSV()"><i class="fas fa-file-upload"></i> Importar</button>
        <button class="btn btn-outline" onclick="ProductosModule.exportarCSV()"><i class="fas fa-file-download"></i> Exportar</button>
        <button class="btn btn-outline" onclick="ProductosModule.imprimirCatalogo()"><i class="fas fa-print"></i> Imprimir</button>
        <button class="btn btn-success" onclick="ProductosModule.nuevo()"><i class="fas fa-plus"></i> Nuevo Producto</button>
      </div>
    </div>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px;">
      ${kpis.map(k => `
        <div class="stat-card" ${k.click ? 'onclick="'+k.click+'" style="cursor:pointer;"' : ''}>
          <div class="stat-icon" style="background:${k.bg};color:${k.color};"><i class="fas ${k.icon}"></i></div>
          <div class="stat-info"><div class="stat-value">${k.val}</div><div class="stat-label">${k.label}</div></div>
        </div>`).join('')}
    </div>

    <div class="card">
      <div class="card-body" style="padding-bottom:0;">
        <!-- Filtros -->
        <div class="filter-row mb-3" style="flex-wrap:wrap;gap:10px;">
          <div class="search-bar" style="flex:1;min-width:200px;max-width:300px;">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Nombre, código, categoría..." value="${this.searchTerm}"
              oninput="ProductosModule.search(this.value)" id="prodSearchInput"/>
          </div>
          <div class="filter-group">
            <label>CATEGORÍA</label>
            <select class="filter-select" onchange="ProductosModule.setCategoria(this.value)">
              ${this.getCategorias().map(c => '<option value="'+c+'" '+(this.categoriaFilter===c?'selected':'')+'>'+( c==='todos'?'Todas las categorías':c)+'</option>').join('')}
            </select>
          </div>
          <div class="filter-group">
            <label>ESTADO STOCK</label>
            <select class="filter-select" onchange="ProductosModule.stockFilter=this.value;ProductosModule.currentPage=1;App.renderPage();">
              <option value="todos"   ${this.stockFilter==='todos'  ?'selected':''}>Todos</option>
              <option value="ok"      ${this.stockFilter==='ok'     ?'selected':''}>✓ Stock Normal</option>
              <option value="bajo"    ${this.stockFilter==='bajo'   ?'selected':''}>⚠ Stock Bajo</option>
              <option value="agotado" ${this.stockFilter==='agotado'?'selected':''}>✗ Agotados</option>
            </select>
          </div>
          <div class="filter-group">
            <label>MOSTRAR</label>
            <select class="filter-select" style="width:70px;" onchange="ProductosModule.itemsPerPage=parseInt(this.value);ProductosModule.currentPage=1;App.renderPage();">
              ${[10,25,50,100].map(n => '<option value="'+n+'" '+(this.itemsPerPage===n?'selected':'')+'>'+n+'</option>').join('')}
            </select>
          </div>
          ${this.seleccionados.length > 0 ? `
          <div style="display:flex;gap:6px;align-items:flex-end;">
            <button class="btn btn-danger btn-sm" onclick="ProductosModule.eliminarSeleccionados()">
              <i class="fas fa-trash"></i> Eliminar (${this.seleccionados.length})
            </button>
            <button class="btn btn-outline btn-sm" onclick="ProductosModule.exportarSeleccionados()">
              <i class="fas fa-download"></i> Exportar sel.
            </button>
          </div>` : ''}
          <span class="text-sm text-muted" style="align-self:flex-end;">${filtered.length} registros</span>
        </div>

        <!-- Filtros activos -->
        ${this.stockFilter !== 'todos' || this.categoriaFilter !== 'todos' || this.searchTerm ? `
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
          <span style="font-size:11px;color:var(--gray-500);font-weight:700;">Filtros:</span>
          ${this.searchTerm ? '<span class="badge badge-info" style="cursor:pointer;" onclick="ProductosModule.search(\'\')" title="Quitar filtro"><i class="fas fa-search"></i> "'+this.searchTerm+'" ×</span>' : ''}
          ${this.categoriaFilter !== 'todos' ? '<span class="badge badge-info" style="cursor:pointer;" onclick="ProductosModule.setCategoria(\'todos\')" title="Quitar filtro"><i class="fas fa-tag"></i> '+this.categoriaFilter+' ×</span>' : ''}
          ${this.stockFilter !== 'todos' ? '<span class="badge badge-warning" style="cursor:pointer;" onclick="ProductosModule.stockFilter=\'todos\';App.renderPage();" title="Quitar filtro">'+this.stockFilter+' ×</span>' : ''}
          <button class="btn btn-outline btn-sm" style="padding:2px 8px;font-size:11px;" onclick="ProductosModule.limpiarFiltros()">
            <i class="fas fa-times"></i> Limpiar todo</button>
        </div>` : ''}
      </div>

      <!-- TABLA -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:36px;">
                <input type="checkbox" id="chkTodos" style="width:15px;height:15px;cursor:pointer;"
                  onchange="ProductosModule.seleccionarTodos(this.checked)"
                  ${this.seleccionados.length>0 && this.seleccionados.length>=paged.length?'checked':''}/>
              </th>
              ${cols.map(col => `
              <th style="cursor:pointer;user-select:none;white-space:nowrap;" onclick="ProductosModule.ordenar('${col.key}')">
                ${col.label}
                <i class="fas ${this.sortBy===col.key ? 'fa-sort-'+(this.sortDir==='asc'?'up':'down') : 'fa-sort'}" 
                  style="${this.sortBy===col.key?'color:var(--accent);':'opacity:0.3;'}margin-left:4px;"></i>
              </th>`).join('')}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${paged.length === 0 ? `
              <tr><td colspan="10">
                <div class="empty-state">
                  <i class="fas fa-search"></i><p>No se encontraron productos</p>
                  <button class="btn btn-outline btn-sm" onclick="ProductosModule.limpiarFiltros()" style="margin-top:10px;">
                    <i class="fas fa-times"></i> Limpiar filtros</button>
                </div>
              </td></tr>` :
              paged.map(p => {
                const margen   = p.precio_venta > 0 ? (p.precio_venta - p.precio_compra)/p.precio_venta*100 : 0;
                const stockMin = p.stock_minimo || 10;
                const agotado  = p.stock === 0;
                const bajo     = !agotado && p.stock <= stockMin;
                const checked  = this.seleccionados.includes(p.id);
                const imgSrc   = p.imagen || '';
                const mClr     = margen>=30?'#16a34a':margen>=15?'#d97706':'#dc2626';
                const estBg    = agotado?'#fee2e2':bajo?'#fef3c7':'#dcfce7';
                const estClr   = agotado?'#dc2626':bajo?'#d97706':'#16a34a';
                const estLabel = agotado?'✗ Agotado':bajo?'⚠ Bajo':'✓ Activo';
                return `
                <tr style="${checked?'background:var(--gray-50);':''}">
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <input type="checkbox" style="width:17px;height:17px;cursor:pointer;"
                      ${checked?'checked':''} onchange="ProductosModule.toggleSeleccion(${p.id},this.checked)"/>
                  </td>
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <span style="font-family:monospace;font-size:13px;font-weight:700;
                      background:var(--gray-100);color:var(--gray-600);
                      padding:5px 10px;border-radius:6px;white-space:nowrap;">${p.codigo}</span>
                  </td>
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <div style="display:flex;align-items:center;gap:18px;">
                      ${imgSrc
                        ? `<img src="${imgSrc}"
                            style="width:90px;height:90px;object-fit:cover;border-radius:14px;
                              flex-shrink:0;border:2px solid var(--gray-200);
                              box-shadow:0 4px 12px rgba(0,0,0,0.15);" alt="${p.nombre}"/>`
                        : `<div style="width:90px;height:90px;border-radius:14px;
                              background:var(--gray-100);display:flex;flex-direction:column;
                              align-items:center;justify-content:center;flex-shrink:0;
                              border:2px dashed var(--gray-300);">
                              <i class="fas fa-image" style="font-size:26px;color:var(--gray-300);margin-bottom:5px;"></i>
                              <span style="font-size:10px;color:var(--gray-400);font-weight:700;">SIN FOTO</span>
                            </div>`
                      }
                      <div>
                        <div style="font-size:18px;font-weight:900;color:var(--gray-900);margin-bottom:6px;line-height:1.2;">${p.nombre}</div>
                        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:6px;">
                          <span style="background:var(--gray-200);color:var(--gray-700);font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px;">${p.unidad}</span>
                          <span style="background:${p.igv?'#dbeafe':'#dcfce7'};color:${p.igv?'#1d4ed8':'#15803d'};font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px;">${p.igv?'IGV 18%':'Sin IGV'}</span>
                          ${p.barcode?`<span style="background:var(--gray-100);color:var(--gray-500);font-size:12px;font-weight:600;padding:3px 10px;border-radius:6px;"><i class='fas fa-barcode' style='margin-right:4px;'></i>${p.barcode}</span>`:''}
                        </div>
                        ${p.descripcion?`<div style="font-size:13px;color:var(--gray-400);font-style:italic;line-height:1.4;">${p.descripcion.substring(0,60)}${p.descripcion.length>60?'...':''}</div>`:''}
                      </div>
                    </div>
                  </td>
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <span style="font-size:14px;font-weight:700;color:var(--gray-700);">${p.categoria}</span>
                  </td>
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <div style="font-size:20px;font-weight:900;color:var(--accent);">S/ ${p.precio_venta.toFixed(2)}</div>
                  </td>
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <div style="font-size:15px;font-weight:600;color:var(--gray-500);">S/ ${p.precio_compra.toFixed(2)}</div>
                  </td>
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <div style="display:flex;flex-direction:column;gap:5px;">
                      <span style="font-weight:900;color:${mClr};font-size:16px;">${margen.toFixed(1)}%</span>
                      <div style="width:60px;height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden;">
                        <div style="width:${Math.min(100,margen)}%;height:100%;background:${mClr};border-radius:4px;"></div>
                      </div>
                    </div>
                  </td>
                  <td style="padding:18px 14px;vertical-align:middle;">${this.stockBadge(p.stock, stockMin)}</td>
                  <td style="padding:18px 14px;vertical-align:middle;">
                    <span style="padding:7px 16px;border-radius:20px;font-size:13px;font-weight:800;background:${estBg};color:${estClr};">${estLabel}</span>
                  </td>
                  <td>
                    <div class="action-menu-wrapper">
                      <button class="action-menu-btn" onclick="ProductosModule.toggleMenu(${p.id})">
                        <i class="fas fa-ellipsis-v"></i>
                      </button>
                      <div class="action-menu hidden" id="menu-prod-${p.id}">
                        <button class="action-menu-item" onclick="ProductosModule.ver(${p.id})"><i class="fas fa-eye"></i> Ver detalle</button>
                        <button class="action-menu-item" onclick="ProductosModule.editar(${p.id})"><i class="fas fa-edit"></i> Editar</button>
                        <button class="action-menu-item" onclick="ProductosModule.duplicar(${p.id})"><i class="fas fa-copy"></i> Duplicar</button>
                        <button class="action-menu-item" onclick="ProductosModule.ajustarStock(${p.id})"><i class="fas fa-layer-group"></i> Ajustar Stock</button>
                        <button class="action-menu-item" onclick="ProductosModule.verHistorial(${p.id})"><i class="fas fa-history"></i> Historial ventas</button>
                        <div style="border-top:1px solid var(--gray-200);margin:4px 0;"></div>
                        <button class="action-menu-item danger" onclick="ProductosModule.eliminar(${p.id})"><i class="fas fa-trash"></i> Eliminar</button>
                      </div>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>

      <!-- PAGINACIÓN -->
      <div class="pagination">
        <span class="text-sm text-muted">
          ${Math.min((this.currentPage-1)*this.itemsPerPage+1,filtered.length)}–${Math.min(this.currentPage*this.itemsPerPage,filtered.length)} de ${filtered.length}
        </span>
        <button class="pagination-btn" onclick="ProductosModule.goPage(1)" ${this.currentPage===1?'disabled':''}><i class="fas fa-angle-double-left"></i></button>
        <button class="pagination-btn" onclick="ProductosModule.prevPage()" ${this.currentPage===1?'disabled':''}><i class="fas fa-chevron-left"></i></button>
        ${Array.from({length:Math.min(5,totalPages)},(_,i)=>{
          const start = Math.max(1,Math.min(this.currentPage-2,totalPages-4));
          const page  = start+i;
          if(page>totalPages) return '';
          return '<button class="pagination-btn '+(page===this.currentPage?'active':'')+'" onclick="ProductosModule.goPage('+page+')">'+page+'</button>';
        }).join('')}
        <button class="pagination-btn" onclick="ProductosModule.nextPage()" ${this.currentPage===totalPages?'disabled':''}><i class="fas fa-chevron-right"></i></button>
        <button class="pagination-btn" onclick="ProductosModule.goPage(${totalPages})" ${this.currentPage===totalPages?'disabled':''}><i class="fas fa-angle-double-right"></i></button>
      </div>
    </div>`;
  },

  // ─── DATOS ───
  getCategorias() {
    return ['todos', ...[...new Set(DB.productos.map(p=>p.categoria))].sort()];
  },

  getFiltered() {
    const term = this.searchTerm.toLowerCase();
    return DB.productos.filter(p => {
      const ms = !term || p.nombre.toLowerCase().includes(term) || p.codigo.toLowerCase().includes(term) || (p.categoria||'').toLowerCase().includes(term) || (p.descripcion||'').toLowerCase().includes(term);
      const mc = this.categoriaFilter==='todos' || p.categoria===this.categoriaFilter;
      const sm = p.stock_minimo||10;
      const mk = this.stockFilter==='todos' || (this.stockFilter==='ok' && p.stock>sm) || (this.stockFilter==='bajo' && p.stock>0 && p.stock<=sm) || (this.stockFilter==='agotado' && p.stock===0);
      return ms && mc && mk;
    }).sort((a,b) => {
      let va = this.sortBy==='margen' ? (a.precio_venta>0?(a.precio_venta-a.precio_compra)/a.precio_venta:0) : this.sortBy==='estado' ? a.stock : a[this.sortBy];
      let vb = this.sortBy==='margen' ? (b.precio_venta>0?(b.precio_venta-b.precio_compra)/b.precio_venta:0) : this.sortBy==='estado' ? b.stock : b[this.sortBy];
      if(typeof va==='string') va=va.toLowerCase();
      if(typeof vb==='string') vb=vb.toLowerCase();
      return va<vb ? (this.sortDir==='asc'?-1:1) : va>vb ? (this.sortDir==='asc'?1:-1) : 0;
    });
  },

  getPaged(f) { const s=(this.currentPage-1)*this.itemsPerPage; return f.slice(s,s+this.itemsPerPage); },
  ordenar(col) { if(this.sortBy===col){this.sortDir=this.sortDir==='asc'?'desc':'asc';}else{this.sortBy=col;this.sortDir='asc';} App.renderPage(); },
  search(v) {
    this.searchTerm = v;
    this.currentPage = 1;
    // Debounce: esperar 300ms antes de re-renderizar
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(function() {
      var cursorPos = 0;
      var input = document.getElementById('prodSearchInput');
      if (input) cursorPos = input.selectionStart;
      App.renderPage();
      // Restaurar foco y posición del cursor
      setTimeout(function() {
        var newInput = document.getElementById('prodSearchInput');
        if (newInput) {
          newInput.focus();
          try { newInput.setSelectionRange(cursorPos, cursorPos); } catch(e) {}
        }
      }, 20);
    }, 280);
  },
  setCategoria(v) { this.categoriaFilter=v; this.currentPage=1; App.renderPage(); },
  prevPage()      { if(this.currentPage>1){this.currentPage--;App.renderPage();} },
  nextPage()      { const t=Math.ceil(this.getFiltered().length/this.itemsPerPage); if(this.currentPage<t){this.currentPage++;App.renderPage();} },
  goPage(p)       { this.currentPage=p; App.renderPage(); },
  limpiarFiltros(){ this.searchTerm=''; this.categoriaFilter='todos'; this.stockFilter='todos'; this.seleccionados=[]; this.currentPage=1; App.renderPage(); },

  // ─── SELECCIÓN MASIVA ───
  toggleSeleccion(id,checked){ if(checked){if(!this.seleccionados.includes(id))this.seleccionados.push(id);}else{this.seleccionados=this.seleccionados.filter(x=>x!==id);} App.renderPage(); },
  seleccionarTodos(checked){ const ids=this.getPaged(this.getFiltered()).map(p=>p.id); if(checked){ids.forEach(id=>{if(!this.seleccionados.includes(id))this.seleccionados.push(id);});}else{this.seleccionados=this.seleccionados.filter(id=>!ids.includes(id));} App.renderPage(); },
  eliminarSeleccionados(){
    if(!this.seleccionados.length) return;
    if(!confirm('¿Eliminar '+this.seleccionados.length+' productos?')) return;
    DB.productos = DB.productos.filter(p => !this.seleccionados.includes(p.id));
    Storage.guardarProductos();
    this.seleccionados.forEach(id => this._syncSheet('deleteProducto', { id: id })); // ← SYNC SHEETS
    App.toast(this.seleccionados.length+' productos eliminados','warning');
    this.seleccionados = [];
    App.renderPage();
  },
  exportarSeleccionados(){ this._descargarCSV(DB.productos.filter(p=>this.seleccionados.includes(p.id)),'productos_seleccionados'); },
  toggleMenu(id){ document.querySelectorAll('.action-menu').forEach(m=>{if(m.id!=='menu-prod-'+id)m.classList.add('hidden');}); document.getElementById('menu-prod-'+id)?.classList.toggle('hidden'); },

  // ─── VER DETALLE ───
  ver(id) {
    const p         = DB.productos.find(x => x.id === id); if (!p) return;
    const margen    = p.precio_venta > 0 ? ((p.precio_venta - p.precio_compra) / p.precio_venta * 100) : 0;
    const utilidad  = p.precio_venta - p.precio_compra;
    const valorStock= p.stock * p.precio_venta;
    const stockMin  = p.stock_minimo || 10;
    const imgSrc    = p.imagen || '';
    const agotado   = p.stock === 0;
    const stockBajo = !agotado && p.stock <= stockMin;
    const mClr      = margen >= 30 ? '#16a34a' : margen >= 15 ? '#d97706' : '#dc2626';
    const sClr      = agotado ? '#dc2626' : stockBajo ? '#d97706' : '#16a34a';
    const sBg       = agotado ? '#fef2f2'  : stockBajo ? '#fffbeb'  : '#f0fdf4';
    const ventasP   = DB.ventas.filter(v => v.items.some(i => i.prod_id === id));
    const unidVend  = ventasP.reduce((s,v) => { const it=v.items.find(i=>i.prod_id===id); return s+(it?it.qty:0); }, 0);

    const kpis1 = [
      { icon:'fa-tag',          label:'Precio de Venta',   val:'S/ '+p.precio_venta.toFixed(2),  color:'#2563eb', bg:'linear-gradient(135deg,#eff6ff,#dbeafe)' },
      { icon:'fa-shopping-cart',label:'Precio de Compra',  val:'S/ '+p.precio_compra.toFixed(2), color:'#475569', bg:'linear-gradient(135deg,var(--gray-50),var(--gray-100))' },
      { icon:'fa-dollar-sign',  label:'Utilidad Unitaria', val:'S/ '+utilidad.toFixed(2),        color:'#16a34a', bg:'linear-gradient(135deg,#f0fdf4,#dcfce7)' },
    ];

    const html = `
      <div style="display:grid;grid-template-columns:600px 1fr;gap:28px;align-items:start;">

        <!-- COL IZQUIERDA: imagen 600x600 -->
        <div style="flex-shrink:0;">
          ${imgSrc
            ? `<img src="${imgSrc}" alt="${p.nombre}"
                 style="width:600px;height:600px;object-fit:cover;border-radius:20px;
                   border:4px solid var(--gray-200);display:block;
                   box-shadow:0 12px 40px rgba(0,0,0,0.25);"/>`
            : `<div style="width:600px;height:600px;border-radius:20px;background:var(--gray-100);
                 display:flex;flex-direction:column;align-items:center;justify-content:center;
                 border:4px dashed var(--gray-300);">
                 <i class="fas fa-image" style="font-size:80px;color:var(--gray-300);margin-bottom:14px;"></i>
                 <span style="font-size:18px;color:var(--gray-400);font-weight:700;">SIN FOTO</span>
                 <span style="font-size:13px;color:var(--gray-400);margin-top:6px;">Editar para agregar imagen</span>
               </div>`
          }
        </div>

        <!-- COL DERECHA: toda la info -->
        <div style="display:flex;flex-direction:column;gap:16px;min-width:0;">

          <!-- Nombre + badges + estado -->
          <div>
            <div style="font-size:24px;font-weight:900;color:var(--gray-900);margin-bottom:10px;line-height:1.2;">${p.nombre}</div>
            <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;">
              <span style="background:var(--gray-200);color:var(--gray-700);font-size:12px;font-weight:700;padding:4px 12px;border-radius:8px;"><i class="fas fa-barcode" style="margin-right:4px;"></i>${p.codigo}</span>
              <span style="background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:700;padding:4px 12px;border-radius:8px;"><i class="fas fa-tag" style="margin-right:4px;"></i>${p.categoria}</span>
              <span style="background:var(--gray-200);color:var(--gray-700);font-size:12px;font-weight:700;padding:4px 12px;border-radius:8px;">${p.unidad}</span>
              <span style="background:${p.igv?'#dbeafe':'#dcfce7'};color:${p.igv?'#1d4ed8':'#15803d'};font-size:12px;font-weight:700;padding:4px 12px;border-radius:8px;">${p.igv?'IGV 18%':'Sin IGV'}</span>
            </div>
            ${p.descripcion?`<div style="font-size:14px;color:var(--gray-500);line-height:1.5;margin-bottom:8px;">${p.descripcion}</div>`:''}
            ${p.barcode?`<div style="font-size:12px;color:var(--gray-400);margin-bottom:8px;"><i class="fas fa-barcode" style="margin-right:5px;"></i>${p.barcode}</div>`:''}
            <span style="padding:6px 16px;border-radius:20px;font-size:13px;font-weight:800;background:${sBg};color:${sClr};display:inline-block;">
              ${agotado?'✗ Sin Stock':stockBajo?'⚠ Stock Bajo':'✓ En Stock'} · ${p.stock} ${p.unidad}
            </span>
          </div>

          <!-- Métricas principales (3 tarjetas) -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${kpis1.map(k=>`
            <div style="background:${k.bg};border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(0,0,0,0.06);">
              <i class="fas ${k.icon}" style="font-size:22px;color:${k.color};margin-bottom:8px;display:block;"></i>
              <div style="font-size:22px;font-weight:900;color:${k.color};line-height:1;">${k.val}</div>
              <div style="font-size:11px;color:var(--gray-500);margin-top:5px;font-weight:700;text-transform:uppercase;">${k.label}</div>
            </div>`).join('')}
          </div>

          <!-- Métricas secundarias (3 tarjetas) -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            <div style="background:linear-gradient(135deg,#fdf4ff,#ede9fe);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(124,58,237,0.15);">
              <i class="fas fa-percentage" style="font-size:22px;color:#7c3aed;margin-bottom:8px;display:block;"></i>
              <div style="font-size:22px;font-weight:900;color:${mClr};">${margen.toFixed(1)}%</div>
              <div style="width:70%;height:7px;background:var(--gray-200);border-radius:4px;margin:7px auto 0;">
                <div style="width:${Math.min(100,margen)}%;height:100%;background:${mClr};border-radius:4px;"></div>
              </div>
              <div style="font-size:11px;color:var(--gray-500);margin-top:5px;font-weight:700;text-transform:uppercase;">Margen</div>
            </div>
            <div style="background:${sBg};border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(0,0,0,0.06);">
              <i class="fas fa-layer-group" style="font-size:22px;color:${sClr};margin-bottom:8px;display:block;"></i>
              <div style="font-size:22px;font-weight:900;color:${sClr};">${p.stock} <span style="font-size:14px;">${p.unidad}</span></div>
              <div style="font-size:11px;color:var(--gray-500);margin-top:5px;font-weight:700;text-transform:uppercase;">Stock Actual</div>
            </div>
            <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:12px;padding:16px;text-align:center;border:1px solid rgba(22,163,74,0.15);">
              <i class="fas fa-coins" style="font-size:22px;color:#16a34a;margin-bottom:8px;display:block;"></i>
              <div style="font-size:22px;font-weight:900;color:#16a34a;">S/ ${valorStock.toFixed(2)}</div>
              <div style="font-size:11px;color:var(--gray-500);margin-top:5px;font-weight:700;text-transform:uppercase;">Valor en Stock</div>
            </div>
          </div>

          <!-- Info adicional (2 columnas) -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${p.precio_mayorista?`
            <div style="background:var(--gray-50);border-radius:10px;padding:12px 14px;border:1px solid var(--gray-200);display:flex;align-items:center;gap:10px;">
              <i class="fas fa-boxes" style="color:#d97706;font-size:20px;flex-shrink:0;"></i>
              <div><div style="font-size:16px;font-weight:800;color:#d97706;">S/ ${p.precio_mayorista.toFixed(2)}</div>
              <div style="font-size:11px;color:var(--gray-500);">Precio Mayorista</div></div>
            </div>`:''}
            <div style="background:var(--gray-50);border-radius:10px;padding:12px 14px;border:1px solid var(--gray-200);display:flex;align-items:center;gap:10px;">
              <i class="fas fa-bell" style="color:#d97706;font-size:20px;flex-shrink:0;"></i>
              <div><div style="font-size:16px;font-weight:800;color:#d97706;">${stockMin} ${p.unidad}</div>
              <div style="font-size:11px;color:var(--gray-500);">Stock Mínimo</div></div>
            </div>
            <div style="background:var(--gray-50);border-radius:10px;padding:12px 14px;border:1px solid var(--gray-200);display:flex;align-items:center;gap:10px;">
              <i class="fas fa-chart-line" style="color:#2563eb;font-size:20px;flex-shrink:0;"></i>
              <div><div style="font-size:16px;font-weight:800;color:#2563eb;">${unidVend} ${p.unidad}</div>
              <div style="font-size:11px;color:var(--gray-500);">Total Vendido (${ventasP.length} ventas)</div></div>
            </div>
            <div style="background:var(--gray-50);border-radius:10px;padding:12px 14px;border:1px solid var(--gray-200);display:flex;align-items:center;gap:10px;">
              <i class="fas fa-percent" style="color:#7c3aed;font-size:20px;flex-shrink:0;"></i>
              <div><div style="font-size:16px;font-weight:800;color:#7c3aed;">${p.igv?'18% incluido':'No aplica'}</div>
              <div style="font-size:11px;color:var(--gray-500);">IGV</div></div>
            </div>
          </div>

        </div><!-- fin col derecha -->
      </div><!-- fin grid -->
    `;

    App.showModal('📦 ' + p.nombre, html, [
      { text:'✏️ Editar Producto',  cls:'btn-primary',  cb: () => { App.closeModal(); this.editar(id); } },
      { text:'📦 Ajustar Stock',    cls:'btn-outline',  cb: () => { App.closeModal(); this.ajustarStock(id); } },
      { text:'📊 Historial Ventas', cls:'btn-outline',  cb: () => { App.closeModal(); this.verHistorial(id); } },
    ]);
    document.getElementById('modalBox').style.maxWidth = '1100px';
  },

  // ─── FORMULARIO ───
  nuevo() { App.showModal('Nuevo Producto',this.formHTML({}),[{text:'Guardar',cls:'btn-success',cb:()=>this.guardar()}]); document.getElementById('modalBox').style.maxWidth='820px'; },
  editar(id) { const p=DB.productos.find(x=>x.id===id); App.showModal('Editar Producto',this.formHTML(p||{}),[{text:'Guardar Cambios',cls:'btn-primary',cb:()=>this.guardar(id)}]); document.getElementById('modalBox').style.maxWidth='820px'; },

  formHTML(p) {
    const unidades=['UND','KG','LT','G','ML','MTR','CM','CAJ','DOC','PQT','BLS','ROL'];
    const cats=this.getCategorias().filter(c=>c!=='todos');
    const pv=p.precio_venta||0, pc=p.precio_compra||0;
    const margenInit = pv>0?((pv-pc)/pv*100).toFixed(1):'0.0';
    const utilInit   = (pv-pc).toFixed(2);
    const imgActual  = p.imagen || '';
    return `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <!-- Imagen del producto -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-image" style="color:var(--accent);margin-right:6px;"></i>Imagen del Producto</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:0;">
          <!-- Preview de imagen GRANDE centrado -->
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">
            <div id="imgPreviewWrap"
              onclick="document.getElementById('fp_imagen_file').click()"
              style="width:200px;height:200px;border-radius:16px;border:3px dashed var(--gray-300);
                display:flex;align-items:center;justify-content:center;overflow:hidden;
                background:var(--gray-50);cursor:pointer;transition:all 0.2s;
                box-shadow:0 4px 16px rgba(0,0,0,0.1);"
              onmouseover="this.style.borderColor='var(--accent)';this.style.boxShadow='0 4px 20px rgba(37,99,235,0.25)';"
              onmouseout="this.style.borderColor='var(--gray-300)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';">
              ${imgActual
                ? `<img id="imgPreview" src="${imgActual}" style="width:100%;height:100%;object-fit:cover;border-radius:13px;" alt="Producto"/>`
                : `<div id="imgPreview" style="text-align:center;color:var(--gray-400);pointer-events:none;">
                    <i class="fas fa-image" style="font-size:52px;display:block;margin-bottom:10px;opacity:0.4;"></i>
                    <span style="font-size:13px;font-weight:700;">Clic para subir foto</span>
                    <div style="font-size:11px;margin-top:4px;opacity:0.6;">o arrastra una imagen aquí</div>
                  </div>`
              }
            </div>
            <!-- Botones debajo de la imagen -->
            <input type="file" id="fp_imagen_file" accept="image/*" style="display:none;"
              onchange="ProductosModule._onImageChange(this)"/>
            <input type="hidden" id="fp_imagen" value="${imgActual}"/>
            <div style="display:flex;gap:8px;width:100%;max-width:300px;">
              <button type="button" class="btn btn-primary" style="flex:1;"
                onclick="document.getElementById('fp_imagen_file').click()">
                <i class="fas fa-upload"></i> Subir
              </button>
              <button type="button" class="btn btn-outline" style="flex:1;"
                onclick="ProductosModule._tomarFoto()">
                <i class="fas fa-camera"></i> Cámara
              </button>
              ${imgActual ? `
              <button type="button" class="btn btn-outline" style="color:var(--danger);border-color:var(--danger);padding:9px 12px;"
                onclick="ProductosModule._quitarImagen()" title="Quitar imagen">
                <i class="fas fa-trash"></i>
              </button>` : ''}
            </div>
            <div style="font-size:11px;color:var(--gray-400);text-align:center;line-height:1.6;">
              JPG · PNG · WebP · Máx. 5 MB
            </div>
          </div>
        </div>
      </div>
      <!-- Datos principales -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-info-circle" style="color:var(--accent);margin-right:6px;"></i>Datos del Producto</div>
        <div class="form-grid">
          <div class="form-group"><label class="form-label">Código <span style="font-size:10px;color:var(--gray-400);font-weight:600;">(opcional - se genera automático)</span></label>
            <input class="form-control" id="fp_codigo" placeholder="PROD001" value="${p.codigo||''}"/></div>
          <div class="form-group"><label class="form-label">Código de Barras</label>
            <input class="form-control" id="fp_barcode" placeholder="Escanea con lector o escribe..." value="${p.barcode||''}" 
            onkeydown="ProductosModule._onBarcodeKey(event)" 
            oninput="ProductosModule._onBarcodeInput(this.value)"/></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Nombre <span class="required">*</span></label>
            <input class="form-control" id="fp_nombre" placeholder="Nombre del producto" value="${p.nombre||''}"/></div>
          <div class="form-group"><label class="form-label">Categoría</label>
            <input class="form-control" id="fp_categoria" list="catListP" placeholder="Alimentos..." value="${p.categoria||''}"/>
            <datalist id="catListP">${cats.map(c=>'<option value="'+c+'">').join('')}</datalist></div>
          <div class="form-group"><label class="form-label">Unidad</label>
            <select class="form-control" id="fp_unidad">${unidades.map(u=>'<option value="'+u+'" '+(( p.unidad||'UND')===u?'selected':'')+'>'+u+'</option>').join('')}</select></div>
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Descripción</label>
            <textarea class="form-control" id="fp_desc" rows="2" placeholder="Descripción, presentación...">${p.descripcion||''}</textarea></div>
        </div>
      </div>
      <!-- Precios -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-tag" style="color:#16a34a;margin-right:6px;"></i>Precios</div>
        <div class="form-grid">
          <div class="form-group"><label class="form-label">Precio Venta (S/) <span class="required">*</span></label>
            <input class="form-control" id="fp_precio_venta" type="number" step="0.01" min="0" placeholder="0.00" value="${pv||''}" oninput="ProductosModule._calcMargenForm()"/></div>
          <div class="form-group"><label class="form-label">Precio Compra (S/) <span style="font-size:10px;color:var(--gray-400);font-weight:600;">(opcional)</span></label>
            <input class="form-control" id="fp_precio_compra" type="number" step="0.01" min="0" placeholder="0.00" value="${pc||''}" oninput="ProductosModule._calcMargenForm()"/></div>
          <div class="form-group"><label class="form-label">Precio Mayorista (S/)</label>
            <input class="form-control" id="fp_precio_mayor" type="number" step="0.01" min="0" placeholder="0.00" value="${p.precio_mayorista||''}"/></div>
          <div class="form-group"><label class="form-label">IGV</label>
            <select class="form-control" id="fp_igv">
              <option value="true" ${p.igv!==false?'selected':''}>Sí (18%)</option>
              <option value="false" ${p.igv===false?'selected':''}>No aplica</option>
            </select></div>
        </div>
        <div style="margin-top:8px;padding:10px;background:var(--gray-50);border-radius:8px;display:flex;gap:20px;font-size:12px;flex-wrap:wrap;">
          <span>Utilidad: <strong id="utilidadCalc" style="color:#16a34a;">S/ ${utilInit}</strong></span>
          <span>Margen: <strong id="margenCalc" style="color:#7c3aed;">${margenInit}%</strong></span>
          <span>Sin IGV: <strong id="sinIGVCalc" style="color:var(--accent);">S/ ${pv>0?(pv/1.18).toFixed(2):'0.00'}</strong></span>
        </div>
      </div>
      <!-- Stock -->
      <div class="form-section">
        <div class="form-section-title"><i class="fas fa-layer-group" style="color:#d97706;margin-right:6px;"></i>Stock</div>
        <div class="form-grid">
          <div class="form-group"><label class="form-label">Stock Actual</label>
            <input class="form-control" id="fp_stock" type="number" min="0" placeholder="0" value="${p.stock!==undefined?p.stock:''}"/></div>
          <div class="form-group"><label class="form-label">Stock Mínimo (alerta)</label>
            <input class="form-control" id="fp_stock_min" type="number" min="0" placeholder="10" value="${p.stock_minimo||10}"/></div>
        </div>
      </div>
    </div>`;
  },

  _calcMargenForm() {
    const pv=parseFloat(document.getElementById('fp_precio_venta')?.value)||0;
    const pc=parseFloat(document.getElementById('fp_precio_compra')?.value)||0;
    const util=pv-pc, margen=pv>0?util/pv*100:0, mClr=margen>=30?'#16a34a':margen>=15?'#d97706':'#dc2626';
    const u=document.getElementById('utilidadCalc'); if(u)u.textContent='S/ '+util.toFixed(2);
    const m=document.getElementById('margenCalc'); if(m){m.textContent=margen.toFixed(1)+'%';m.style.color=mClr;}
    const s=document.getElementById('sinIGVCalc'); if(s)s.textContent='S/ '+(pv/1.18).toFixed(2);
  },

  guardar(id) {
    let codigo = document.getElementById('fp_codigo')?.value?.trim();
    const nombre = document.getElementById('fp_nombre')?.value?.trim();
    const precio_venta = parseFloat(document.getElementById('fp_precio_venta')?.value)||0;
    if(!nombre||!precio_venta){App.toast('Complete: Nombre y Precio de Venta','error');return;}
    // Auto-generar código si está vacío
    if(!codigo) {
      const maxId = DB.productos.length ? Math.max(...DB.productos.map(p=>p.id||0))+1 : 1;
      codigo = 'PROD' + String(maxId).padStart(3,'0');
      const inputCod = document.getElementById('fp_codigo');
      if(inputCod) inputCod.value = codigo;
    }
    const dup=DB.productos.find(p=>p.codigo===codigo&&p.id!==id);
    if(dup){App.toast('Código duplicado: '+dup.nombre,'error');return;}
    const data={
      codigo,nombre,precio_venta,
      imagen:        document.getElementById('fp_imagen')?.value||'',
      barcode:       document.getElementById('fp_barcode')?.value?.trim()||'',
      categoria:     document.getElementById('fp_categoria')?.value?.trim()||'General',
      unidad:        document.getElementById('fp_unidad')?.value||'UND',
      precio_compra: parseFloat(document.getElementById('fp_precio_compra')?.value)||0,
      precio_mayorista:parseFloat(document.getElementById('fp_precio_mayor')?.value)||0,
      stock:         parseInt(document.getElementById('fp_stock')?.value)||0,
      stock_minimo:  parseInt(document.getElementById('fp_stock_min')?.value)||10,
      igv:           document.getElementById('fp_igv')?.value==='true',
      descripcion:   document.getElementById('fp_desc')?.value?.trim()||''
    };
    if(id){const i=DB.productos.findIndex(x=>x.id===id);if(i>=0)DB.productos[i]={...DB.productos[i],...data};App.toast('✅ Producto actualizado','success');}
    else{const newId=DB.productos.length?Math.max(...DB.productos.map(x=>x.id))+1:1;DB.productos.push({id:newId,...data});App.toast('✅ Producto registrado','success');}
    Storage.guardarProductos();
    // ← SYNC SHEETS
    if(id){ this._syncSheet('updateProducto', this._sheetParams(DB.productos.find(x=>x.id===id))); }
    else  { this._syncSheet('addProducto',    this._sheetParams(DB.productos[DB.productos.length-1])); }
    App.closeModal();App.renderPage();
  },

  // ─── DUPLICAR ───
  duplicar(id){
    const p=DB.productos.find(x=>x.id===id); if(!p)return;
    const newId=Math.max(...DB.productos.map(x=>x.id))+1;
    DB.productos.push({...p,id:newId,codigo:p.codigo+'_COPIA',nombre:p.nombre+' (Copia)',stock:0});
    Storage.guardarProductos();
    this._syncSheet('addProducto', this._sheetParams(DB.productos[DB.productos.length-1])); // ← SYNC SHEETS
    App.toast('Producto duplicado','success');App.renderPage();
    setTimeout(()=>this.editar(newId),300);
  },

  // ─── AJUSTAR STOCK ───
  ajustarStock(id){
    const p=DB.productos.find(x=>x.id===id); if(!p)return;
    App.showModal('Ajustar Stock: '+p.nombre,`
      <div style="display:flex;gap:10px;margin-bottom:14px;">
        <div style="flex:1;background:var(--gray-50);padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:900;">${p.stock}</div><div style="font-size:11px;color:var(--gray-500);">Stock actual</div></div>
        <div style="flex:1;background:#fffbeb;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:900;color:#d97706;">${p.stock_minimo||10}</div><div style="font-size:11px;color:var(--gray-500);">Mínimo</div></div>
        <div style="flex:1;background:#f0fdf4;padding:12px;border-radius:8px;text-align:center;">
          <div style="font-size:24px;font-weight:900;color:#16a34a;">S/${(p.stock*p.precio_venta).toFixed(0)}</div><div style="font-size:11px;color:var(--gray-500);">Valor</div></div>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Tipo</label>
          <select class="form-control" id="ajuste_tipo">
            <option value="entrada">📥 Entrada (sumar)</option>
            <option value="salida">📤 Salida (restar)</option>
            <option value="exacto">🎯 Cantidad exacta</option>
          </select></div>
        <div class="form-group"><label class="form-label">Cantidad</label>
          <input class="form-control" id="ajuste_cant" type="number" min="0" value="0"
            oninput="ProductosModule._previewAjuste(${p.stock})" style="font-size:18px;text-align:center;"/></div>
        <div class="form-group" style="grid-column:1/-1"><label class="form-label">Motivo</label>
          <input class="form-control" id="ajuste_motivo" placeholder="Compra, devolución, merma, conteo..."/></div>
      </div>
      <div id="ajustePreview" style="margin-top:8px;padding:10px;background:var(--gray-50);border-radius:8px;text-align:center;font-size:13px;">
        Nuevo stock: <strong id="ajusteNuevo" style="font-size:18px;">${p.stock}</strong> ${p.unidad}
      </div>`,
      [{text:'Aplicar Ajuste',cls:'btn-primary',cb:()=>{
        const tipo=document.getElementById('ajuste_tipo')?.value;
        const cant=parseInt(document.getElementById('ajuste_cant')?.value)||0;
        const motivo=document.getElementById('ajuste_motivo')?.value||'Ajuste manual';
        const i=DB.productos.findIndex(x=>x.id===id); if(i<0)return;
        const antes=DB.productos[i].stock;
        if(tipo==='entrada')DB.productos[i].stock+=cant;
        else if(tipo==='salida')DB.productos[i].stock=Math.max(0,DB.productos[i].stock-cant);
        else DB.productos[i].stock=cant;
        if(typeof KardexModule!=='undefined'){KardexModule.registrar([{prod_id:id,qty:Math.abs(DB.productos[i].stock-antes)}],tipo==='salida'?'SALIDA':tipo==='entrada'?'ENTRADA':'AJUSTE',motivo);}
        Storage.guardarProductos();
        this._syncSheet('updateProducto', this._sheetParams(DB.productos[i])); // ← SYNC SHEETS
        App.toast('Stock: '+antes+' → '+DB.productos[i].stock+' '+p.unidad,'success');
        App.closeModal();App.renderPage();
      }}]
    );
  },

  _previewAjuste(stockActual){
    const tipo=document.getElementById('ajuste_tipo')?.value||'entrada';
    const cant=parseInt(document.getElementById('ajuste_cant')?.value)||0;
    let nuevo=tipo==='entrada'?stockActual+cant:tipo==='salida'?Math.max(0,stockActual-cant):cant;
    const el=document.getElementById('ajusteNuevo');
    if(el){el.textContent=nuevo;el.style.color=nuevo===0?'#dc2626':nuevo<=10?'#d97706':'#16a34a';}
  },

  // ─── HISTORIAL ───
  verHistorial(id){
    const p=DB.productos.find(x=>x.id===id);
    const ventas=DB.ventas.filter(v=>v.items.some(i=>i.prod_id===id));
    const totalVend=ventas.reduce((s,v)=>{const it=v.items.find(i=>i.prod_id===id);return s+(it?it.qty:0);},0);
    const totalIng=ventas.reduce((s,v)=>{const it=v.items.find(i=>i.prod_id===id);return s+(it?it.total:0);},0);
    App.showModal('Historial: '+p.nombre,`
      <div style="display:flex;gap:10px;margin-bottom:14px;">
        <div style="flex:1;background:#eff6ff;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:20px;font-weight:800;color:var(--accent);">${ventas.length}</div><div style="font-size:11px;color:var(--gray-500);">Ventas</div></div>
        <div style="flex:1;background:#f0fdf4;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:20px;font-weight:800;color:#16a34a;">${totalVend}</div><div style="font-size:11px;color:var(--gray-500);">Uds vendidas</div></div>
        <div style="flex:1;background:#fdf4ff;padding:12px;border-radius:8px;text-align:center;"><div style="font-size:20px;font-weight:800;color:#7c3aed;">S/${totalIng.toFixed(2)}</div><div style="font-size:11px;color:var(--gray-500);">Total generado</div></div>
      </div>
      ${ventas.length===0?'<div class="empty-state"><i class="fas fa-chart-bar"></i><p>Sin ventas registradas</p></div>':
      '<div style="max-height:260px;overflow-y:auto;"><table class="data-table"><thead><tr><th>Fecha</th><th>Comprobante</th><th>Qty</th><th>P.Unit</th><th>Total</th></tr></thead><tbody>'+
      ventas.map(v=>{const it=v.items.find(i=>i.prod_id===id);return '<tr><td class="text-sm">'+v.fecha+'</td><td style="color:var(--accent);font-weight:700;">'+v.serie+'-'+v.numero+'</td><td><strong>'+(it?.qty||0)+'</strong></td><td>S/'+(it?.precio||0).toFixed(2)+'</td><td><strong>S/'+(it?.total||0).toFixed(2)+'</strong></td></tr>';}).join('')+
      '</tbody></table></div>'}`,[]
    );
    document.getElementById('modalBox').style.maxWidth='500px';
  },

  // ─── ELIMINAR ───
  eliminar(id){
    const p=DB.productos.find(x=>x.id===id); if(!p)return;
    if(confirm('¿Eliminar "'+p.nombre+'"?')){
      DB.productos=DB.productos.filter(x=>x.id!==id);
      this.seleccionados=this.seleccionados.filter(x=>x!==id);
      Storage.guardarProductos();
      this._syncSheet('deleteProducto', { id: id }); // ← SYNC SHEETS
      App.toast('Producto eliminado: '+p.nombre,'warning');
      App.renderPage();
    }
  },

  // ─── EXPORTAR / IMPORTAR / IMPRIMIR ───
  exportarCSV(){ this._descargarCSV(DB.productos,'productos_jumila'); },

  _descargarCSV(prods,nombre){
    const h='Codigo,Nombre,Categoria,Unidad,Precio Venta,Precio Compra,Precio Mayorista,Stock,Stock Minimo,IGV,Descripcion,Barcode\n';
    const r=prods.map(p=>'"'+p.codigo+'","'+p.nombre+'","'+(p.categoria||'')+'","'+(p.unidad||'UND')+'",'+p.precio_venta+','+p.precio_compra+','+(p.precio_mayorista||0)+','+p.stock+','+(p.stock_minimo||10)+','+(p.igv?'SI':'NO')+',"'+(p.descripcion||'')+'","'+(p.barcode||'')+'"').join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\uFEFF'+h+r],{type:'text/csv;charset=utf-8;'}));
    a.download=nombre+'_'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(a.href);
    App.toast(prods.length+' productos exportados','success');
  },

  importarCSV(){
    App.showModal('Importar Productos CSV',`
      <div style="background:var(--gray-50);padding:10px;border-radius:8px;margin-bottom:12px;font-size:12px;">
        <strong>Formato:</strong> <code>Codigo, Nombre, Categoria, Unidad, Precio Venta, Precio Compra, Stock</code><br/>
        <button class="btn btn-outline btn-sm" style="margin-top:6px;" onclick="ProductosModule._descargarPlantilla()"><i class="fas fa-download"></i> Plantilla CSV</button>
      </div>
      <div class="form-group mb-3"><label class="form-label">Pegar datos CSV:</label>
        <textarea class="form-control" id="csvData" rows="7" placeholder="Codigo,Nombre,Categoria,Unidad,Precio Venta,Precio Compra,Stock&#10;PROD100,Producto,Alimentos,UND,10.00,7.00,50"></textarea></div>
      <div class="form-group"><label class="form-label">Si el código ya existe:</label>
        <select class="form-control" id="csvMode">
          <option value="skip">Ignorar</option><option value="update">Actualizar</option>
        </select></div>`,
      [{text:'Importar',cls:'btn-success',cb:()=>this._procesarCSV()}]
    );
  },

  _descargarPlantilla(){
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['Codigo,Nombre,Categoria,Unidad,Precio Venta,Precio Compra,Stock\nPROD100,Producto Ejemplo,Alimentos,UND,10.00,7.00,50\n'],{type:'text/csv'}));a.download='plantilla_productos.csv';a.click();
  },

  _procesarCSV(){
    const raw=document.getElementById('csvData')?.value?.trim();
    const mode=document.getElementById('csvMode')?.value;
    if(!raw){App.toast('Ingrese datos CSV','error');return;}
    const lines=raw.split('\n').filter(l=>l.trim()&&!l.toLowerCase().startsWith('codigo'));
    let imp=0,act=0,err=0;
    lines.forEach(line=>{
      const cols=line.split(',').map(c=>c.replace(/^"|"$/g,'').trim());
      if(cols.length<5){err++;return;}
      const[codigo,nombre,categoria,unidad,pv,pc,stock]=cols;
      if(!codigo||!nombre||!pv){err++;return;}
      const ex=DB.productos.findIndex(p=>p.codigo===codigo);
      const data={codigo,nombre,categoria:categoria||'General',unidad:unidad||'UND',precio_venta:parseFloat(pv)||0,precio_compra:parseFloat(pc)||0,stock:parseInt(stock)||0,stock_minimo:10,igv:true,descripcion:'',imagen:'',barcode:''};
      if(ex>=0){if(mode==='update'){DB.productos[ex]={...DB.productos[ex],...data};act++;this._syncSheet('updateProducto', this._sheetParams(DB.productos[ex]));}}
      else{const newId=DB.productos.length?Math.max(...DB.productos.map(x=>x.id))+1:1;DB.productos.push({id:newId,...data});imp++;this._syncSheet('addProducto', this._sheetParams(DB.productos[DB.productos.length-1]));}
    });
    App.toast('✅ '+imp+' importados · '+act+' actualizados · '+err+' errores',imp>0?'success':'warning');
    Storage.guardarProductos();
    App.closeModal();App.renderPage();
  },

  imprimirCatalogo(){
    const prods=this.getFiltered();
    const w=window.open('','_blank','width=900,height=650'); if(!w){App.toast('Activa ventanas emergentes','warning');return;}
    const rows=prods.map(p=>{const m=p.precio_venta>0?((p.precio_venta-p.precio_compra)/p.precio_venta*100).toFixed(1):'0.0';return'<tr><td>'+(p.imagen?'<img src="'+p.imagen+'" style="width:32px;height:32px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:4px;"/>':'')+' '+p.codigo+'</td><td>'+p.nombre+'</td><td>'+p.categoria+'</td><td>'+p.unidad+'</td><td>S/'+p.precio_venta.toFixed(2)+'</td><td>S/'+p.precio_compra.toFixed(2)+'</td><td>'+m+'%</td><td style="font-weight:bold;color:'+(p.stock===0?'red':p.stock<=10?'orange':'green')+'">'+p.stock+'</td></tr>';}).join('');
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Catálogo</title><style>body{font-family:Arial;font-size:11px;}h2{text-align:center;color:#1e3a5f;}table{width:100%;border-collapse:collapse;}th{background:#1e3a5f;color:white;padding:6px;}td{padding:5px;border:1px solid #ddd;}tr:nth-child(even){background:#f5f5f5;}.f{text-align:center;color:#999;margin-top:12px;font-size:10px;}</style></head><body><h2>'+DB.empresa.nombre+'</h2><p style="text-align:center;color:#666;">Catálogo · '+new Date().toLocaleString('es-PE')+' · '+prods.length+' productos</p><table><thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Und</th><th>P.Venta</th><th>P.Compra</th><th>Margen</th><th>Stock</th></tr></thead><tbody>'+rows+'</tbody></table><div class="f">'+DB.empresa.nombre+' · RUC: '+DB.empresa.ruc+'</div></body></html>');
    w.document.close();setTimeout(()=>w.print(),300);
  },

  // ─── HELPERS ───
  stockBadge(stock,min){
    min=min||10;
    var base='padding:6px 14px;border-radius:20px;font-size:14px;font-weight:800;display:inline-flex;align-items:center;gap:5px;';
    if(stock===0)  return '<span style="'+base+'background:#fef2f2;color:#dc2626;"><i class="fas fa-times"></i> 0</span>';
    if(stock<=min) return '<span style="'+base+'background:#fef3c7;color:#d97706;"><i class="fas fa-exclamation"></i> '+stock+'</span>';
    return                '<span style="'+base+'background:#dcfce7;color:#16a34a;"><i class="fas fa-check"></i> '+stock+'</span>';
  },

  // ─── BARCODE SCANNER ───
  _onBarcodeKey(e) {
    // Los lectores de código de barras envían Enter al terminar
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.target.value.trim();
      if (!val) return;
      // Verificar si ya existe un producto con ese código de barras
      const existente = DB.productos.find(p => p.barcode === val || p.codigo === val);
      if (existente) {
        App.toast('⚠ Ya existe: ' + existente.nombre + ' (' + existente.codigo + ')', 'warning');
        // Rellenar el nombre automáticamente si está vacío
        const nomInput = document.getElementById('fp_nombre');
        if (nomInput && !nomInput.value) nomInput.value = existente.nombre;
      } else {
        App.toast('✓ Código escaneado: ' + val, 'success');
        // Enfocar el campo nombre para continuar el registro
        setTimeout(function() {
          const nomInput = document.getElementById('fp_nombre');
          if (nomInput && !nomInput.value) nomInput.focus();
        }, 100);
      }
    }
  },

  _onBarcodeInput(val) {
    // Feedback visual mientras escribe/escanea
    const input = document.getElementById('fp_barcode');
    if (!input) return;
    if (val.length >= 8) {
      input.style.borderColor = '#16a34a';
      input.style.background  = '#f0fdf4';
    } else {
      input.style.borderColor = '';
      input.style.background  = '';
    }
  },

  // ─── IMAGEN: MÉTODOS ───

  _onImageChange(input) {
    const file = input.files[0];
    if (!file) return;
    // Validar tamaño (máx 2MB)
    if (file.size > 5 * 1024 * 1024) {
      App.toast('La imagen supera 5MB. Usa una imagen más pequeña.', 'error');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      // Guardar en el campo hidden
      const hiddenInput = document.getElementById('fp_imagen');
      if (hiddenInput) hiddenInput.value = base64;
      // Actualizar preview
      const wrap = document.getElementById('imgPreviewWrap');
      if (wrap) {
        wrap.innerHTML = '<img id="imgPreview" src="' + base64 + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" alt="Producto"/>';
      }
      // Agregar botón quitar si no existe
      const qBtn = document.getElementById('btnQuitarImg');
      if (!qBtn) {
        const ctrl = wrap && wrap.nextElementSibling;
        if (ctrl) {
          const btn = document.createElement('button');
          btn.type = 'button'; btn.id = 'btnQuitarImg';
          btn.className = 'btn btn-outline';
          btn.style.cssText = 'width:100%;color:var(--danger);border-color:var(--danger);margin-bottom:8px;';
          btn.innerHTML = '<i class="fas fa-trash"></i> Quitar imagen';
          btn.onclick = function(){ ProductosModule._quitarImagen(); };
          // Insert before the last info div
          const infos = ctrl.querySelectorAll('div');
          const lastInfo = infos[infos.length-1];
          if (lastInfo) ctrl.insertBefore(btn, lastInfo);
        }
      }
      App.toast('Imagen cargada correctamente', 'success');
    };
    reader.readAsDataURL(file);
  },

  _quitarImagen() {
    const hiddenInput = document.getElementById('fp_imagen');
    const fileInput   = document.getElementById('fp_imagen_file');
    const wrap        = document.getElementById('imgPreviewWrap');
    if (hiddenInput) hiddenInput.value = '';
    if (fileInput)   fileInput.value   = '';
    if (wrap) {
      wrap.innerHTML = '<div id="imgPreview" style="text-align:center;color:var(--gray-400);pointer-events:none;"><i class="fas fa-image" style="font-size:52px;display:block;margin-bottom:10px;opacity:0.4;"></i><span style="font-size:13px;font-weight:700;">Clic para subir foto</span><div style="font-size:11px;margin-top:4px;opacity:0.6;">o arrastra una imagen aquí</div></div>';
    }
    const qBtn = document.getElementById('btnQuitarImg');
    if (qBtn) qBtn.remove();
    App.toast('Imagen eliminada', 'info');
  },

  _tomarFoto() {
    // En móvil: abre cámara nativa. En PC: abre webcam con getUserMedia
    var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      // Móvil: usa el input con capture para abrir la cámara nativa
      var input = document.getElementById('fp_imagen_file');
      if (input) {
        input.setAttribute('capture', 'environment');
        input.click();
        setTimeout(function(){ input.removeAttribute('capture'); }, 1000);
      }
    } else {
      // PC: usar getUserMedia para abrir la webcam
      ProductosModule._abrirWebcam();
    }
  },

  _abrirWebcam() {
    // Verificar soporte
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      App.toast('Tu navegador no soporta acceso a la cámara. Usa Chrome o Edge.', 'error');
      return;
    }

    // Crear modal de webcam
    var modalHTML =
      '<div style="display:flex;flex-direction:column;align-items:center;gap:12px;">' +
        '<div style="position:relative;width:100%;max-width:400px;background:#000;border-radius:10px;overflow:hidden;">' +
          '<video id="webcamVideo" autoplay playsinline ' +
            'style="width:100%;display:block;border-radius:10px;"></video>' +
          '<div id="webcamOverlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
            'background:rgba(0,0,0,0.6);border-radius:10px;color:white;">' +
            '<div style="text-align:center;">' +
              '<i class="fas fa-camera" style="font-size:36px;display:block;margin-bottom:8px;"></i>' +
              '<span style="font-size:13px;">Iniciando cámara...</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<canvas id="webcamCanvas" style="display:none;"></canvas>' +
        '<div id="webcamCaptura" style="display:none;width:100%;max-width:400px;">' +
          '<img id="webcamPreviewImg" style="width:100%;border-radius:10px;" alt="Captura"/>' +
        '</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button id="btnCapturar" class="btn btn-primary" onclick="ProductosModule._capturarFoto()" ' +
            'style="display:none;">' +
            '<i class="fas fa-camera"></i> Capturar foto' +
          '</button>' +
          '<button id="btnReCapturar" class="btn btn-outline" onclick="ProductosModule._reCapturar()" ' +
            'style="display:none;">' +
            '<i class="fas fa-redo"></i> Repetir' +
          '</button>' +
          '<button id="btnUsarFoto" class="btn btn-success" onclick="ProductosModule._usarFotoWebcam()" ' +
            'style="display:none;">' +
            '<i class="fas fa-check"></i> Usar esta foto' +
          '</button>' +
        '</div>' +
        '<p id="webcamError" style="display:none;color:#dc2626;font-size:13px;text-align:center;"></p>' +
      '</div>';

    App.showModal('📷 Tomar Foto con Cámara', modalHTML, []);
    document.getElementById('modalBox').style.maxWidth = '480px';

    // Iniciar cámara
    setTimeout(function() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width:{ideal:1280}, height:{ideal:720} } })
        .then(function(stream) {
          ProductosModule._webcamStream = stream;
          var video = document.getElementById('webcamVideo');
          if (video) {
            video.srcObject = stream;
            video.onloadedmetadata = function() {
              video.play();
              // Ocultar overlay y mostrar botón capturar
              var overlay = document.getElementById('webcamOverlay');
              var btnCap  = document.getElementById('btnCapturar');
              if (overlay) overlay.style.display = 'none';
              if (btnCap)  btnCap.style.display   = 'inline-flex';
            };
          }
        })
        .catch(function(err) {
          var overlay = document.getElementById('webcamOverlay');
          var errDiv  = document.getElementById('webcamError');
          if (overlay) overlay.style.display = 'none';
          if (errDiv) {
            errDiv.style.display = 'block';
            if (err.name === 'NotAllowedError') {
              errDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Permiso de cámara denegado.<br/>Haz clic en el ícono 🔒 en la barra del navegador y permite el acceso.';
            } else if (err.name === 'NotFoundError') {
              errDiv.innerHTML = '<i class="fas fa-video-slash"></i> No se encontró ninguna cámara.<br/>Conecta una webcam e inténtalo de nuevo.';
            } else {
              errDiv.innerHTML = '<i class="fas fa-times-circle"></i> Error al acceder a la cámara: ' + err.message;
            }
          }
          App.toast('No se pudo acceder a la cámara', 'error');
        });
    }, 300);

    // Detener cámara al cerrar modal
    var origClose = App.closeModal.bind(App);
    App.closeModal = function(e) {
      ProductosModule._detenerWebcam();
      App.closeModal = origClose;
      origClose(e);
    };
  },

  _capturarFoto() {
    var video  = document.getElementById('webcamVideo');
    var canvas = document.getElementById('webcamCanvas');
    var prev   = document.getElementById('webcamPreviewImg');
    var capDiv = document.getElementById('webcamCaptura');
    var vidDiv = video && video.parentElement;
    var btnCap = document.getElementById('btnCapturar');
    var btnRe  = document.getElementById('btnReCapturar');
    var btnUsa = document.getElementById('btnUsarFoto');

    if (!video || !canvas) return;

    // Capturar frame del video
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    ProductosModule._webcamFotoCapturada = dataUrl;

    // Mostrar preview de la captura
    if (prev)   prev.src = dataUrl;
    if (capDiv) capDiv.style.display = 'block';
    if (vidDiv) vidDiv.style.display = 'none';
    if (btnCap) btnCap.style.display = 'none';
    if (btnRe)  btnRe.style.display  = 'inline-flex';
    if (btnUsa) btnUsa.style.display = 'inline-flex';
  },

  _reCapturar() {
    var video  = document.getElementById('webcamVideo');
    var capDiv = document.getElementById('webcamCaptura');
    var vidDiv = video && video.parentElement;
    var btnCap = document.getElementById('btnCapturar');
    var btnRe  = document.getElementById('btnReCapturar');
    var btnUsa = document.getElementById('btnUsarFoto');

    ProductosModule._webcamFotoCapturada = null;
    if (capDiv) capDiv.style.display = 'none';
    if (vidDiv) vidDiv.style.display = 'block';
    if (btnCap) btnCap.style.display = 'inline-flex';
    if (btnRe)  btnRe.style.display  = 'none';
    if (btnUsa) btnUsa.style.display = 'none';
  },

  _usarFotoWebcam() {
    var dataUrl = ProductosModule._webcamFotoCapturada;
    if (!dataUrl) return;

    // Guardar en el campo hidden
    var hiddenInput = document.getElementById('fp_imagen');
    if (hiddenInput) hiddenInput.value = dataUrl;

    // Actualizar preview del formulario
    var wrap = document.getElementById('imgPreviewWrap');
    if (wrap) {
      wrap.innerHTML = '<img id="imgPreview" src="' + dataUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" alt="Producto"/>';
    }

    ProductosModule._detenerWebcam();

    // Restaurar closeModal original antes de cerrar
    if (App._origCloseModal) {
      App.closeModal = App._origCloseModal;
      App._origCloseModal = null;
    }
    document.getElementById('modalOverlay').classList.add('hidden');
    App.toast('✅ Foto capturada correctamente', 'success');
  },

  _detenerWebcam() {
    if (ProductosModule._webcamStream) {
      ProductosModule._webcamStream.getTracks().forEach(function(track){ track.stop(); });
      ProductosModule._webcamStream = null;
    }
    ProductosModule._webcamFotoCapturada = null;
  }

};
