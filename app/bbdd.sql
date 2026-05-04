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

-- Volcando datos para la tabla cdf_bbdd.existencias: ~66 rows (aproximadamente)
REPLACE INTO `existencias` (`id`, `estado`, `kilos`, `ubicacion`, `ultima_actualizacion`, `unidades`, `producto_id`, `ubicacion_id`) VALUES
	(1, 'KILOS', 4.980, NULL, '2026-05-04 09:47:26.219259', 0, 4, 1),
	(2, 'KILOS', 173.925, NULL, '2026-05-04 09:47:26.234927', 0, 5, 1),
	(3, 'KILOS', 3.206, NULL, '2026-05-04 09:47:26.240607', 0, 6, 1),
	(4, 'KILOS', 17.410, NULL, '2026-05-04 09:47:26.246217', 0, 7, 1),
	(5, 'KILOS', 123.530, NULL, '2026-05-04 09:47:26.253281', 0, 8, 1),
	(6, 'KILOS', 16.350, NULL, '2026-05-04 09:47:26.259116', 0, 9, 1),
	(7, 'KILOS', 8.905, NULL, '2026-05-04 09:47:26.263847', 0, 10, 1),
	(8, 'KILOS', 9.420, NULL, '2026-05-04 09:47:26.270922', 0, 11, 1),
	(9, 'KILOS', 16.460, NULL, '2026-05-04 09:47:26.277287', 0, 12, 1),
	(10, 'KILOS', 190.207, NULL, '2026-05-04 09:47:26.283169', 0, 13, 1),
	(11, 'KILOS', 0.090, NULL, '2026-05-04 09:47:26.290580', 0, 14, 1),
	(12, 'KILOS', 31.850, NULL, '2026-05-04 09:47:26.296143', 0, 15, 1),
	(13, 'KILOS', 30.270, NULL, '2026-05-04 09:47:26.301443', 0, 16, 1),
	(14, 'KILOS', 48.765, NULL, '2026-05-04 09:47:26.307592', 0, 17, 1),
	(15, 'KILOS', 25.750, NULL, '2026-05-04 09:47:26.312185', 0, 18, 1),
	(16, 'KILOS', 6.145, NULL, '2026-05-04 09:47:26.318072', 0, 19, 1),
	(17, 'KILOS', 7.215, NULL, '2026-05-04 09:47:26.323101', 0, 20, 1),
	(18, 'KILOS', 0.010, NULL, '2026-05-04 09:47:26.328386', 0, 21, 1),
	(19, 'KILOS', 0.150, NULL, '2026-05-04 09:47:26.337719', 0, 22, 1),
	(20, 'KILOS', 0.005, NULL, '2026-05-04 09:47:26.343837', 0, 23, 1),
	(21, 'KILOS', 50.735, NULL, '2026-05-04 09:47:26.351370', 0, 24, 1),
	(22, 'KILOS', 0.100, NULL, '2026-05-04 09:47:26.357874', 0, 25, 1),
	(23, 'KILOS', 0.200, NULL, '2026-05-04 09:47:26.362905', 0, 26, 1),
	(24, 'KILOS', 33.845, NULL, '2026-05-04 09:47:26.369384', 0, 27, 1),
	(25, 'KILOS', 12.065, NULL, '2026-05-04 09:47:26.374583', 0, 28, 1),
	(26, 'KILOS', 0.225, NULL, '2026-05-04 09:47:26.380247', 0, 29, 1),
	(27, 'KILOS', 36.070, NULL, '2026-05-04 09:47:26.384784', 0, 30, 1),
	(28, 'KILOS', 20.090, NULL, '2026-05-04 09:47:26.389616', 0, 31, 1),
	(29, 'KILOS', 110.870, NULL, '2026-05-04 09:47:26.394638', 0, 32, 1),
	(30, 'KILOS', 2.225, NULL, '2026-05-04 09:47:26.400227', 0, 33, 1),
	(31, 'KILOS', 6.045, NULL, '2026-05-04 09:47:26.405261', 0, 34, 1),
	(32, 'KILOS', 155.905, NULL, '2026-05-04 09:47:26.411610', 0, 1, 1),
	(33, 'KILOS', 12.875, NULL, '2026-05-04 09:47:26.416650', 0, 35, 1),
	(34, 'KILOS', 8.910, NULL, '2026-05-04 09:47:26.421506', 0, 36, 1),
	(35, 'KILOS', 3.045, NULL, '2026-05-04 09:47:26.426475', 0, 37, 1),
	(36, 'KILOS', 200.285, NULL, '2026-05-04 09:47:26.430523', 0, 38, 1),
	(37, 'KILOS', 158.286, NULL, '2026-05-04 09:47:26.435863', 0, 39, 1),
	(38, 'KILOS', 23.495, NULL, '2026-05-04 09:47:26.439455', 0, 40, 1),
	(39, 'KILOS', 5.110, NULL, '2026-05-04 09:47:26.444112', 0, 41, 1),
	(40, 'KILOS', 0.010, NULL, '2026-05-04 09:47:26.449532', 0, 42, 1),
	(41, 'KILOS', 29.585, NULL, '2026-05-04 09:47:26.454402', 0, 43, 1),
	(42, 'KILOS', 2.875, NULL, '2026-05-04 09:47:26.458441', 0, 44, 1),
	(43, 'KILOS', 10.620, NULL, '2026-05-04 09:47:26.464633', 0, 45, 1),
	(44, 'KILOS', 0.435, NULL, '2026-05-04 09:47:26.471557', 0, 46, 1),
	(45, 'KILOS', 0.740, NULL, '2026-05-04 09:47:26.478986', 0, 47, 1),
	(46, 'KILOS', 2.400, NULL, '2026-05-04 09:47:26.485856', 0, 48, 1),
	(47, 'KILOS', 23.635, NULL, '2026-05-04 09:47:26.490256', 0, 49, 1),
	(48, 'KILOS', 3.075, NULL, '2026-05-04 09:47:26.499333', 0, 50, 1),
	(49, 'KILOS', 17.290, NULL, '2026-05-04 09:47:26.505783', 0, 51, 1),
	(50, 'KILOS', 3.065, NULL, '2026-05-04 09:47:26.512845', 0, 52, 1),
	(51, 'KILOS', 28.762, NULL, '2026-05-04 09:47:26.518468', 0, 53, 1),
	(52, 'KILOS', 15.990, NULL, '2026-05-04 09:47:26.524547', 0, 54, 1),
	(53, 'KILOS', 10.770, NULL, '2026-05-04 09:47:26.530074', 0, 55, 1),
	(54, 'KILOS', 8.364, NULL, '2026-05-04 09:47:26.535817', 0, 56, 1),
	(55, 'KILOS', 9.574, NULL, '2026-05-04 09:47:26.541913', 0, 57, 1),
	(56, 'KILOS', 1.985, NULL, '2026-05-04 09:47:26.547678', 0, 58, 1),
	(57, 'KILOS', 14.480, NULL, '2026-05-04 09:47:26.553557', 0, 59, 1),
	(58, 'KILOS', 0.260, NULL, '2026-05-04 09:47:26.558919', 0, 60, 1),
	(59, 'KILOS', 15.360, NULL, '2026-05-04 09:47:26.569470', 0, 61, 1),
	(60, 'KILOS', 13.135, NULL, '2026-05-04 09:47:26.576160', 0, 62, 1),
	(61, 'KILOS', 0.705, NULL, '2026-05-04 09:47:26.583037', 0, 63, 1),
	(62, 'KILOS', 1.339, NULL, '2026-05-04 09:47:26.591896', 0, 64, 1),
	(63, 'KILOS', 12.820, NULL, '2026-05-04 09:47:26.611486', 0, 65, 1),
	(64, 'KILOS', 294.695, NULL, '2026-05-04 09:47:26.618033', 0, 66, 1),
	(65, 'KILOS', 2000.000, NULL, '2026-05-04 09:47:26.623558', 0, 67, 1),
	(66, 'KILOS', 2500.000, NULL, '2026-05-04 09:47:26.628499', 0, 68, 1);

