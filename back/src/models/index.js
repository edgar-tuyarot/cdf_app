const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
  codigo: { type: DataTypes.STRING, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  peso_x_pieza: { type: DataTypes.DECIMAL(10, 3) },
  kg_x_bolsita: { type: DataTypes.DECIMAL(10, 3) },
  permite_piezas: { type: DataTypes.BOOLEAN, defaultValue: true },
  permite_fracciones: { type: DataTypes.BOOLEAN, defaultValue: true },
  destacado: { type: DataTypes.BOOLEAN, defaultValue: false },
  codigo_barra: { type: DataTypes.STRING, allowNull: true },
  pesable: { type: DataTypes.BOOLEAN, defaultValue: true },
  codigo_fraccionado: { type: DataTypes.STRING, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: true },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'proveedores',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, { 
  tableName: 'productos', 
  timestamps: false 
});

const Colaborador = sequelize.define('Colaborador', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'colaboradores',
  timestamps: false
});

const Sucursal = sequelize.define('Sucursal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sucursal: { type: DataTypes.STRING, allowNull: false },
  numero: { type: DataTypes.INTEGER, allowNull: true },
  direccion: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: true },
  tipo: { type: DataTypes.STRING, allowNull: false, defaultValue: 'con_sector' }, // 'express', 'con_sector', 'ambas'
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ubicaciones',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'sucursales',
  timestamps: false
});

const SucursalProductoPermiso = sequelize.define('SucursalProductoPermiso', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  permite_piezas: { type: DataTypes.BOOLEAN, defaultValue: true },
  permite_fracciones: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'sucursal_producto_permisos',
  timestamps: false
});

const Proveedor = sequelize.define('Proveedor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'proveedores',
  timestamps: false
});

const Generador = sequelize.define('Generador', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tipo: { type: DataTypes.STRING, allowNull: false }, // 'colaborador', 'proveedor', 'sucursal'
  id_asociado: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'generadores',
  timestamps: false
});

const IngresoRecorte = sequelize.define('IngresoRecorte', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    }
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    }
  },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  id_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
  peso_recorte: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
}, {
  tableName: 'ingreso_recortes',
  timestamps: false
});

const Proceso = sequelize.define('Proceso', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    }
  },
  generador_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    references: {
      model: 'generadores',
      key: 'id'
    }
  },
  proceso: { type: DataTypes.STRING },
  fecha: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  codigo: { 
    type: DataTypes.STRING, 
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
  piezas: { type: DataTypes.INTEGER, defaultValue: 0 },
  peso_bruto: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  recorte: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  decomiso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  kg_a_desc: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  kg_a_sumar: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  peso_bandeja: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  pendiente: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdAt: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, { 
  tableName: 'procesos', 
  timestamps: false 
});

const Fraccionado = sequelize.define('Fraccionado', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    }
  },
  codigo_producto_original: { 
    type: DataTypes.STRING, 
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
  peso_a_fraccionar: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  codigo_fraccionado: { 
    type: DataTypes.STRING, 
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
   peso_a_descontar: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
}, { 
  tableName: 'fraccionados', 
  timestamps: false 
});

const Pedido = sequelize.define('Pedido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo: { type: DataTypes.STRING, allowNull: false },
  fecha: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  sucursal: { type: DataTypes.STRING },
  estado: { type: DataTypes.STRING, defaultValue: 'Pendiente' },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ubicaciones',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'pedidos',
  timestamps: false
});

const ProductoPedido = sequelize.define('ProductoPedido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pedidos',
      key: 'id'
    }
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
  pieza: { type: DataTypes.INTEGER, defaultValue: 0 },
  fraccion: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  peso_enviado: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  cantidad_enviada: { type: DataTypes.INTEGER, defaultValue: 0 },
  fraccion_enviada: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  confirmado: { type: DataTypes.BOOLEAN, defaultValue: false },
  no_envia: { type: DataTypes.BOOLEAN, defaultValue: false },
  sin_stock: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'producto_pedidos',
  timestamps: false
});

