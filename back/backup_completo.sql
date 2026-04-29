-- Estructura de la Base de Datos para CDF CRM
-- Generado para replicación en otra PC

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. Tabla de Productos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `productos` (
  `id_producto` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_interno` varchar(255) UNIQUE,
  `descripcion` varchar(255),
  `proveedor` varchar(255),
  `categoria` varchar(255),
  `stock` decimal(10,3) DEFAULT 0.000,
  PRIMARY KEY (`id_producto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 2. Tabla de Sucursales
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sucursales` (
  `id_sucursal` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255),
  `ubicacion` varchar(255),
  PRIMARY KEY (`id_sucursal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. Tabla de Usuarios
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(255) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(255) DEFAULT 'operario',
  PRIMARY KEY (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 4. Tabla de Colaboradores (Fiambreros)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `colaboradores` (
  `id_colaborador` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) UNIQUE,
  `puesto` varchar(255),
  PRIMARY KEY (`id_colaborador`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 5. Tabla de Pedidos Sucursales
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pedidos_sucursales` (
  `id_pedido` varchar(255) NOT NULL,
  `codigo_pedido` varchar(255) UNIQUE,
  `id_sucursal` int(11),
  `fecha_pedido` datetime,
  `estado` varchar(255) DEFAULT 'Pendiente',
  PRIMARY KEY (`id_pedido`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 6. Detalle de Pedidos
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `items_pedidos` (
  `id_item` int(11) NOT NULL AUTO_INCREMENT,
  `id_pedido` varchar(255),
  `id_producto` int(11),
  `cantidad_piezas` int(11) DEFAULT 0,
  `cantidad_fraccionado` decimal(10,3) DEFAULT 0.000,
  PRIMARY KEY (`id_item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 7. Control de Feteado (Mermas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `detalles_feteado` (
  `id_detalle` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_producto` varchar(255) NOT NULL,
  `peso_bruto` decimal(10,3) DEFAULT 0.000,
  `cantidad_fraccionada` decimal(10,3) DEFAULT 0.000,
  `decomiso` decimal(10,3) DEFAULT 0.000,
  `recorte` decimal(10,3) DEFAULT 0.000,
  `total_feteado` decimal(10,3) DEFAULT 0.000,
  `nombre_usuario` varchar(255),
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_detalle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 8. Stock de Producción (Envasados)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_produccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(255) UNIQUE NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `cantidad_bolsitas` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;
