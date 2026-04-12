// ============================================================
// DATA STORE — ERP JUMILA
// Productos se leen y escriben en Google Sheets via Apps Script
// ============================================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjsQWwVVEJfDpfcyKlAVBO7Iqqo04OTqMNYKtLG0AW_h2SqhXVg-IYoB6f297FLxs/exec';

const DB = {

  // ---- USUARIOS ----
  usuarios: [
    {
      id: 1, usuario: 'MAGAMA', password: '983396116',
      nombre: 'MAGAMA Administrador', rol: 'admin',
      activo: true, sucursal: 'JUMILA IMPORTACIONES',
      cargo: 'ADMINISTRADOR', fechaCreacion: '2026-01-01',
      permisos: 'todos'
    },
    {
      id: 2, usuario: 'CAJERO1', password: '123456789',
      nombre: 'Astrid', rol: 'cajero',
      activo: true, sucursal: 'JUMILA IMPORTACIONES',
      cargo: 'CAJERO', fechaCreacion: '2026-03-01',
      permisos: {
        inicio:true, pos:true, ventas:true, caja:true, clientes:true,
        productos:true, inventario:false, compras:false, cotizaciones:false,
        notascredito:false, guias:false, cuentas:false, finanzas:false,
        reportes:true, kardex:false, precios:false, cuentacorriente:false,
        agenda:false, herramientas:false, administracion:false,
        configuracion:false, soporte:true
      }
    }
  ],

  usuarioActual: null,

  // ---- EMPRESA ----
  empresa: {
    nombre:     'GRUPO JUMILA SOCIEDAD ANONIMA CERRADA',
    ruc:        '20123456789',
    sucursal:   'JUMILA IMPORTACIONES',
    direccion:  'JR. 2 DE MAYO 708 HUANUCO',
    moneda:     'SOLES',
    tipoCambio:  3.467
  },

  // ---- CLIENTES ----
  clientes: [
    { id:1,  tipo:'DNI', doc:'00000000', nombre:'PUBLICO EN GENERAL',         direccion:'-/-/-', telefono:'', email:'', tipo_cliente:'cliente' },
    { id:2,  tipo:'RUC', doc:'20529212870', nombre:'A&A MOTORS EIRL',          direccion:'JR. 2 DE MAYO 708 HUANUCO', telefono:'062-512345', email:'', tipo_cliente:'cliente' },
    { id:3,  tipo:'DNI', doc:'44433431', nombre:'ABAD TOLENTINO NILDA',        direccion:'-/-/-', telefono:'', email:'', tipo_cliente:'cliente' },
    { id:4,  tipo:'DNI', doc:'42282670', nombre:'ABAL BENANCIO RODOLFO RONALD', direccion:'-/-/-', telefono:'', email:'', tipo_cliente:'cliente' },
    { id:5,  tipo:'DNI', doc:'00113111', nombre:'ABANTO LOPEZ KARIN YAKELIN',  direccion:'-/-/-', telefono:'', email:'', tipo_cliente:'cliente' },
    { id:6,  tipo:'DNI', doc:'70466033', nombre:'ABUNDO TRUJILLO MARLEN',      direccion:'-/-/-', telefono:'', email:'', tipo_cliente:'cliente' },
    { id:12, tipo:'DNI', doc:'74889897', nombre:'VENTURA JORGE CLEDER YEMNER', direccion:'-/-/-', telefono:'', email:'', tipo_cliente:'cliente' },
    { id:13, tipo:'DNI', doc:'22521530', nombre:'CHANG DEL PINO EVELYN RUTH',  direccion:'-/-/-', telefono:'', email:'', tipo_cliente:'cliente' },
    { id:14, tipo:'RUC', doc:'10456789012', nombre:'FLORES RAMIREZ JUAN CARLOS', direccion:'AV. UNIVERSITARIA 456 HUANUCO', telefono:'062-445566', email:'', tipo_cliente:'proveedor' },
    { id:15, tipo:'RUC', doc:'20456789013', nombre:'DISTRIBUIDORA EL SOL SAC', direccion:'JR. CONSTITUCION 789 HUANUCO', telefono:'062-334455', email:'', tipo_cliente:'proveedor' }
  ],

  // ---- PRODUCTOS (se carga desde Google Sheets) ----
  productos: [],

  // ---- VENTAS ----
  ventas: [],

  // ---- CAJA ----
  cajas: [
    { id:1, fecha:'2026-04-04', apertura:'08:00:00', cierre:null,
      monto_inicial:200.00, monto_final:null, estado:'ABIERTA',
      ventas_efectivo:0, ventas_tarjeta:0, ingresos:0, egresos:0 }
  ],

  // ---- COMPRAS ----
  compras: [],

  // ---- SECUENCIAS ----
  _sequences: { NV03:1, BV03:1, FC01:1 },

  nextNumber(serie) {
    const n = this._sequences[serie] || 1;
    this._sequences[serie] = n + 1;
    return String(n).padStart(8, '0');
  }
};

