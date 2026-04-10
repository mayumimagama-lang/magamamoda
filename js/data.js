// ============================================================
// DATA STORE — ERP JUMILA
// Los datos se persisten en localStorage automáticamente
// ============================================================

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

  // ---- PRODUCTOS (se carga desde localStorage) ----
  productos: [],

  // ---- VENTAS (se carga desde localStorage) ----
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
// PERSISTENCIA EN localStorage
// Carga y guarda datos automáticamente
// ============================================================

const Storage = {

  // Claves en localStorage
  KEYS: {
    productos:   'erp_jumila_productos',
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

  // Cargar todos los datos al iniciar
  cargar() {
    try {
      const p = localStorage.getItem(this.KEYS.productos);
      if (p) DB.productos = JSON.parse(p);

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
      if (k && typeof DB.kardex !== 'undefined') DB.kardex = JSON.parse(k);

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

  // Guardar una colección específica
  guardar(clave, datos) {
    try {
      localStorage.setItem(clave, JSON.stringify(datos));
      return true;
    } catch(e) {
      // Cuota excedida (imágenes muy grandes)
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage lleno. Considera usar imágenes más pequeñas.');
        return false;
      }
      console.warn('Error al guardar:', e);
      return false;
    }
  },

  // Atajos para cada colección
  guardarProductos()    { return this.guardar(this.KEYS.productos,    DB.productos); },
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

  // Limpiar TODO el localStorage del ERP
  limpiarTodo() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
};

// ── Cargar datos al iniciar la página ──
Storage.cargar();