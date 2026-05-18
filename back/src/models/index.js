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


const Proceso = sequelize.define('Proceso', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  colaborador: { type: DataTypes.STRING },
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

// Relaciones
Producto.hasMany(Proceso, { foreignKey: 'codigo' });
Proceso.belongsTo(Producto, { foreignKey: 'codigo' });

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

module.exports = {
  sequelize,
  Producto,
  Proceso,
  Fraccionado,
  Pedido,
  ProductoPedido
};

