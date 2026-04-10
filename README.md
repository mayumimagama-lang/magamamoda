# 🏪 JUMILA ERP — Sistema de Gestión Empresarial

Sistema ERP completo similar a KeyFacil, desarrollado para **GRUPO JUMILA SOCIEDAD ANONIMA CERRADA**.

## 🚀 Cómo Usar en Visual Studio Code

### Paso 1: Abrir el proyecto
1. Abra Visual Studio Code
2. File → Open Folder → Seleccione la carpeta `erp-jumila`

### Paso 2: Instalar extensión (recomendado)
- Instale **"Live Server"** de Ritwick Dey (buscar en Extensions: Ctrl+Shift+X)

### Paso 3: Ejecutar
- Haga clic derecho en `index.html`
- Seleccione **"Open with Live Server"**
- O simplemente abra `index.html` directamente en su navegador Chrome/Edge

## 🔑 Credenciales de Acceso
- **Usuario:** MAGAMA
- **Contraseña:** 983396116

## 📦 Estructura del Proyecto

```
erp-jumila/
├── index.html              ← Archivo principal
├── css/
│   └── styles.css          ← Estilos del sistema
├── js/
│   ├── data.js             ← Base de datos local
│   ├── app.js              ← Controlador principal
│   └── modules/
│       ├── clientes.js     ← Módulo Clientes/Proveedores
│       ├── productos.js    ← Módulo Productos/Servicios
│       ├── ventas.js       ← Módulo Ventas y Comprobantes
│       ├── caja.js         ← Módulo Caja y Arqueo
│       ├── inventario.js   ← Módulo Inventario
│       └── reportes.js     ← Módulo Reportes
└── README.md
```

## 🎯 Módulos Disponibles

| Módulo | Funcionalidades |
|--------|----------------|
| **Inicio** | Dashboard con KPIs, acciones rápidas, últimas ventas |
| **Productos/Servicios** | CRUD completo, control de stock, categorías |
| **Clientes/Proveedores** | Registro y búsqueda de clientes, filtros |
| **Ventas** | Emisión de comprobantes (Boleta, Factura, N. Venta), búsqueda de productos, métodos de pago |
| **Compras** | Registro de compras a proveedores |
| **Inventario** | Control de stock, alertas de stock bajo |
| **Caja** | Apertura/cierre de caja, arqueo, ingresos/egresos |
| **Reportes** | Estadísticas de ventas, top productos, reportes |
| **Configuración** | Datos de la empresa, tipo de cambio |

## 💡 Funcionalidades Principales

### Emisión de Comprobantes
1. Vaya a **Ventas** → Click en **+ Nuevo**
2. Seleccione el tipo de comprobante (Boleta, Factura, Nota de Venta)
3. Busque y agregue productos
4. Seleccione método de pago
5. Click en **Procesar** → Se genera e imprime automáticamente

### Control de Stock
- El stock se descuenta automáticamente al procesar ventas
- Alertas visuales para stock bajo (≤10 unidades) o agotado

### Tipos de Comprobante
- **NOTA DE VENTA** (Serie: NV03)
- **BOLETA DE VENTA ELECTRÓNICA** (Serie: BV03)
- **FACTURA ELECTRÓNICA** (Serie: FC01)

## 🔧 Personalización

Para agregar sus propios productos y clientes, edite el archivo `js/data.js`.

Para cambiar los colores del sistema, edite las variables CSS en `css/styles.css` (sección `:root`).

## 📱 Compatible Con
- Chrome ✅
- Edge ✅
- Firefox ✅
- Opera ✅

---
**Desarrollado para GRUPO JUMILA — Huánuco, Perú** 🇵🇪
