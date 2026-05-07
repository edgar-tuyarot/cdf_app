-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         12.2.2-MariaDB - MariaDB Server
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.17.0.7270
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Volcando datos para la tabla cdf_bbdd.existencias: ~83 rows (aproximadamente)
REPLACE INTO `existencias` (`id`, `estado`, `kilos`, `ubicacion`, `ultima_actualizacion`, `unidades`, `producto_id`, `ubicacion_id`) VALUES
	(1, 'KILOS', 4.980, NULL, '2026-05-05 08:46:38.550789', 0, 4, 1),
	(2, 'KILOS', 151.425, NULL, '2026-05-05 08:46:38.567806', 0, 5, 1),
	(3, 'KILOS', 3.206, NULL, '2026-05-05 08:46:38.574254', 0, 6, 1),
	(4, 'KILOS', -1.795, NULL, '2026-05-07 14:25:38.394288', 0, 7, 1),
	(5, 'KILOS', 109.990, NULL, '2026-05-05 08:46:38.585099', 0, 8, 1),
	(6, 'KILOS', 16.350, NULL, '2026-05-05 08:46:38.592438', 0, 9, 1),
	(7, 'KILOS', 8.905, NULL, '2026-05-05 08:46:38.599802', 0, 10, 1),
	(8, 'KILOS', 9.420, NULL, '2026-05-05 08:46:38.606083', 0, 11, 1),
	(9, 'KILOS', 16.460, NULL, '2026-05-05 08:46:38.611743', 0, 12, 1),
	(10, 'KILOS', 163.842, NULL, '2026-05-07 14:24:42.510831', 0, 13, 1),
	(11, 'KILOS', 0.090, NULL, '2026-05-05 08:46:38.624268', 0, 14, 1),
	(12, 'KILOS', 31.850, NULL, '2026-05-05 08:46:38.629389', 0, 15, 1),
	(13, 'KILOS', 30.270, NULL, '2026-05-05 08:46:38.634581', 0, 16, 1),
	(14, 'KILOS', 51.890, NULL, '2026-05-05 08:46:38.639908', 0, 17, 1),
	(15, 'KILOS', 25.875, NULL, '2026-05-05 08:46:38.645401', 0, 18, 1),
	(16, 'KILOS', 5.165, NULL, '2026-05-05 08:46:38.649779', 0, 19, 1),
	(17, 'KILOS', 7.490, NULL, '2026-05-05 08:46:38.654178', 0, 20, 1),
	(18, 'KILOS', 2.345, NULL, '2026-05-05 08:46:38.659178', 0, 21, 1),
	(19, 'KILOS', 0.150, NULL, '2026-05-05 08:46:38.664526', 0, 22, 1),
	(20, 'KILOS', 0.005, NULL, '2026-05-05 08:46:38.669274', 0, 23, 1),
	(21, 'KILOS', 50.990, NULL, '2026-05-05 08:46:38.673576', 0, 24, 1),
	(22, 'KILOS', 0.100, NULL, '2026-05-05 08:46:38.677091', 0, 25, 1),
	(23, 'KILOS', 0.200, NULL, '2026-05-05 08:46:38.681410', 0, 26, 1),
	(24, 'KILOS', 33.845, NULL, '2026-05-05 08:46:38.685678', 0, 27, 1),
	(25, 'KILOS', 12.190, NULL, '2026-05-05 08:46:38.690423', 0, 28, 1),
	(26, 'KILOS', 0.225, NULL, '2026-05-05 08:46:38.694774', 0, 29, 1),
	(27, 'KILOS', 33.900, NULL, '2026-05-05 08:46:38.699689', 0, 30, 1),
	(28, 'KILOS', 20.090, NULL, '2026-05-05 08:46:38.704457', 0, 31, 1),
	(29, 'KILOS', 112.675, NULL, '2026-05-05 08:46:38.709452', 0, 32, 1),
	(30, 'KILOS', 2.645, NULL, '2026-05-05 08:46:38.714069', 0, 33, 1),
	(31, 'KILOS', 8.834, NULL, '2026-05-07 13:10:59.232135', 0, 34, 1),
	(32, 'KILOS', 119.695, NULL, '2026-05-07 14:23:00.177167', 0, 1, 1),
	(33, 'KILOS', 12.875, NULL, '2026-05-05 08:46:38.741140', 0, 35, 1),
	(34, 'KILOS', 8.910, NULL, '2026-05-05 08:46:38.749676', 0, 36, 1),
	(35, 'KILOS', 3.045, NULL, '2026-05-05 08:46:38.758755', 0, 37, 1),
	(36, 'KILOS', 204.105, NULL, '2026-05-06 13:21:55.589324', 0, 38, 1),
	(37, 'KILOS', 159.471, NULL, '2026-05-05 08:46:38.804301', 0, 39, 1),
	(38, 'KILOS', 23.865, NULL, '2026-05-05 08:46:38.812516', 0, 40, 1),
	(39, 'KILOS', 5.110, NULL, '2026-05-05 08:46:38.817549', 0, 41, 1),
	(40, 'KILOS', 0.010, NULL, '2026-05-05 08:46:38.822625', 0, 42, 1),
	(41, 'KILOS', 29.585, NULL, '2026-05-05 08:46:38.829223', 0, 43, 1),
	(42, 'KILOS', 3.615, NULL, '2026-05-05 08:46:38.834145', 0, 44, 1),
	(43, 'KILOS', 11.740, NULL, '2026-05-05 08:46:38.839561', 0, 45, 1),
	(44, 'KILOS', 0.860, NULL, '2026-05-05 08:46:38.849726', 0, 46, 1),
	(45, 'KILOS', 0.740, NULL, '2026-05-05 08:46:38.853497', 0, 47, 1),
	(46, 'KILOS', 2.400, NULL, '2026-05-05 08:46:38.858649', 0, 48, 1),
	(47, 'KILOS', 24.045, NULL, '2026-05-05 08:46:38.863282', 0, 49, 1),
	(48, 'KILOS', 3.075, NULL, '2026-05-05 08:46:38.867057', 0, 50, 1),
	(49, 'KILOS', 17.290, NULL, '2026-05-05 08:46:38.871797', 0, 51, 1),
	(50, 'KILOS', 3.065, NULL, '2026-05-05 08:46:38.876131', 0, 52, 1),
	(51, 'KILOS', 28.762, NULL, '2026-05-05 08:46:38.880048', 0, 53, 1),
	(52, 'KILOS', 15.990, NULL, '2026-05-05 08:46:38.884276', 0, 54, 1),
	(53, 'KILOS', 10.770, NULL, '2026-05-05 08:46:38.889684', 0, 55, 1),
	(54, 'KILOS', 8.364, NULL, '2026-05-05 08:46:38.893197', 0, 56, 1),
	(55, 'KILOS', 9.574, NULL, '2026-05-05 08:46:38.899577', 0, 57, 1),
	(56, 'KILOS', 1.985, NULL, '2026-05-05 08:46:38.905551', 0, 58, 1),
	(57, 'KILOS', 15.545, NULL, '2026-05-05 08:46:38.910673', 0, 59, 1),
	(58, 'KILOS', 0.260, NULL, '2026-05-05 08:46:38.914851', 0, 60, 1),
	(59, 'KILOS', 16.075, NULL, '2026-05-05 08:46:38.924973', 0, 61, 1),
	(60, 'KILOS', 13.135, NULL, '2026-05-05 08:46:38.929583', 0, 62, 1),
	(61, 'KILOS', 0.705, NULL, '2026-05-05 08:46:38.935260', 0, 63, 1),
	(62, 'KILOS', 1.339, NULL, '2026-05-05 08:46:38.944858', 0, 64, 1),
	(63, 'KILOS', 12.820, NULL, '2026-05-05 08:46:38.950037', 0, 65, 1),
	(64, 'KILOS', 284.935, NULL, '2026-05-05 08:46:38.958107', 0, 66, 1),
	(65, 'KILOS', 2001.000, NULL, '2026-05-05 08:46:38.963406', 0, 67, 1),
	(66, 'KILOS', 7500.000, NULL, '2026-05-05 08:46:38.966422', 0, 68, 1),
	(67, 'PIEZA', 0.000, NULL, '2026-05-04 20:30:08.617666', -1, 24, 1),
	(68, 'ENVASADO', 0.000, NULL, '2026-05-04 20:30:08.631436', 20, 24, 1),
	(69, 'RECORTE', 0.265, NULL, '2026-05-07 11:30:19.834243', 0, 24, 1),
	(70, 'DECOMISADO', 0.302, NULL, '2026-05-04 20:30:08.639063', 0, 24, 1),
	(71, 'PIEZA', 0.000, NULL, '2026-05-07 14:23:00.173085', -16, 1, 1),
	(72, 'ENVASADO', 0.000, NULL, '2026-05-04 23:19:48.308261', 60, 1, 1),
	(73, 'RECORTE', 1.385, NULL, '2026-05-07 14:23:00.190194', 0, 1, 1),
	(74, 'DECOMISADO', 2.216, NULL, '2026-05-07 14:23:00.194457', 0, 1, 1),
	(75, 'FETEADO', 0.000, NULL, '2026-05-07 14:23:00.182167', 278, 1, 1),
	(76, 'PIEZA', 0.000, NULL, '2026-05-06 13:21:55.581716', -4, 38, 1),
	(77, 'FETEADO', 0.000, NULL, '2026-05-06 13:21:55.593360', 33, 38, 1),
	(78, 'RECORTE', 0.935, NULL, '2026-05-06 13:21:55.600090', 0, 38, 1),
	(79, 'DECOMISADO', 0.310, NULL, '2026-05-06 13:21:55.604163', 0, 38, 1),
	(80, 'ENVASADO', 0.000, NULL, '2026-05-04 23:21:21.791307', 18, 38, 1),
	(81, 'KILOS', 0.215, NULL, '2026-05-05 07:58:47.669512', 0, 102, 1),
	(82, 'KILOS', 0.560, NULL, '2026-05-05 07:58:47.763884', 0, 103, 1),
	(83, 'ENVASADO', 0.000, NULL, '2026-05-05 09:33:30.419813', 15, 152, 1),
	(84, 'PIEZA', 0.000, NULL, '2026-05-07 14:24:42.501361', -5, 13, 1),
	(85, 'FETEADO', 0.000, NULL, '2026-05-07 14:24:42.512429', 131, 13, 1),
	(86, 'RECORTE', 0.930, NULL, '2026-05-07 14:24:42.516027', 0, 13, 1),
	(87, 'DECOMISADO', 0.100, NULL, '2026-05-07 14:24:42.522595', 0, 13, 1),
	(88, 'PIEZA', 0.000, NULL, '2026-05-07 14:25:38.387699', -5, 7, 1),
	(89, 'FETEADO', 0.000, NULL, '2026-05-07 14:25:38.396352', 135, 7, 1),
	(90, 'RECORTE', 0.925, NULL, '2026-05-07 14:25:38.403021', 0, 7, 1),
	(91, 'DECOMISADO', 0.170, NULL, '2026-05-07 14:25:38.406507', 0, 7, 1);

