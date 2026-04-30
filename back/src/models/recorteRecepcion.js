const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const RecorteRecepcion = sequelize.define('RecorteRecepcion', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_sucursal: { type: DataTypes.INTEGER, allowNull: false },
  sucursal_nombre: { type: DataTypes.STRING, allowNull: false },
  id_producto: { type: DataTypes.INTEGER, allowNull: false },
  producto_nombre: { type: DataTypes.STRING, allowNull: false },
  codigo_interno: { type: DataTypes.STRING, allowNull: false },
  peso: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
  tipo: { type: DataTypes.STRING, allowNull: false },
  fecha: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'recortes_recepcion',
  timestamps: false
});

module.exports = RecorteRecepcion;