-- Volcando datos para la tabla cdf_bbdd.movimientos: ~0 rows (aproximadamente)

-- Volcando datos para la tabla cdf_bbdd.pedido_productos: ~6 rows (aproximadamente)
REPLACE INTO `pedido_productos` (`id`, `cantidad`, `tipo`, `pedido_id`, `producto_id`) VALUES
	(2, 57, 'FETEADO', 2, 8),
	(3, 10, 'FETEADO', 3, 8),
	(4, 5, 'PIEZA', 3, 8),
	(5, 60, 'FETEADO', 3, 1),
	(6, 50, 'FETEADO', 3, 38),
	(7, 2, 'PIEZA', 3, 38);

-- Volcando datos para la tabla cdf_bbdd.pedidos: ~2 rows (aproximadamente)
REPLACE INTO `pedidos` (`id`, `fecha`, `sucursal_id`, `estado`) VALUES
	(2, '2026-05-03 21:00:00.000000', 1, 'NUEVO'),
	(3, '2026-05-03 21:00:00.000000', 1, 'NUEVO');

-- Volcando datos para la tabla cdf_bbdd.pedidos_productos: ~0 rows (aproximadamente)

-- Volcando datos para la tabla cdf_bbdd.pedidos_productos_seq: ~1 rows (aproximadamente)
REPLACE INTO `pedidos_productos_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(1, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.procesos: ~0 rows (aproximadamente)

-- Volcando datos para la tabla cdf_bbdd.productos: ~66 rows (aproximadamente)
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
	(68, '663717', b'0', NULL, 'INSU BOLS VACIO CERVENY 15X25X70 FIAM 1X', b'0', NULL);

-- Volcando datos para la tabla cdf_bbdd.productos_seq: ~1 rows (aproximadamente)
REPLACE INTO `productos_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(151, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.proveedor: ~1 rows (aproximadamente)
REPLACE INTO `proveedor` (`id`, `direccion`, `nombre`, `telefono`) VALUES
	(1, '-', 'Jotabe', '-');

-- Volcando datos para la tabla cdf_bbdd.proveedor_seq: ~1 rows (aproximadamente)
REPLACE INTO `proveedor_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(51, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.roles: ~3 rows (aproximadamente)
REPLACE INTO `roles` (`id`, `nombre`) VALUES
	(1, 'ADMIN'),
	(2, 'REFERENTE'),
	(3, 'COLABORADOR');

-- Volcando datos para la tabla cdf_bbdd.sucursales: ~1 rows (aproximadamente)
REPLACE INTO `sucursales` (`id`, `direccion`, `nombre`, `numero`, `telefono`, `ubicacion_id`) VALUES
	(1, 'Italia 1137', 'Italia', 3, '-', 2);

-- Volcando datos para la tabla cdf_bbdd.ubicacion: ~2 rows (aproximadamente)
REPLACE INTO `ubicacion` (`id`, `descripcion`, `nombre`, `numero`) VALUES
	(1, 'CD Chaco', 'CD Italia', 1),
	(2, 'Dep. Suc Italia', 'Deposito Italia', 3);

-- Volcando datos para la tabla cdf_bbdd.ubicacion_seq: ~1 rows (aproximadamente)
REPLACE INTO `ubicacion_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(101, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_bbdd.usuarios: ~2 rows (aproximadamente)
REPLACE INTO `usuarios` (`id`, `password`, `username`, `rol_id`) VALUES
	(2, '$2a$10$HO3i8kGTw6csg6yJYIFI9O0mfzoB6Im5hc0UFIwtDVzbiVfrrNmFC', 'edgar', 1),
	(3, '$2a$10$x76sZmV2wqlT.GHOlrIJj.vjU9WFs1T6bS3qCto20WlZlblEsjpfG', 'juan', 3);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