-- Volcando datos para la tabla cdf_bbdd.fraccionados: ~2 rows (aproximadamente)
REPLACE INTO `fraccionados` (`id`, `codigo_producto_nuevo`, `codigo_producto_original`) VALUES
	(1, '3756', '8010'),
	(2, '3740', '3755');

-- Volcando datos para la tabla cdf_bbdd.movimientos: ~46 rows (aproximadamente)
REPLACE INTO `movimientos` (`id`, `cantidad`, `fecha`, `motivo`, `proceso_id`, `producto_id`, `estado`) VALUES
	(11, 1.00, '2026-05-04 20:55:00.781777', 'SALIDA', 3, 1, 'PIEZA'),
	(12, 3.25, '2026-05-04 20:55:00.790550', 'SALIDA', 3, 1, 'KILOS'),
	(13, 15.00, '2026-05-04 20:55:00.794302', 'ENTRADA', 3, 1, 'ENVASADO'),
	(14, 0.30, '2026-05-04 20:55:00.797749', 'ENTRADA', 3, 1, 'RECORTE'),
	(15, 0.95, '2026-05-04 20:55:00.801604', 'ENTRADA', 3, 1, 'DECOMISADO'),
	(16, 1.00, '2026-05-04 21:24:21.116122', 'SALIDA', 4, 1, 'PIEZA'),
	(17, 3.10, '2026-05-04 21:24:21.119648', 'SALIDA', 4, 1, 'KILOS'),
	(18, 12.00, '2026-05-04 21:24:21.123526', 'ENTRADA', 4, 1, 'ENVASADO'),
	(19, 0.29, '2026-05-04 21:24:21.127305', 'ENTRADA', 4, 1, 'RECORTE'),
	(20, 0.09, '2026-05-04 21:24:21.130871', 'ENTRADA', 4, 1, 'DECOMISADO'),
	(21, 1.00, '2026-05-04 21:33:24.646922', 'SALIDA', 5, 1, 'PIEZA'),
	(22, 3.12, '2026-05-04 21:33:24.660419', 'SALIDA', 5, 1, 'KILOS'),
	(23, 15.00, '2026-05-04 21:33:24.664916', 'ENTRADA', 5, 1, 'FETEADO'),
	(24, 0.31, '2026-05-04 21:33:24.668385', 'ENTRADA', 5, 1, 'RECORTE'),
	(25, 0.11, '2026-05-04 21:33:24.671922', 'ENTRADA', 5, 1, 'DECOMISADO'),
	(26, 15.00, '2026-05-04 23:19:48.281910', 'SALIDA', 6, 1, 'FETEADO'),
	(27, 15.00, '2026-05-04 23:19:48.306764', 'ENTRADA', 6, 1, 'ENVASADO'),
	(28, 1.00, '2026-05-04 23:20:43.782728', 'SALIDA', 7, 38, 'PIEZA'),
	(29, 3.33, '2026-05-04 23:20:43.787703', 'SALIDA', 7, 38, 'KILOS'),
	(30, 18.00, '2026-05-04 23:20:43.792306', 'ENTRADA', 7, 38, 'FETEADO'),
	(31, 0.32, '2026-05-04 23:20:43.797056', 'ENTRADA', 7, 38, 'RECORTE'),
	(32, 0.09, '2026-05-04 23:20:43.800746', 'ENTRADA', 7, 38, 'DECOMISADO'),
	(33, 18.00, '2026-05-04 23:21:21.788108', 'SALIDA', 8, 38, 'FETEADO'),
	(34, 18.00, '2026-05-04 23:21:21.792012', 'ENTRADA', 8, 38, 'ENVASADO'),
	(35, 1.00, '2026-05-05 09:33:14.185749', 'SALIDA', 9, 1, 'PIEZA'),
	(36, 3.09, '2026-05-05 09:33:14.197841', 'SALIDA', 9, 1, 'KILOS'),
	(37, 15.00, '2026-05-05 09:33:14.205871', 'ENTRADA', 9, 1, 'FETEADO'),
	(38, 0.29, '2026-05-05 09:33:14.209872', 'ENTRADA', 9, 1, 'RECORTE'),
	(39, 0.09, '2026-05-05 09:33:14.214415', 'ENTRADA', 9, 1, 'DECOMISADO'),
	(40, 15.00, '2026-05-05 09:33:30.408201', 'SALIDA', 10, 1, 'FETEADO'),
	(41, 15.00, '2026-05-05 09:33:30.421828', 'ENTRADA', 10, 152, 'ENVASADO'),
	(42, 2.00, '2026-05-06 09:58:41.112884', 'SALIDA', 11, 38, 'PIEZA'),
	(43, 3.13, '2026-05-06 09:58:41.189125', 'SALIDA', 11, 38, 'KILOS'),
	(44, 18.00, '2026-05-06 09:58:41.199296', 'ENTRADA', 11, 38, 'FETEADO'),
	(45, 0.32, '2026-05-06 09:58:41.204304', 'ENTRADA', 11, 38, 'RECORTE'),
	(46, 0.13, '2026-05-06 09:58:41.208379', 'ENTRADA', 11, 38, 'DECOMISADO'),
	(47, 1.00, '2026-05-06 13:21:55.579060', 'SALIDA', 12, 38, 'PIEZA'),
	(48, 3.13, '2026-05-06 13:21:55.586190', 'SALIDA', 12, 38, 'KILOS'),
	(49, 15.00, '2026-05-06 13:21:55.590324', 'ENTRADA', 12, 38, 'FETEADO'),
	(50, 0.30, '2026-05-06 13:21:55.596025', 'ENTRADA', 12, 38, 'RECORTE'),
	(51, 0.10, '2026-05-06 13:21:55.603151', 'ENTRADA', 12, 38, 'DECOMISADO'),
	(52, 1.00, '2026-05-06 13:22:28.939263', 'SALIDA', 13, 1, 'PIEZA'),
	(53, 3.00, '2026-05-06 13:22:28.943268', 'SALIDA', 13, 1, 'KILOS'),
	(54, 10.00, '2026-05-06 13:22:28.948364', 'ENTRADA', 13, 1, 'FETEADO'),
	(55, 0.30, '2026-05-06 13:22:28.954216', 'ENTRADA', 13, 1, 'RECORTE'),
	(56, 0.10, '2026-05-06 13:22:28.957245', 'ENTRADA', 13, 1, 'DECOMISADO'),
	(57, 2.79, '2026-05-07 13:10:59.201927', 'SALIDA', 14, 1, 'RECORTE'),
	(58, 2.79, '2026-05-07 13:10:59.230959', 'ENTRADA', 14, 34, 'KILOS'),
	(59, 5.00, '2026-05-07 14:22:15.639569', 'SALIDA', 15, 1, 'PIEZA'),
	(60, 17.61, '2026-05-07 14:22:15.655096', 'SALIDA', 15, 1, 'KILOS'),
	(61, 136.00, '2026-05-07 14:22:15.659046', 'ENTRADA', 15, 1, 'FETEADO'),
	(62, 0.61, '2026-05-07 14:22:15.668375', 'ENTRADA', 15, 1, 'RECORTE'),
	(63, 0.61, '2026-05-07 14:22:15.684189', 'ENTRADA', 15, 1, 'DECOMISADO'),
	(64, 5.00, '2026-05-07 14:23:00.171054', 'SALIDA', 16, 1, 'PIEZA'),
	(65, 17.56, '2026-05-07 14:23:00.175105', 'SALIDA', 16, 1, 'KILOS'),
	(66, 132.00, '2026-05-07 14:23:00.179172', 'ENTRADA', 16, 1, 'FETEADO'),
	(67, 0.78, '2026-05-07 14:23:00.188194', 'ENTRADA', 16, 1, 'RECORTE'),
	(68, 0.20, '2026-05-07 14:23:00.193449', 'ENTRADA', 16, 1, 'DECOMISADO'),
	(69, 5.00, '2026-05-07 14:24:42.506148', 'SALIDA', 17, 13, 'PIEZA'),
	(70, 18.16, '2026-05-07 14:24:42.508826', 'SALIDA', 17, 13, 'KILOS'),
	(71, 131.00, '2026-05-07 14:24:42.513437', 'ENTRADA', 17, 13, 'FETEADO'),
	(72, 0.93, '2026-05-07 14:24:42.519588', 'ENTRADA', 17, 13, 'RECORTE'),
	(73, 0.10, '2026-05-07 14:24:42.523594', 'ENTRADA', 17, 13, 'DECOMISADO'),
	(74, 5.00, '2026-05-07 14:25:38.388736', 'SALIDA', 18, 7, 'PIEZA'),
	(75, 21.47, '2026-05-07 14:25:38.392319', 'SALIDA', 18, 7, 'KILOS'),
	(76, 135.00, '2026-05-07 14:25:38.397361', 'ENTRADA', 18, 7, 'FETEADO'),
	(77, 0.93, '2026-05-07 14:25:38.404029', 'ENTRADA', 18, 7, 'RECORTE'),
	(78, 0.17, '2026-05-07 14:25:38.409967', 'ENTRADA', 18, 7, 'DECOMISADO');