const DescuentoStock = sequelize.define('DescuentoStock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pedidos',
      key: 'id'
    }
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
  peso_descontado: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  campo_descontado: { type: DataTypes.STRING, allowNull: false }, // 'kg_fraccionados' o 'kilos_block'
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'descuento_stocks',
  timestamps: false
});

const ProductoVencimiento = sequelize.define('ProductoVencimiento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
  piezas: { type: DataTypes.INTEGER, defaultValue: 0 },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    }
  }
}, {
  tableName: 'producto_vencimientos',
  timestamps: false
});

const PedidoSinStock = sequelize.define('PedidoSinStock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pedidos',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'pedidos_sin_stock',
  timestamps: false
});

const IngresoProveedor = sequelize.define('IngresoProveedor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    }
  },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  proveedor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proveedores',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  piezas: { type: DataTypes.INTEGER, allowNull: false },
  vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
  peso_calculado: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  nro_factura: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'ingreso_proveedores',
  timestamps: false
});

const IngresoSucursal = sequelize.define('IngresoSucursal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    }
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  piezas: { type: DataTypes.INTEGER, allowNull: false },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sucursales',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ingresos_sucursales',
  timestamps: false
});

const MovimientoStock = sequelize.define('MovimientoStock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ubicaciones',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  tipo_movimiento: { type: DataTypes.STRING, allowNull: false }, // 'INGRESO_PROVEEDOR', 'PROCESO', 'CONVERSION', 'PEDIDO_ENVIADO', 'INGRESO_RECORTE', 'AJUSTE_DIRECTO', 'PRODUCTO_CREADO'
  referencia_id: { type: DataTypes.INTEGER, allowNull: true },
  concepto: { type: DataTypes.STRING, allowNull: false },
  cantidad_piezas: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock: { type: DataTypes.DECIMAL(10, 4), defaultValue: 0 },
  kilos_calculado: { type: DataTypes.DECIMAL(10, 4), defaultValue: 0 },
  kg_fraccionados: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  kg_decomiso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  kg_recorte: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  usuario: { type: DataTypes.STRING, defaultValue: 'Sistema' },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'movimiento_stocks',
  timestamps: false
});

const LogConversion = sequelize.define('LogConversion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    }
  },
  codigo_producto_original: { 
    type: DataTypes.STRING, 
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
  peso_descontado: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  codigo_fraccionado: { 
    type: DataTypes.STRING, 
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    }
  },
  peso_fraccionado: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  comprobante: { type: DataTypes.STRING, allowNull: false },
  usuario: { type: DataTypes.STRING, defaultValue: 'Sistema' },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'log_conversiones',
  timestamps: false
});

// Relaciones
Producto.hasMany(Proceso, { foreignKey: 'codigo' });
Proceso.belongsTo(Producto, { foreignKey: 'codigo' });

// Relaciones de Generador polimórfico
Generador.belongsTo(Colaborador, { foreignKey: 'id_asociado', constraints: false, as: 'colaborador' });
Generador.belongsTo(Proveedor, { foreignKey: 'id_asociado', constraints: false, as: 'proveedor' });
Generador.belongsTo(Sucursal, { foreignKey: 'id_asociado', constraints: false, as: 'sucursal' });

Generador.hasMany(Proceso, { foreignKey: 'generador_id', as: 'Procesos' });
Proceso.belongsTo(Generador, { foreignKey: 'generador_id', as: 'Generador' });

// Relación entre IngresoProveedor y Proveedor
Proveedor.hasMany(IngresoProveedor, { foreignKey: 'proveedor_id', as: 'Ingresos', onDelete: 'CASCADE' });
IngresoProveedor.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'Proveedor' });

// Relación entre Producto y Proveedor (Un producto tiene 1 proveedor, un proveedor tiene N productos)
Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'Productos', onDelete: 'SET NULL' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'Proveedor' });

Producto.hasMany(Fraccionado, { foreignKey: 'codigo_producto_original', as: 'Originales' });
Producto.hasMany(Fraccionado, { foreignKey: 'codigo_fraccionado', as: 'Fraccionados' });
Fraccionado.belongsTo(Producto, { foreignKey: 'codigo_producto_original', as: 'ProductoOriginal' });
Fraccionado.belongsTo(Producto, { foreignKey: 'codigo_fraccionado', as: 'ProductoFraccionado' });