// ============================================================
// SHEETS SYNC — Lee y escribe productos en Google Sheets
// ============================================================

const SheetsSync = {

  // ── Cargar todos los productos (GET) ──
  async cargarProductos() {
    try {
      const res  = await fetch(SCRIPT_URL + '?accion=listar');
      const json = await res.json();
      if (json.ok && json.productos && json.productos.length > 0) {
        const deSheets = json.productos.map(p => ({
          id:               p.id,
          nombre:           p.nombre      || '',
          categoria:        p.categoria   || 'General',
          precio_venta:     parseFloat(p.precio) || 0,
          precio_compra:    0,
          precio_mayorista: 0,
          stock:            parseInt(p.stock)    || 0,
          stock_minimo:     10,
          imagen:           p.imagen      || '',
          codigo:           p.codigo || ('P' + String(p.id).padStart(4,'0')),
          unidad:           'UND',
          igv:              true,
          activo:           true,
          descripcion:      p.descripcion || '',
          barcode:          ''
        }));
        // ✅ Sheets es la fuente de verdad — reemplazar todo
        DB.productos = deSheets;
        Storage.guardarProductos();
        console.log('✅ ' + DB.productos.length + ' productos cargados desde Sheets');
      }
      const mainApp = document.getElementById('mainApp');
      if (typeof App !== 'undefined' && mainApp && !mainApp.classList.contains('hidden')) {
        App.renderPage();
      }
    } catch(e) {
      console.warn('⚠️ Error Sheets — usando localStorage:', e);
    }
  },

  // ── Agregar producto (GET — sin CORS) ──
  async agregarProducto(producto) {
    try {
      const params = new URLSearchParams({
        accion:      'agregar',
        nombre:      producto.nombre      || '',
        categoria:   producto.categoria   || 'General',
        precio:      producto.precio_venta || producto.precio || 0,
        stock:       producto.stock       || 0,
        descripcion: producto.descripcion || '',
        codigo:      producto.codigo      || ''
      });
      const res  = await fetch(SCRIPT_URL + '?' + params.toString());
      const json = await res.json();
      if (json.ok) {
        console.log('✅ Producto guardado en Sheets id=' + json.id);
        // ✅ Recargar desde Sheets para reemplazar el ID temporal local
        // con el ID real de Sheets y evitar duplicados
        await this.cargarProductos();
        return { ok: true, id: json.id };
      }
      console.warn('⚠️ Sheets error:', json.error);
      return { ok: false, msg: json.error };
    } catch(e) {
      console.warn('⚠️ Sheets no disponible (guardado local OK):', e);
      return { ok: false, msg: e.toString() };
    }
  },

  // ── Actualizar producto (GET — sin CORS) ──
  async actualizarProducto(producto) {
    try {
      const params = new URLSearchParams({
        accion:      'editar',
        id:          producto.id,
        nombre:      producto.nombre      || '',
        categoria:   producto.categoria   || 'General',
        precio:      producto.precio_venta || producto.precio || 0,
        stock:       producto.stock       || 0,
        descripcion: producto.descripcion || '',
        codigo:      producto.codigo      || ''
      });
      const res  = await fetch(SCRIPT_URL + '?' + params.toString());
      const json = await res.json();
      if (json.ok) { console.log('✅ Producto actualizado en Sheets'); return { ok: true }; }
      console.warn('⚠️ Sheets error:', json.error);
      return { ok: false, msg: json.error };
    } catch(e) {
      console.warn('⚠️ Sheets no disponible (local OK):', e);
      return { ok: false, msg: e.toString() };
    }
  },

  // ── Eliminar producto (GET — sin CORS) ──
  async eliminarProducto(id) {
    try {
      const params = new URLSearchParams({ accion: 'borrar', id: id });
      const res  = await fetch(SCRIPT_URL + '?' + params.toString());
      const json = await res.json();
      if (json.ok) { console.log('✅ Producto eliminado en Sheets'); return { ok: true }; }
      console.warn('⚠️ Sheets error:', json.error);
      return { ok: false, msg: json.error };
    } catch(e) {
      console.warn('⚠️ Sheets no disponible (local OK):', e);
      return { ok: false, msg: e.toString() };
    }
  },

  // ── Cargar ventas desde Sheets ──
  async cargarVentas() {
    try {
      const res  = await fetch(SCRIPT_URL + '?accion=listarVentas');
      const json = await res.json();
      if (json.ok && json.ventas) {
        DB.ventas = json.ventas;
        Storage.guardarVentas();
        console.log('✅ ' + DB.ventas.length + ' ventas cargadas desde Sheets');
      }
    } catch(e) {
      console.warn('⚠️ Error cargando ventas:', e);
    }
  },

  // ── Guardar venta en Sheets ──
  async guardarVenta(venta) {
    try {
      const params = new URLSearchParams({
        accion:           'agregarVenta',
        id:               venta.id,
        serie:            venta.serie            || '',
        numero:           venta.numero           || '',
        tipo:             venta.tipo             || '',
        tipo_comprobante: venta.tipo_comprobante || '',
        fecha:            venta.fecha            || '',
        hora:             venta.hora             || '',
        cliente_id:       venta.cliente_id       || '',
        subtotal:         venta.subtotal         || 0,
        igv:              venta.igv              || 0,
        total:            venta.total            || 0,
        metodo_pago:      venta.metodo_pago      || '',
        monto_pago:       venta.monto_pago       || 0,
        vuelto:           venta.vuelto           || 0,
        estado:           venta.estado           || 'NO_ENVIADO',
        items:            JSON.stringify(venta.items || [])
      });
      const res  = await fetch(SCRIPT_URL + '?' + params.toString());
      const json = await res.json();
      if (json.ok) { console.log('✅ Venta guardada en Sheets'); return { ok: true }; }
      console.warn('⚠️ Error guardando venta:', json.error);
      return { ok: false };
    } catch(e) {
      console.warn('⚠️ Sheets no disponible, venta guardada local:', e);
      return { ok: false };
    }
  }
};