-- Volcando datos para la tabla cdf_bbdd.pedido_final_items: ~0 rows (aproximadamente)
REPLACE INTO `pedido_final_items` (`id`, `cantidad`, `estado`, `peso_real`, `pedido_final_id`, `producto_id`) VALUES
	(7, 3, 'FETEADO', 3.000, 3, 62),
	(8, 10, 'FETEADO', 2.850, 3, 40),
	(9, 4, 'FETEADO', 1.050, 3, 11),
	(10, 35, 'FETEADO', 1.250, 4, 13);

-- Volcando datos para la tabla cdf_bbdd.pedido_productos: ~32 rows (aproximadamente)
REPLACE INTO `pedido_productos` (`id`, `cantidad`, `tipo`, `pedido_id`, `producto_id`) VALUES
	(13, 20, 'FETEADO', 6, 34),
	(14, 12, 'PIEZA', 6, 57),
	(15, 12, 'PIEZA', 6, 56),
	(16, 8, 'FETEADO', 6, 26),
	(17, 1, 'PIEZA', 6, 55),
	(18, 35, 'FETEADO', 6, 14),
	(19, 50, 'FETEADO', 6, 7),
	(20, 20, 'FETEADO', 6, 62),
	(21, 15, 'FETEADO', 6, 43),
	(22, 50, 'FETEADO', 6, 1),
	(23, 50, 'FETEADO', 6, 24),
	(24, 50, 'FETEADO', 6, 13),
	(25, 50, 'FETEADO', 6, 66),
	(26, 50, 'FETEADO', 6, 5),
	(27, 20, 'FETEADO', 6, 49),
	(28, 30, 'FETEADO', 6, 48),
	(29, 20, 'FETEADO', 6, 40),
	(30, 20, 'FETEADO', 6, 28),
	(31, 5, 'FETEADO', 6, 19),
	(32, 45, 'FETEADO', 6, 39),
	(33, 45, 'FETEADO', 6, 17),
	(34, 5, 'FETEADO', 6, 35),
	(35, 15, 'FETEADO', 6, 44),
	(36, 10, 'FETEADO', 6, 46),
	(37, 45, 'FETEADO', 6, 45),
	(38, 15, 'FETEADO', 6, 60),
	(39, 40, 'FETEADO', 6, 32),
	(40, 15, 'FETEADO', 6, 59),
	(41, 20, 'FETEADO', 6, 30),
	(42, 45, 'FETEADO', 6, 38),
	(43, 15, 'FETEADO', 6, 33),
	(44, 5, 'FETEADO', 6, 20),
	(45, 4, 'FETEADO', 7, 11),
	(46, 50, 'FETEADO', 7, 7),
	(47, 40, 'FETEADO', 7, 8),
	(48, 4, 'FETEADO', 7, 62),
	(49, 4, 'FETEADO', 7, 43),
	(50, 10, 'FETEADO', 7, 24),
	(51, 50, 'FETEADO', 7, 13),
	(52, 20, 'FETEADO', 7, 5),
	(53, 4, 'FETEADO', 7, 48),
	(54, 40, 'FETEADO', 7, 66),
	(55, 15, 'FETEADO', 7, 40),
	(56, 5, 'FETEADO', 7, 19),
	(57, 10, 'FETEADO', 7, 32),
	(58, 15, 'FETEADO', 7, 30),
	(59, 50, 'FETEADO', 7, 38),
	(60, 10, 'FETEADO', 7, 46),
	(61, 50, 'FETEADO', 7, 45),
	(62, 75, 'FETEADO', 8, 14),
	(63, 80, 'FETEADO', 8, 7),
	(64, 80, 'FETEADO', 8, 8),
	(65, 50, 'FETEADO', 8, 1),
	(66, 75, 'FETEADO', 8, 24),
	(67, 75, 'FETEADO', 8, 13),
	(68, 70, 'FETEADO', 8, 5),
	(69, 16, 'FETEADO', 8, 28),
	(70, 35, 'FETEADO', 8, 17),
	(71, 12, 'FETEADO', 8, 46),
	(72, 35, 'FETEADO', 8, 45),
	(73, 35, 'FETEADO', 8, 32),
	(74, 12, 'FETEADO', 8, 30),
	(75, 35, 'FETEADO', 8, 38),
	(76, 40, 'FETEADO', 9, 61),
	(77, 10, 'FETEADO', 9, 11),
	(78, 15, 'FETEADO', 9, 14),
	(79, 10, 'FETEADO', 9, 12),
	(80, 50, 'FETEADO', 9, 7),
	(81, 15, 'FETEADO', 9, 9),
	(82, 20, 'FETEADO', 9, 8),
	(83, 10, 'FETEADO', 9, 31),
	(84, 10, 'FETEADO', 9, 58),
	(85, 10, 'FETEADO', 9, 51),
	(86, 15, 'FETEADO', 9, 43),
	(87, 60, 'FETEADO', 9, 1),
	(88, 20, 'FETEADO', 9, 24),
	(89, 20, 'FETEADO', 9, 13),
	(90, 20, 'FETEADO', 9, 5),
	(91, 20, 'FETEADO', 9, 49),
	(92, 15, 'FETEADO', 9, 48),
	(93, 15, 'FETEADO', 9, 40),
	(94, 20, 'FETEADO', 9, 18),
	(95, 20, 'FETEADO', 9, 28),
	(96, 50, 'FETEADO', 9, 39),
	(97, 40, 'FETEADO', 9, 17),
	(98, 25, 'FETEADO', 9, 44),
	(99, 20, 'FETEADO', 9, 46),
	(100, 30, 'FETEADO', 9, 45),
	(101, 15, 'FETEADO', 9, 60),
	(102, 50, 'FETEADO', 9, 32),
	(103, 20, 'FETEADO', 9, 59),
	(104, 20, 'FETEADO', 9, 30),
	(105, 60, 'FETEADO', 9, 38),
	(106, 15, 'FETEADO', 9, 33),
	(107, 10, 'FETEADO', 9, 20);