Pedido.hasMany(ProductoPedido, { foreignKey: 'id_pedido', as: 'items' });
ProductoPedido.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'Pedido' });

Producto.hasMany(ProductoPedido, { foreignKey: 'codigo_producto', as: 'PedidosAsociados' });
ProductoPedido.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });

// Relación N-M directa entre Pedido y Producto (opcional, pero útil)
Pedido.belongsToMany(Producto, { through: ProductoPedido, foreignKey: 'id_pedido', otherKey: 'codigo_producto', as: 'productos' });
Producto.belongsToMany(Pedido, { through: ProductoPedido, foreignKey: 'codigo_producto', otherKey: 'id_pedido', as: 'pedidos' });

Sucursal.hasMany(IngresoRecorte, { foreignKey: 'id_sucursal', as: 'IngresosRecortes' });
IngresoRecorte.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'Sucursal' });

Producto.hasMany(IngresoRecorte, { foreignKey: 'id_producto', as: 'IngresosRecortes' });
IngresoRecorte.belongsTo(Producto, { foreignKey: 'id_producto', as: 'Producto' });

Sucursal.hasMany(IngresoSucursal, { foreignKey: 'sucursal_id', as: 'IngresosSucursales', onDelete: 'CASCADE' });
IngresoSucursal.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'Sucursal' });

Producto.hasMany(IngresoSucursal, { foreignKey: 'codigo_producto', as: 'IngresosSucursales', onDelete: 'CASCADE' });
IngresoSucursal.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });

Pedido.hasMany(DescuentoStock, { foreignKey: 'id_pedido', as: 'Descuentos' });
DescuentoStock.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'Pedido' });

Producto.hasMany(DescuentoStock, { foreignKey: 'codigo_producto', as: 'DescuentosStock' });
DescuentoStock.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'ProductoDesc' });

Pedido.hasMany(PedidoSinStock, { foreignKey: 'id_pedido', as: 'SinStockItems', onDelete: 'CASCADE' });
PedidoSinStock.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'Pedido' });

Producto.hasMany(PedidoSinStock, { foreignKey: 'codigo_producto', as: 'PedidosSinStock', onDelete: 'CASCADE' });
PedidoSinStock.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });

Producto.hasMany(ProductoVencimiento, { foreignKey: 'codigo_producto', as: 'vencimientosList', onDelete: 'CASCADE' });
ProductoVencimiento.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'producto' });

Producto.hasMany(IngresoProveedor, { foreignKey: 'codigo_producto', as: 'IngresosProveedores', onDelete: 'CASCADE' });
IngresoProveedor.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });

Producto.hasMany(MovimientoStock, { foreignKey: 'codigo_producto', as: 'movimientosStock', onDelete: 'CASCADE' });
MovimientoStock.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });

// Relaciones LogConversion
Producto.hasMany(LogConversion, { foreignKey: 'codigo_producto_original', as: 'ConversionesOrigen' });
Producto.hasMany(LogConversion, { foreignKey: 'codigo_fraccionado', as: 'ConversionesDestino' });
LogConversion.belongsTo(Producto, { foreignKey: 'codigo_producto_original', as: 'ProductoOriginal' });
LogConversion.belongsTo(Producto, { foreignKey: 'codigo_fraccionado', as: 'ProductoFraccionado' });

// Hooks de sincronización para mantener la tabla generadores en perfecto sincronismo
const createGeneradorHook = (tipo) => async (instance, options) => {
  await Generador.findOrCreate({
    where: { tipo, id_asociado: instance.id },
    transaction: options.transaction
  });
};

const deleteGeneradorHook = (tipo) => async (instance, options) => {
  await Generador.destroy({
    where: { tipo, id_asociado: instance.id },
    transaction: options.transaction
  });
};

Colaborador.afterCreate(createGeneradorHook('colaborador'));
Colaborador.beforeDestroy(deleteGeneradorHook('colaborador'));

