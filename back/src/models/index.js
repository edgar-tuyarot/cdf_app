const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
  codigo: { type: DataTypes.STRING, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  kilos_block: { type: DataTypes.DECIMAL(10, 4) },
  peso_x_pieza: { type: DataTypes.DECIMAL(10, 3) },
  cantidad_piezas: { type: DataTypes.INTEGER },
  vencimientos: { type: DataTypes.STRING },
  kg_x_bolsita: { type: DataTypes.DECIMAL(10, 3) },
  kg_fraccionados: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  kg_decomiso: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 },
  kg_recorte: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
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
  direccion: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'sucursales',
  timestamps: false
});

const IngresoRecorte = sequelize.define('IngresoRecorte', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
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
  colaborador: { type: DataTypes.STRING, allowNull: true },
  colaborador_id: { 
    type: DataTypes.INTEGER, 
    allowNull: true,
    references: {
      model: 'colaboradores',
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
  kg_a_sumar: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
}, { 
  tableName: 'procesos', 
  timestamps: false 
});

const Fraccionado = sequelize.define('Fraccionado', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
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
  estado: { type: DataTypes.STRING, defaultValue: 'Pendiente' }
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
  fraccion_enviada: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0 }
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

// Relaciones
Producto.hasMany(Proceso, { foreignKey: 'codigo' });
Proceso.belongsTo(Producto, { foreignKey: 'codigo' });

Colaborador.hasMany(Proceso, { foreignKey: 'colaborador_id', as: 'Procesos' });
Proceso.belongsTo(Colaborador, { foreignKey: 'colaborador_id', as: 'Colaborador' });

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

Pedido.hasMany(DescuentoStock, { foreignKey: 'id_pedido', as: 'Descuentos' });
DescuentoStock.belongsTo(Pedido, { foreignKey: 'id_pedido', as: 'Pedido' });

Producto.hasMany(DescuentoStock, { foreignKey: 'codigo_producto', as: 'DescuentosStock' });
DescuentoStock.belongsTo(Producto, { foreignKey: 'codigo_producto', as: 'ProductoDesc' });

module.exports = {
  sequelize,
  Producto,
  Colaborador,
  Sucursal,
  IngresoRecorte,
  Proceso,
  Fraccionado,
  Pedido,
  ProductoPedido,
  DescuentoStock
};