-- Volcando datos para la tabla cdf_bbdd.pedidos: ~1 rows (aproximadamente)
REPLACE INTO `pedidos` (`id`, `fecha`, `sucursal_id`, `estado`) VALUES
	(6, '2026-05-04 21:00:00.000000', 3, 'PREPARANDO'),
	(7, '2026-05-04 21:00:00.000000', 5, 'PREPARANDO'),
	(8, '2026-05-04 21:00:00.000000', 7, 'NUEVO'),
	(9, '2026-05-04 21:00:00.000000', 4, 'NUEVO');

-- Volcando datos para la tabla cdf_bbdd.pedidos_finales: ~0 rows (aproximadamente)
REPLACE INTO `pedidos_finales` (`id`, `fecha_creacion`, `pedido_original_id`) VALUES
	(3, '2026-05-05 14:57:48.122207', 7),
	(4, '2026-05-06 13:20:38.959759', 6);

-- Volcando datos para la tabla cdf_bbdd.pedidos_productos: ~0 rows (aproximadamente)

-- Volcando datos para la tabla cdf_bbdd.pedidos_productos_seq: ~1 rows (aproximadamente)
REPLACE INTO `pedidos_productos_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(1, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.procesos: ~11 rows (aproximadamente)
REPLACE INTO `procesos` (`id`, `fecha`, `tipo`, `usuario_id`) VALUES
	(3, '2026-05-04 20:55:00.752270', 'FRACCIONADO', 3),
	(4, '2026-05-04 21:24:21.112014', 'FRACCIONADO', 3),
	(5, '2026-05-04 21:33:24.623057', 'FRACCIONADO', 3),
	(6, '2026-05-04 23:19:48.256176', 'ENVASADO', 3),
	(7, '2026-05-04 23:20:43.776459', 'FRACCIONADO', 3),
	(8, '2026-05-04 23:21:21.785170', 'ENVASADO', 3),
	(9, '2026-05-05 09:33:14.143002', 'FRACCIONADO', 3),
	(10, '2026-05-05 09:33:30.403100', 'ENVASADO', 3),
	(11, '2026-05-06 09:58:40.209355', 'FRACCIONADO', 5),
	(12, '2026-05-06 13:21:55.565333', 'FRACCIONADO', 3),
	(13, '2026-05-06 13:22:28.936180', 'FRACCIONADO', 3),
	(14, '2026-05-07 13:10:59.118317', 'PICADO', 2),
	(15, '2026-05-07 14:22:15.593813', 'FRACCIONADO', 3),
	(16, '2026-05-07 14:23:00.166776', 'FRACCIONADO', 3),
	(17, '2026-05-07 14:24:42.491826', 'FRACCIONADO', 3),
	(18, '2026-05-07 14:25:38.381972', 'FRACCIONADO', 3);

-- Volcando datos para la tabla cdf_bbdd.productos: ~70 rows (aproximadamente)
REPLACE INTO `productos` (`id`, `codigo`, `feteable`, `kilos_por_bolsita`, `nombre`, `picable`, `proveedor_id`) VALUES
	(1, '8010', b'1', 0.22, 'PAULINA PATEGRAS P/SANDWICH', b'1', NULL),
	(4, '2374', b'0', NULL, 'FIAM LARIO SALAME BAST GRUESO', b'0', NULL),
	(5, '2379', b'0', 0.35, 'FIQU PAULINA CREMOSO X KG', b'0', 1),
	(6, '2381', b'0', NULL, 'FIAM LARIO JAMON CRUDO', b'0', NULL),
	(7, '2420', b'0', NULL, 'FIQU TREGAR DANBO X KG.', b'0', NULL),
	(8, '2422', b'0', NULL, 'FIQU TREGAR CREMOSO X KG', b'0', NULL),
	(9, '2424', b'0', NULL, 'FIQU TREGAR CRIOLLO X KG', b'0', NULL),
	(10, '2427', b'0', NULL, 'FIQU TREGAR FONTINA X KG', b'0', NULL),
	(11, '2431', b'0', NULL, 'FIQU TREGAR PATEGRAS X KG', b'0', NULL),
	(12, '2434', b'0', NULL, 'FIQU TREGAR HOLANDA X KG', b'0', NULL),
	(13, '2435', b'0', NULL, 'FIQU PAULINA DANBO X KG', b'0', NULL),
	(14, '2438', b'0', NULL, 'FIQU TREGAR MUZZARELLA BARRA X KG', b'0', NULL),
	(15, '2440', b'0', NULL, 'FIQU TREGAR PORT SALUT X KG', b'0', NULL),
	(16, '2441', b'0', NULL, 'FIQU TREGAR PORT SALUT LIGHT X KG', b'0', NULL),
	(17, '2912', b'0', NULL, 'FIAM RECREO FIAMB COC PATA CERDO(405)', b'0', NULL),
	(18, '2914', b'0', NULL, 'FIAM RECREO MORTADELA BOLG VEJ X KG', b'0', NULL),
	(19, '2925', b'0', NULL, 'FIAM RECREO JAMON CRUDO X KG', b'0', NULL),
	(20, '8974', b'0', NULL, 'FIAM CAGNOLI BONDIOLA', b'0', NULL),
	(21, '9778', b'0', NULL, 'FIQU RICREM DANBO X KG', b'0', NULL),
	(22, '1806', b'0', NULL, 'FIAM CAGNOLI SALAMIN P/G x KG', b'0', NULL),
	(23, '1816', b'0', NULL, 'FIAM PALADINI PALETA COC X KG', b'0', NULL),
	(24, '1218', b'0', NULL, 'FIQU PAULINA MUZZARELLA  P/FETEAR X KG', b'0', NULL),
	(25, '5915', b'0', NULL, 'FIAM CAGNOLI CHORIZO ESPANIOL X KG', b'0', NULL),
	(26, '6011', b'0', NULL, 'FIAM LARIO SALAME BAST FINO', b'0', NULL),
	(27, '6055', b'0', NULL, 'FIAM 66 MILAN', b'0', NULL),
	(28, '6152', b'0', NULL, 'FIAM RECREO MILAN X KG', b'0', NULL),
	(29, '6253', b'0', NULL, 'FIAM PALADINI SALCH PRIMAV', b'0', NULL),
	(30, '4116', b'0', NULL, 'FIAM CAGNOLI MILAN X KG', b'0', NULL),
	(31, '4318', b'0', NULL, 'FIQU TREGAR AZUL HORMA x KG', b'0', NULL),
	(32, '4787', b'0', NULL, 'FIAM CAGNOLI PALETA CERDO X KG', b'0', NULL),
	(33, '7700', b'0', NULL, 'FIAM CAGNOLI JAM COCIDO C.LENTA 5.5X', b'0', NULL),
	(34, '7718', b'0', NULL, 'FIAM PICADITAS X KG', b'0', NULL),
	(35, '8016', b'0', NULL, 'FIAM RECREO BONDIOLA X KG', b'0', NULL),
	(36, '8085', b'0', NULL, 'FIAM PALADINI JAM COCIDO BAJO SODIO X KG.', b'0', NULL),
	(37, '3483', b'0', NULL, 'FIAM LARIO LOMO COC. NAT xKG', b'0', NULL),
	(38, '3755', b'1', 0.20, 'FIAM CAGNOLI JAM COCIDO. X KG', b'1', 1),
	(39, '3781', b'0', NULL, 'FIAM RECREO JAM COCIDO X KG', b'0', NULL),
	(40, '3817', b'0', NULL, 'FIAM RECREO SALCHICHON PRIMAVERA X KG', b'0', NULL),
	(41, '2073', b'0', NULL, 'FIQU PAULINA GOUDA X KG', b'0', NULL),
	(42, '2187', b'0', NULL, 'FIAM LARIO SALCHICHON PRIMAV', b'0', NULL),
	(43, '2190', b'0', NULL, 'FIQU PAULINA PATEGRAS X KG', b'0', NULL),
	(44, '2250', b'0', NULL, 'FIAM PALADINI MORTADELA A/V', b'0', NULL),
	(45, '2254', b'0', NULL, 'FIAM PALADINI JAM COCIDO', b'0', NULL),
	(46, '2264', b'0', NULL, 'FIAM PALADINI MILAN', b'0', NULL),
	(47, '2266', b'0', NULL, 'FIAM PALADINI SALAMIN T/C', b'0', NULL),
	(48, '6442', b'0', NULL, 'FIQU PAULINA AZUL X KG', b'0', NULL),
	(49, '6572', b'1', 0.19, 'FIQU PAULINA CHEDDAR X KG', b'1', 1),
	(50, '4898', b'0', NULL, 'FIAM CAGNOLI SALAME BAST P/F  X KG', b'0', NULL),
	(51, '4929', b'0', NULL, 'FIQU PAULINA PORT SALUT X KG', b'0', NULL),
	(52, '4998', b'0', NULL, 'FIAM CAGNOLI SALAME BAST P/G X KG', b'0', NULL),
	(53, '5048', b'0', NULL, 'FIAM LARIO MORTADELA BOLOGNA', b'0', NULL),
	(54, '5052', b'0', NULL, 'FIAM LARIO JAM COCIDO X KG (119)', b'0', NULL),
	(55, '5072', b'0', NULL, 'FIAM LARIO MILAN FINO', b'0', NULL),
	(56, '5075', b'0', NULL, 'FIAM LARIO SALAMIN TAND P/F', b'0', NULL),
	(57, '5076', b'0', NULL, 'FIAM LARIO SALAMIN TAND P/G', b'0', NULL),
	(58, '5409', b'0', NULL, 'FIQU PAULINA REGGIANITO X KG', b'0', NULL),
	(59, '5446', b'0', NULL, 'FIAM CAGNOLI MORTADELA x KG', b'0', NULL),
	(60, '6598', b'0', NULL, 'FIAM CAGNOLI PANCETA AHUM X KG', b'0', NULL),
	(61, '8663', b'0', NULL, 'FIQU PAULINA TYBO X KG', b'0', NULL),
	(62, '7105', b'0', NULL, 'FIQU PAULINA SARDO X KG', b'0', NULL),
	(63, '1541', b'0', NULL, 'FIAM CAGNOLI SALAMIN P/F x KG', b'0', NULL),
	(64, '1611', b'0', NULL, 'FIAM LARIO BONDIOLA (122)', b'0', NULL),
	(65, '1617', b'0', NULL, 'FIAM RAFAELA JAM COCIDO  NAT X KG', b'0', NULL),
	(66, '1922', b'0', NULL, 'FIQU CREMON CREMOSO SERENISIMA X KG', b'0', NULL),
	(67, '667225', b'0', NULL, 'INSU BOLSA VACIO 14X24X70', b'0', NULL),
	(68, '663717', b'0', NULL, 'INSU BOLS VACIO CERVENY 15X25X70 FIAM 1X', b'0', NULL),
	(102, '2255', b'0', NULL, 'FIAM PALADINI JAMON CRUDO', b'0', NULL),
	(103, '8654', b'0', NULL, 'FIQU SERENISIMA DANBO X KG', b'0', NULL),
	(152, '3756', b'0', 0.20, 'FRAC PAULINA PAT. P/ SAND x KG', b'0', 1),
	(202, '3740', b'0', 0.20, 'FRAC CAGNOLI JAM COCIDO. XKG', b'0', 1);

-- Volcando datos para la tabla cdf_bbdd.productos_seq: ~1 rows (aproximadamente)
REPLACE INTO `productos_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(301, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.proveedor: ~1 rows (aproximadamente)
REPLACE INTO `proveedor` (`id`, `direccion`, `nombre`, `telefono`) VALUES
	(1, '-', 'Jotabe', '-'),
	(2, '-', 'Recreo', '-'),
	(52, '-', 'Tregar', '-'),
	(53, '-', 'Lario', '-'),
	(54, '-', 'Mastellone', '-'),
	(55, '-', 'Paladini', '-');

-- Volcando datos para la tabla cdf_bbdd.proveedor_seq: ~1 rows (aproximadamente)
REPLACE INTO `proveedor_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(151, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.roles: ~3 rows (aproximadamente)
REPLACE INTO `roles` (`id`, `nombre`) VALUES
	(1, 'ADMIN'),
	(2, 'REFERENTE'),
	(3, 'COLABORADOR');

-- Volcando datos para la tabla cdf_bbdd.sucursales: ~2 rows (aproximadamente)
REPLACE INTO `sucursales` (`id`, `direccion`, `nombre`, `numero`, `telefono`, `ubicacion_id`) VALUES
	(2, 'Italia 1137', 'Sucursal Italia', 3, '-', 2),
	(3, 'Sarmiento 999', 'Sucursal Sarmiento', 20, '-', 52),
	(4, 'Laprida 4999', 'Sucursal Laprida', 9, '-', 104),
	(5, 'Ameguino 601', 'Sucursal Ameghino', 16, '-', 105),
	(6, 'Roca 232', 'Sucursal Roca', 22, '', 103),
	(7, 'Cordoba 575', 'Sucursal Cordoba', 12, '-', 102);

-- Volcando datos para la tabla cdf_bbdd.ubicacion: ~3 rows (aproximadamente)
REPLACE INTO `ubicacion` (`id`, `descripcion`, `nombre`, `numero`) VALUES
	(1, 'CD Chaco', 'CD Italia', 1),
	(2, 'Dep. Suc Italia', '03', 3),
	(52, 'Deposti sucursal sarmiento', '20', 20),
	(102, 'Deposito Cordoba', '12', 12),
	(103, 'Deposito Roca', '22', 22),
	(104, 'Deposito Laprida', '09', 9),
	(105, 'Deposito Ameghino', '16', 16);

-- Volcando datos para la tabla cdf_bbdd.ubicacion_seq: ~1 rows (aproximadamente)
REPLACE INTO `ubicacion_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(201, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.usuarios: ~2 rows (aproximadamente)
REPLACE INTO `usuarios` (`id`, `password`, `username`, `rol_id`) VALUES
	(2, '$2a$10$HO3i8kGTw6csg6yJYIFI9O0mfzoB6Im5hc0UFIwtDVzbiVfrrNmFC', 'edgar', 1),
	(3, '$2a$10$x76sZmV2wqlT.GHOlrIJj.vjU9WFs1T6bS3qCto20WlZlblEsjpfG', 'juan', 3),
	(4, '$2a$10$i5TMX2JPVrykdmYSCjFHoeohgMtM1tL.sZmK6U8n4sqr1Jcqaxuoy', 'ulises', 3),
	(5, '$2a$10$t5WwO85yHRQ4A5QYivaiAeU0xrcKb2/e/1LL4XA8oYPClDT4HgEyK', 'mauri', 3),
	(6, '$2a$10$B9EAb0n27S/iSQPy76Fp2.8UZ1E91rZGPwQjsYUALNiDJRlqRMjjS', 'braian', 3),
	(7, '$2a$10$3Wrub77kI0ScVMg0Pu5cHOcr6ldkDfXLs4yUHAbl09jVb5Sn9bF/W', 'tregar', 3),
	(8, '$2a$10$v2S6DuFouoGc0V0DBstBcustCYeaOmf8P.8pY/5kqTsP6ufGiXz1K', 'jotabe', 3),
	(9, '$2a$10$bh51gAS7JZFgSANqLpfPnuwp0/MWM8TAejGn.Spi9DESHXV24g64q', 'paladini', 3);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