Sucursal.afterCreate(createGeneradorHook('sucursal'));
Sucursal.beforeDestroy(deleteGeneradorHook('sucursal'));

Proveedor.afterCreate(createGeneradorHook('proveedor'));
Proveedor.beforeDestroy(deleteGeneradorHook('proveedor'));

// Hooks de auditoría automática de stock centralizada
Producto.afterCreate(async (producto, options) => {
  const fields = ['cantidad_piezas', 'kilos_block', 'kg_fraccionados', 'kg_recorte', 'kg_decomiso'];
  const initialValues = {};
  let hasStock = false;

  fields.forEach(field => {
    const val = parseFloat(producto.get(field)) || 0;
    if (val > 0) {
      initialValues[field] = val;
      hasStock = true;
    }
  });

  if (hasStock) {
    const { MovimientoStock } = sequelize.models;
    await MovimientoStock.create({
      codigo_producto: producto.codigo,
      tipo_movimiento: options.tipo_movimiento || 'PRODUCTO_CREADO',
      referencia_id: options.referencia_id || null,
      concepto: options.concepto || 'Alta inicial del producto',
      cantidad_piezas: initialValues.cantidad_piezas || 0,
      kilos_block: initialValues.kilos_block || 0,
      kg_fraccionados: initialValues.kg_fraccionados || 0,
      kg_recorte: initialValues.kg_recorte || 0,
      kg_decomiso: initialValues.kg_decomiso || 0,
      usuario: options.usuario || 'Sistema'
    }, { transaction: options.transaction });
  }

  // Inicializar ProductoStock para todas las ubicaciones en 0.0000
  const { Ubicacion, ProductoStock } = sequelize.models;
  if (Ubicacion && ProductoStock) {
    const allUbicaciones = await Ubicacion.findAll({ transaction: options.transaction });
    for (const ub of allUbicaciones) {
      await ProductoStock.findOrCreate({
        where: {
          codigo_producto: producto.codigo,
          id_ubicacion: ub.id
        },
        defaults: {
          stock: 0.0000
        },
        transaction: options.transaction
      });
    }
  }
});

Producto.afterUpdate(async (producto, options) => {
  // Omitir registro de auditoría si se indica skipAuditLog (útil para la sincronización automática de vencimientos)
  if (options.skipAuditLog) return;

  const fields = ['cantidad_piezas', 'kg_fraccionados', 'kg_recorte', 'kg_decomiso'];
  const deltas = {};
  let hasChanges = false;

  fields.forEach(field => {
    const prev = parseFloat(producto.previous(field)) || 0;
    const curr = parseFloat(producto.get(field)) || 0;
    const delta = curr - prev;
    if (Math.abs(delta) > 0.0001) {
      deltas[field] = delta;
      hasChanges = true;
    }
  });

  if (hasChanges) {
    const { MovimientoStock } = sequelize.models;
    await MovimientoStock.create({
      codigo_producto: producto.codigo,
      id_ubicacion: options.id_ubicacion || null,
      tipo_movimiento: options.tipo_movimiento || 'AJUSTE_DIRECTO',
      referencia_id: options.referencia_id || null,
      concepto: options.concepto || 'Ajuste directo de producto',
      cantidad_piezas: deltas.cantidad_piezas || 0,
      kg_fraccionados: deltas.kg_fraccionados || 0,
      kg_recorte: deltas.kg_recorte || 0,
      kg_decomiso: deltas.kg_decomiso || 0,
      usuario: options.usuario || 'Sistema'
    }, { transaction: options.transaction });
  }
});

// Función auxiliar para sincronizar automáticamente el acumulado de piezas de un producto desde sus vencimientos
const syncProductPiezas = async (codigo_producto, transaction) => {
  if (!codigo_producto) return;
  const { Producto, ProductoVencimiento } = sequelize.models;
  const totalPiezas = await ProductoVencimiento.sum('piezas', {
    where: { codigo_producto },
    transaction
  }) || 0;

  await Producto.update(
    { cantidad_piezas: totalPiezas },
    {
      where: { codigo: codigo_producto },
      transaction,
      skipAuditLog: true // Prevenir bucles y logs duplicados
    }
  );
};

