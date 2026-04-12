cd /mnt/user-data/outputs
python3 << 'EOF'
with open('data.js', 'r') as f:
    content = f.read()

# Agregar métodos de ventas al SheetsSync, antes del cierre };
old = """  // ── Eliminar producto (GET — sin CORS) ──
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
  }
};"""

new = """  // ── Eliminar producto (GET — sin CORS) ──
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
};"""

if old in content:
    content = content.replace(old, new)
    with open('data.js', 'w') as f:
        f.write(content)
    print("✅ Métodos de ventas agregados")
else:
    print("❌ No encontrado")
EOF
node --check /mnt/user-data/outputs/data.js && echo "✅ Sin errores"