// ============================================================
// PERSISTENCIA EN localStorage (ventas, clientes, etc.)
// ============================================================

const Storage = {

  KEYS: {
    productos:   'erp_magama_productos',      // ← NUEVO: productos en localStorage
    ventas:      'erp_jumila_ventas',
    clientes:    'erp_jumila_clientes',
    compras:     'erp_jumila_compras',
    sequences:   'erp_jumila_sequences',
    empresa:     'erp_jumila_empresa',
    kardex:      'erp_jumila_kardex',
    cotizaciones:'erp_jumila_cotizaciones',
    cuentasCorr: 'erp_jumila_cuentascorriente',
    agenda:      'erp_jumila_agenda',
    notasCredito:'erp_jumila_notascredito',
  },

  cargar() {
    try {
      // ← Cargar productos desde localStorage (respaldo local)
      const pr = localStorage.getItem(this.KEYS.productos);
      if (pr) { const parsed = JSON.parse(pr); if (parsed.length > 0) DB.productos = parsed; }

      const v = localStorage.getItem(this.KEYS.ventas);
      if (v) DB.ventas = JSON.parse(v);

      const c = localStorage.getItem(this.KEYS.clientes);
      if (c) DB.clientes = JSON.parse(c);

      const co = localStorage.getItem(this.KEYS.compras);
      if (co) DB.compras = JSON.parse(co);

      const s = localStorage.getItem(this.KEYS.sequences);
      if (s) DB._sequences = JSON.parse(s);

      const e = localStorage.getItem(this.KEYS.empresa);
      if (e) DB.empresa = JSON.parse(e);

      const k = localStorage.getItem(this.KEYS.kardex);
      if (k) DB.kardex = JSON.parse(k);

      const cot = localStorage.getItem(this.KEYS.cotizaciones);
      if (cot) DB.cotizaciones = JSON.parse(cot);

      const cc = localStorage.getItem(this.KEYS.cuentasCorr);
      if (cc) DB.cuentasCorriente = JSON.parse(cc);

      const ag = localStorage.getItem(this.KEYS.agenda);
      if (ag) DB.agenda = JSON.parse(ag);

      const nc = localStorage.getItem(this.KEYS.notasCredito);
      if (nc) DB.notasCredito = JSON.parse(nc);

    } catch(e) {
      console.warn('Error al cargar localStorage:', e);
    }
  },

  guardar(clave, datos) {
    try {
      localStorage.setItem(clave, JSON.stringify(datos));
      return true;
    } catch(e) {
      return false;
    }
  },

  guardarProductos()    { return this.guardar(this.KEYS.productos, DB.productos); }, // guarda local + Sheets
  guardarVentas()       { return this.guardar(this.KEYS.ventas,       DB.ventas); },
  guardarClientes()     { return this.guardar(this.KEYS.clientes,     DB.clientes); },
  guardarCompras()      { return this.guardar(this.KEYS.compras,      DB.compras); },
  guardarSequences()    { return this.guardar(this.KEYS.sequences,    DB._sequences); },
  guardarEmpresa()      { return this.guardar(this.KEYS.empresa,      DB.empresa); },
  guardarKardex()       { return this.guardar(this.KEYS.kardex,       DB.kardex || []); },
  guardarCotizaciones() { return this.guardar(this.KEYS.cotizaciones, DB.cotizaciones || []); },
  guardarCuentasCorr()  { return this.guardar(this.KEYS.cuentasCorr,  DB.cuentasCorriente || []); },
  guardarAgenda()       { return this.guardar(this.KEYS.agenda,       DB.agenda || []); },
  guardarNotasCredito() { return this.guardar(this.KEYS.notasCredito, DB.notasCredito || []); },

  limpiarTodo() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// ── Cargar localStorage al iniciar ──
Storage.cargar();

// ── Cargar desde Google Sheets al iniciar ──
SheetsSync.cargarProductos();
SheetsSync.cargarVentas();