// Hooks en ProductoVencimiento para actualizar de manera reactiva el stock del producto
ProductoVencimiento.afterSave(async (instance, options) => {
  await syncProductPiezas(instance.codigo_producto, options.transaction);
});

ProductoVencimiento.afterDestroy(async (instance, options) => {
  await syncProductPiezas(instance.codigo_producto, options.transaction);
});

ProductoVencimiento.afterBulkCreate(async (instances, options) => {
  if (Array.isArray(instances) && instances.length > 0) {
    const codigos = [...new Set(instances.map(i => i.codigo_producto).filter(Boolean))];
    for (const codigo of codigos) {
      await syncProductPiezas(codigo, options.transaction);
    }
  }
});

ProductoVencimiento.afterBulkDestroy(async (options) => {
  if (options.where && options.where.codigo_producto) {
    // Si se destruye de forma masiva para un producto específico, sincronizar
    const codigos = Array.isArray(options.where.codigo_producto)
      ? options.where.codigo_producto
      : [options.where.codigo_producto];
    for (const codigo of codigos) {
      await syncProductPiezas(codigo, options.transaction);
    }
  }
});

// Hook en Producto beforeSave para asegurar consistencia absoluta cada vez que se guarda o actualiza el producto
Producto.beforeSave(async (producto, options) => {
  const { ProductoVencimiento } = sequelize.models;
  const totalPiezas = await ProductoVencimiento.sum('piezas', {
    where: { codigo_producto: producto.codigo },
    transaction: options.transaction
  });

  if (totalPiezas !== null) {
    producto.cantidad_piezas = totalPiezas;
  }
});

// Tabla de seguimiento de armado en tiempo real
// Cada fila = un producto confirmado por el armador durante la preparación
const PedidoArmadoItem = sequelize.define('PedidoArmadoItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_pedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'pedidos', key: 'id' },
    onDelete: 'CASCADE'
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: { model: 'productos', key: 'codigo' }
  },
  piezas: { type: DataTypes.INTEGER, defaultValue: 0 },
  peso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  fraccion: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  no_envia: { type: DataTypes.BOOLEAN, defaultValue: false },
  sin_stock: { type: DataTypes.BOOLEAN, defaultValue: false },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'pedido_armado_items',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['id_pedido', 'codigo_producto'] }
  ]
});


const Bulto = sequelize.define('Bulto', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proveedores',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  peso_caja: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000 },
  peso_caja_vacia: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000 },
  cantidad_piezas: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'bultos',
  timestamps: false
});

// Relaciones PedidoArmadoItem
Pedido.hasMany(PedidoArmadoItem, { foreignKey: 'id_pedido', as: 'ArmadoItems', onDelete: 'CASCADE' });
PedidoArmadoItem.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'Pedido' });
Producto.hasMany(PedidoArmadoItem, { foreignKey: 'codigo_producto', as: 'ArmadoItemsProducto' });
PedidoArmadoItem.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });


// Relaciones SucursalProductoPermiso
Sucursal.hasMany(SucursalProductoPermiso, { foreignKey: 'id_sucursal', as: 'ProductoPermisos', onDelete: 'CASCADE' });
SucursalProductoPermiso.belongsTo(Sucursal, { foreignKey: 'id_sucursal', as: 'Sucursal' });
Producto.hasMany(SucursalProductoPermiso, { foreignKey: 'codigo_producto', as: 'SucursalPermisos' });
SucursalProductoPermiso.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });

// Relaciones Bulto
Producto.hasMany(Bulto, { foreignKey: 'codigo_producto', as: 'Bultos' });
Bulto.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });
Proveedor.hasMany(Bulto, { foreignKey: 'id_proveedor', as: 'Bultos' });
Bulto.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'Proveedor' });
Bulto.hasMany(IngresoProveedor, { foreignKey: 'bulto_id', as: 'Ingresos' });
IngresoProveedor.belongsTo(Bulto, { foreignKey: 'bulto_id', as: 'Bulto' });



const Ubicacion = sequelize.define('Ubicacion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero: { type: DataTypes.INTEGER, allowNull: false },
  nombre: { type: DataTypes.STRING, allowNull: false }
}, {
  tableName: 'ubicaciones',
  timestamps: false
});

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.STRING, allowNull: false },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ubicaciones',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'usuarios',
  timestamps: false
});

Usuario.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(Usuario, { foreignKey: 'id_ubicacion' });

Sucursal.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(Sucursal, { foreignKey: 'id_ubicacion' });

Pedido.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(Pedido, { foreignKey: 'id_ubicacion' });

Fraccionado.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(Fraccionado, { foreignKey: 'id_ubicacion' });

Proceso.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(Proceso, { foreignKey: 'id_ubicacion' });

LogConversion.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(LogConversion, { foreignKey: 'id_ubicacion' });

IngresoRecorte.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(IngresoRecorte, { foreignKey: 'id_ubicacion' });

IngresoSucursal.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(IngresoSucursal, { foreignKey: 'id_ubicacion' });

IngresoProveedor.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(IngresoProveedor, { foreignKey: 'id_ubicacion' });

ProductoVencimiento.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(ProductoVencimiento, { foreignKey: 'id_ubicacion' });

const ProductoStock = sequelize.define('ProductoStock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ubicaciones',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  stock: { type: DataTypes.DECIMAL(10, 4), defaultValue: 0.0000, allowNull: false },
  recorte: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000, allowNull: false },
  decomiso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000, allowNull: false },
  kg_fraccionados: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000, allowNull: false }
}, {
  tableName: 'productos_stock',
  timestamps: false
});

Producto.hasMany(ProductoStock, { foreignKey: 'codigo_producto', as: 'Stocks', onDelete: 'CASCADE' });
ProductoStock.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'Producto' });
Ubicacion.hasMany(ProductoStock, { foreignKey: 'id_ubicacion', as: 'Stocks', onDelete: 'CASCADE' });
ProductoStock.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });

MovimientoStock.belongsTo(Ubicacion, { foreignKey: 'id_ubicacion', as: 'Ubicacion' });
Ubicacion.hasMany(MovimientoStock, { foreignKey: 'id_ubicacion' });

// Hooks en el modelo ProductoStock para auditorías por ubicación
ProductoStock.afterCreate(async (prodStock, options) => {
  const stockVal = parseFloat(prodStock.stock) || 0;
  if (stockVal !== 0) {
    const { MovimientoStock } = sequelize.models;
    await MovimientoStock.create({
      codigo_producto: prodStock.codigo_producto,
      id_ubicacion: prodStock.id_ubicacion,
      tipo_movimiento: options.tipo_movimiento || 'PRODUCTO_CREADO',
      referencia_id: options.referencia_id || null,
      concepto: options.concepto || 'Alta inicial del stock en ubicación',
      stock: stockVal,
      kilos_calculado: stockVal,
      usuario: options.usuario || 'Sistema'
    }, { transaction: options.transaction });
  }
});

ProductoStock.afterUpdate(async (prodStock, options) => {
  if (options.skipAuditLog) return;
  const prevStock = parseFloat(prodStock.previous('stock')) || 0;
  const currStock = parseFloat(prodStock.stock) || 0;
  const delta = currStock - prevStock;

  const piezasOpt = options.cantidad_piezas !== undefined ? options.cantidad_piezas : 0;
  const kgRecorteOpt = parseFloat(options.kg_recorte) || 0;
  const kgDecomisoOpt = parseFloat(options.kg_decomiso) || 0;

  if (Math.abs(delta) > 0.0001 || piezasOpt !== 0 || kgRecorteOpt !== 0 || kgDecomisoOpt !== 0) {
    const { MovimientoStock } = sequelize.models;
    let finalKilos = delta;
    if (Math.abs(finalKilos) < 0.0001) {
      if (kgDecomisoOpt !== 0) finalKilos = kgDecomisoOpt;
      else if (kgRecorteOpt !== 0) finalKilos = kgRecorteOpt;
    }

    await MovimientoStock.create({
      codigo_producto: prodStock.codigo_producto,
      id_ubicacion: prodStock.id_ubicacion,
      tipo_movimiento: options.tipo_movimiento || 'AJUSTE_DIRECTO',
      referencia_id: options.referencia_id || null,
      concepto: options.concepto || 'Ajuste de stock en ubicación',
      stock: finalKilos,
      kilos_calculado: finalKilos,
      cantidad_piezas: piezasOpt,
      kg_recorte: kgRecorteOpt,
      kg_decomiso: kgDecomisoOpt,
      usuario: options.usuario || 'Sistema'
    }, { transaction: options.transaction });
  }
});

const RolPermiso = sequelize.define('RolPermiso', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rol: { type: DataTypes.STRING, allowNull: false },
  vista: { type: DataTypes.STRING, allowNull: false },
  permitido: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'rol_permisos',
  timestamps: false
});

const OrdenCompra = sequelize.define('OrdenCompra', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero_orden: { type: DataTypes.STRING, allowNull: false },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proveedores',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  fecha: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  estado: { type: DataTypes.STRING, defaultValue: 'Pendiente' }, // 'Pendiente', 'Recibida', 'Cancelada'
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  id_ubicacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ubicaciones',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'ordenes_compra',
  timestamps: true
});

const OrdenCompraItem = sequelize.define('OrdenCompraItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_orden_compra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ordenes_compra',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  codigo_producto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'codigo'
    },
    onDelete: 'CASCADE'
  },
  cantidad_cajas: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  cantidad_piezas: { type: DataTypes.INTEGER, defaultValue: 0 },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'orden_compra_items',
  timestamps: false
});

OrdenCompra.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
Proveedor.hasMany(OrdenCompra, { foreignKey: 'id_proveedor', as: 'ordenesCompra' });

OrdenCompra.hasMany(OrdenCompraItem, { foreignKey: 'id_orden_compra', as: 'items', onDelete: 'CASCADE' });
OrdenCompraItem.belongsTo(OrdenCompra, { foreignKey: 'id_orden_compra', as: 'ordenCompra' });

OrdenCompraItem.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'producto' });
Producto.hasMany(OrdenCompraItem, { foreignKey: 'codigo_producto', as: 'ordenCompraItems' });

const Registro = sequelize.define('Registro', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  texto: { type: DataTypes.TEXT, allowNull: false },
  usuario_registro: { type: DataTypes.STRING, allowNull: false },
  id_ubicacion: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'registros',
  timestamps: false
});

// Garantizar migración segura de columnas y tablas
(async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();
    try {
      const tableDef = await queryInterface.describeTable('producto_vencimientos');
      if (!tableDef.peso) {
        await queryInterface.addColumn('producto_vencimientos', 'peso', {
          type: DataTypes.DECIMAL(10, 3),
          allowNull: true,
          defaultValue: 0
        });
        console.log('[Migration] Columna "peso" agregada exitosamente a "producto_vencimientos".');
      }
    } catch (e) {}

    try {
      await queryInterface.describeTable('registros');
    } catch (e) {
      await queryInterface.createTable('registros', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        texto: { type: DataTypes.TEXT, allowNull: false },
        usuario_registro: { type: DataTypes.STRING, allowNull: false },
        id_ubicacion: { type: DataTypes.INTEGER, allowNull: true }
      });
      console.log('[Migration] Tabla "registros" creada exitosamente.');
    }
  } catch (err) {
    // Continuar de forma silenciosa
  }
})();

module.exports = {
  sequelize,
  Producto,
  Colaborador,
  Sucursal,
  Proveedor,
  Generador,
  IngresoRecorte,
  Proceso,
  Fraccionado,
  Pedido,
  ProductoPedido,
  DescuentoStock,
  ProductoVencimiento,
  IngresoProveedor,
  MovimientoStock,
  IngresosSucursal: IngresoSucursal,
  Usuario,
  Ubicacion,
  ProductoStock,
  PedidoSinStock,
  LogConversion,
  PedidoArmadoItem,
  SucursalProductoPermiso,
  RolPermiso,
  Bulto,
  OrdenCompra,
  OrdenCompraItem,
  Registro
};


