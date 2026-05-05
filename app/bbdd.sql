-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:        11.8.6-MariaDB-0+deb13u1 from Debian - -- Please help get to 10k stars at https://github.com/MariaDB/Server
-- SO del servidor:              debian-linux-gnu
-- HeidiSQL Versión:            12.17.1.1
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Volcando datos para la tabla cdf_app.existencias: ~80 rows (aproximadamente)
REPLACE INTO `existencias` (`kilos`, `unidades`, `id`, `producto_id`, `ultima_actualizacion`, `estado`, `ubicacion_id`, `ubicacion`) VALUES
	(4.980, 0, 1, 4, '2026-05-04 09:47:26.219259', 'KILOS', 1, NULL),
	(173.925, 0, 2, 5, '2026-05-04 09:47:26.234927', 'KILOS', 1, NULL),
	(3.206, 0, 3, 6, '2026-05-04 09:47:26.240607', 'KILOS', 1, NULL),
	(17.410, 0, 4, 7, '2026-05-04 09:47:26.246217', 'KILOS', 1, NULL),
	(123.530, 0, 5, 8, '2026-05-04 09:47:26.253281', 'KILOS', 1, NULL),
	(16.350, 0, 6, 9, '2026-05-04 09:47:26.259116', 'KILOS', 1, NULL),
	(8.905, 0, 7, 10, '2026-05-04 09:47:26.263847', 'KILOS', 1, NULL),
	(9.420, 0, 8, 11, '2026-05-04 09:47:26.270922', 'KILOS', 1, NULL),
	(16.460, 0, 9, 12, '2026-05-04 09:47:26.277287', 'KILOS', 1, NULL),
	(190.207, 0, 10, 13, '2026-05-04 09:47:26.283169', 'KILOS', 1, NULL),
	(0.090, 0, 11, 14, '2026-05-04 09:47:26.290580', 'KILOS', 1, NULL),
	(31.850, 0, 12, 15, '2026-05-04 09:47:26.296143', 'KILOS', 1, NULL),
	(30.270, 0, 13, 16, '2026-05-04 09:47:26.301443', 'KILOS', 1, NULL),
	(48.765, 0, 14, 17, '2026-05-04 09:47:26.307592', 'KILOS', 1, NULL),
	(25.750, 0, 15, 18, '2026-05-04 09:47:26.312185', 'KILOS', 1, NULL),
	(6.145, 0, 16, 19, '2026-05-04 09:47:26.318072', 'KILOS', 1, NULL),
	(7.215, 0, 17, 20, '2026-05-04 09:47:26.323101', 'KILOS', 1, NULL),
	(0.010, 0, 18, 21, '2026-05-04 09:47:26.328386', 'KILOS', 1, NULL),
	(0.150, 0, 19, 22, '2026-05-04 09:47:26.337719', 'KILOS', 1, NULL),
	(0.005, 0, 20, 23, '2026-05-04 09:47:26.343837', 'KILOS', 1, NULL),
	(47.485, 0, 21, 24, '2026-05-04 20:30:08.625891', 'KILOS', 1, NULL),
	(0.100, 0, 22, 25, '2026-05-04 09:47:26.357874', 'KILOS', 1, NULL),
	(0.200, 0, 23, 26, '2026-05-04 09:47:26.362905', 'KILOS', 1, NULL),
	(33.845, 0, 24, 27, '2026-05-04 09:47:26.369384', 'KILOS', 1, NULL),
	(12.065, 0, 25, 28, '2026-05-04 09:47:26.374583', 'KILOS', 1, NULL),
	(0.225, 0, 26, 29, '2026-05-04 09:47:26.380247', 'KILOS', 1, NULL),
	(36.070, 0, 27, 30, '2026-05-04 09:47:26.384784', 'KILOS', 1, NULL),
	(20.090, 0, 28, 31, '2026-05-04 09:47:26.389616', 'KILOS', 1, NULL),
	(110.870, 0, 29, 32, '2026-05-04 09:47:26.394638', 'KILOS', 1, NULL),
	(2.225, 0, 30, 33, '2026-05-04 09:47:26.400227', 'KILOS', 1, NULL),
	(6.045, 0, 31, 34, '2026-05-04 09:47:26.405261', 'KILOS', 1, NULL),
	(142.740, 0, 32, 1, '2026-05-04 21:33:24.662692', 'KILOS', 1, NULL),
	(12.875, 0, 33, 35, '2026-05-04 09:47:26.416650', 'KILOS', 1, NULL),
	(8.910, 0, 34, 36, '2026-05-04 09:47:26.421506', 'KILOS', 1, NULL),
	(3.045, 0, 35, 37, '2026-05-04 09:47:26.426475', 'KILOS', 1, NULL),
	(196.960, 0, 36, 38, '2026-05-04 23:20:43.790044', 'KILOS', 1, NULL),
	(158.286, 0, 37, 39, '2026-05-04 09:47:26.435863', 'KILOS', 1, NULL),
	(23.495, 0, 38, 40, '2026-05-04 09:47:26.439455', 'KILOS', 1, NULL),
	(5.110, 0, 39, 41, '2026-05-04 09:47:26.444112', 'KILOS', 1, NULL),
	(0.010, 0, 40, 42, '2026-05-04 09:47:26.449532', 'KILOS', 1, NULL),
	(29.585, 0, 41, 43, '2026-05-04 09:47:26.454402', 'KILOS', 1, NULL),
	(2.875, 0, 42, 44, '2026-05-04 09:47:26.458441', 'KILOS', 1, NULL),
	(10.620, 0, 43, 45, '2026-05-04 09:47:26.464633', 'KILOS', 1, NULL),
	(0.435, 0, 44, 46, '2026-05-04 09:47:26.471557', 'KILOS', 1, NULL),
	(0.740, 0, 45, 47, '2026-05-04 09:47:26.478986', 'KILOS', 1, NULL),
	(2.400, 0, 46, 48, '2026-05-04 09:47:26.485856', 'KILOS', 1, NULL),
	(23.635, 0, 47, 49, '2026-05-04 09:47:26.490256', 'KILOS', 1, NULL),
	(3.075, 0, 48, 50, '2026-05-04 09:47:26.499333', 'KILOS', 1, NULL),
	(17.290, 0, 49, 51, '2026-05-04 09:47:26.505783', 'KILOS', 1, NULL),
	(3.065, 0, 50, 52, '2026-05-04 09:47:26.512845', 'KILOS', 1, NULL),
	(28.762, 0, 51, 53, '2026-05-04 09:47:26.518468', 'KILOS', 1, NULL),
	(15.990, 0, 52, 54, '2026-05-04 09:47:26.524547', 'KILOS', 1, NULL),
	(10.770, 0, 53, 55, '2026-05-04 09:47:26.530074', 'KILOS', 1, NULL),
	(8.364, 0, 54, 56, '2026-05-04 09:47:26.535817', 'KILOS', 1, NULL),
	(9.574, 0, 55, 57, '2026-05-04 09:47:26.541913', 'KILOS', 1, NULL),
	(1.985, 0, 56, 58, '2026-05-04 09:47:26.547678', 'KILOS', 1, NULL),
	(14.480, 0, 57, 59, '2026-05-04 09:47:26.553557', 'KILOS', 1, NULL),
	(0.260, 0, 58, 60, '2026-05-04 09:47:26.558919', 'KILOS', 1, NULL),
	(15.360, 0, 59, 61, '2026-05-04 09:47:26.569470', 'KILOS', 1, NULL),
	(13.135, 0, 60, 62, '2026-05-04 09:47:26.576160', 'KILOS', 1, NULL),
	(0.705, 0, 61, 63, '2026-05-04 09:47:26.583037', 'KILOS', 1, NULL),
	(1.339, 0, 62, 64, '2026-05-04 09:47:26.591896', 'KILOS', 1, NULL),
	(12.820, 0, 63, 65, '2026-05-04 09:47:26.611486', 'KILOS', 1, NULL),
	(294.695, 0, 64, 66, '2026-05-04 09:47:26.618033', 'KILOS', 1, NULL),
	(2000.000, 0, 65, 67, '2026-05-04 09:47:26.623558', 'KILOS', 1, NULL),
	(2500.000, 0, 66, 68, '2026-05-04 09:47:26.628499', 'KILOS', 1, NULL),
	(0.000, -1, 67, 24, '2026-05-04 20:30:08.617666', 'PIEZA', 1, NULL),
	(0.000, 20, 68, 24, '2026-05-04 20:30:08.631436', 'ENVASADO', 1, NULL),
	(0.085, 0, 69, 24, '2026-05-04 20:30:08.634962', 'RECORTE', 1, NULL),
	(0.302, 0, 70, 24, '2026-05-04 20:30:08.639063', 'DECOMISADO', 1, NULL),
	(0.000, -4, 71, 1, '2026-05-04 21:33:24.649390', 'PIEZA', 1, NULL),
	(0.000, 60, 72, 1, '2026-05-04 23:19:48.308261', 'ENVASADO', 1, NULL),
	(1.199, 0, 73, 1, '2026-05-04 21:33:24.670368', 'RECORTE', 1, NULL),
	(1.225, 0, 74, 1, '2026-05-04 21:33:24.673140', 'DECOMISADO', 1, NULL),
	(0.000, 0, 75, 1, '2026-05-04 23:19:48.284557', 'FETEADO', 1, NULL),
	(0.000, -1, 76, 38, '2026-05-04 23:20:43.780554', 'PIEZA', 1, NULL),
	(0.000, 0, 77, 38, '2026-05-04 23:21:21.790013', 'FETEADO', 1, NULL),
	(0.315, 0, 78, 38, '2026-05-04 23:20:43.795877', 'RECORTE', 1, NULL),
	(0.085, 0, 79, 38, '2026-05-04 23:20:43.799941', 'DECOMISADO', 1, NULL),
	(0.000, 18, 80, 38, '2026-05-04 23:21:21.791307', 'ENVASADO', 1, NULL);

-- Volcando datos para la tabla cdf_app.movimientos: ~24 rows (aproximadamente)
REPLACE INTO `movimientos` (`cantidad`, `fecha`, `id`, `proceso_id`, `producto_id`, `motivo`, `estado`) VALUES
	(1.00, '2026-05-04 20:55:00.781777', 11, 3, 1, 'SALIDA', 'PIEZA'),
	(3.25, '2026-05-04 20:55:00.790550', 12, 3, 1, 'SALIDA', 'KILOS'),
	(15.00, '2026-05-04 20:55:00.794302', 13, 3, 1, 'ENTRADA', 'ENVASADO'),
	(0.30, '2026-05-04 20:55:00.797749', 14, 3, 1, 'ENTRADA', 'RECORTE'),
	(0.95, '2026-05-04 20:55:00.801604', 15, 3, 1, 'ENTRADA', 'DECOMISADO'),
	(1.00, '2026-05-04 21:24:21.116122', 16, 4, 1, 'SALIDA', 'PIEZA'),
	(3.10, '2026-05-04 21:24:21.119648', 17, 4, 1, 'SALIDA', 'KILOS'),
	(12.00, '2026-05-04 21:24:21.123526', 18, 4, 1, 'ENTRADA', 'ENVASADO'),
	(0.29, '2026-05-04 21:24:21.127305', 19, 4, 1, 'ENTRADA', 'RECORTE'),
	(0.09, '2026-05-04 21:24:21.130871', 20, 4, 1, 'ENTRADA', 'DECOMISADO'),
	(1.00, '2026-05-04 21:33:24.646922', 21, 5, 1, 'SALIDA', 'PIEZA'),
	(3.12, '2026-05-04 21:33:24.660419', 22, 5, 1, 'SALIDA', 'KILOS'),
	(15.00, '2026-05-04 21:33:24.664916', 23, 5, 1, 'ENTRADA', 'FETEADO'),
	(0.31, '2026-05-04 21:33:24.668385', 24, 5, 1, 'ENTRADA', 'RECORTE'),
	(0.11, '2026-05-04 21:33:24.671922', 25, 5, 1, 'ENTRADA', 'DECOMISADO'),
	(15.00, '2026-05-04 23:19:48.281910', 26, 6, 1, 'SALIDA', 'FETEADO'),
	(15.00, '2026-05-04 23:19:48.306764', 27, 6, 1, 'ENTRADA', 'ENVASADO'),
	(1.00, '2026-05-04 23:20:43.782728', 28, 7, 38, 'SALIDA', 'PIEZA'),
	(3.33, '2026-05-04 23:20:43.787703', 29, 7, 38, 'SALIDA', 'KILOS'),
	(18.00, '2026-05-04 23:20:43.792306', 30, 7, 38, 'ENTRADA', 'FETEADO'),
	(0.32, '2026-05-04 23:20:43.797056', 31, 7, 38, 'ENTRADA', 'RECORTE'),
	(0.09, '2026-05-04 23:20:43.800746', 32, 7, 38, 'ENTRADA', 'DECOMISADO'),
	(18.00, '2026-05-04 23:21:21.788108', 33, 8, 38, 'SALIDA', 'FETEADO'),
	(18.00, '2026-05-04 23:21:21.792012', 34, 8, 38, 'ENTRADA', 'ENVASADO');

-- Volcando datos para la tabla cdf_app.pedido_final_items: ~5 rows (aproximadamente)
REPLACE INTO `pedido_final_items` (`id`, `cantidad`, `estado`, `peso_real`, `pedido_final_id`, `producto_id`) VALUES
	(2, 98, 'FETEADO', 7.215, 1, 1),
	(3, 60, 'FETEADO', 6.520, 2, 38),
	(4, 40, 'FETEADO', 4.220, 2, 5),
	(5, 10, 'FETEADO', 1.850, 2, 24),
	(6, 23, 'FETEADO', 7.355, 2, 66);

-- Volcando datos para la tabla cdf_app.pedido_productos: ~1 rows (aproximadamente)
REPLACE INTO `pedido_productos` (`id`, `cantidad`, `tipo`, `pedido_id`, `producto_id`) VALUES
	(8, 100, 'FETEADO', 4, 1),
	(9, 80, 'FETEADO', 5, 38),
	(10, 20, 'FETEADO', 5, 24),
	(11, 40, 'FETEADO', 5, 5),
	(12, 23, 'FETEADO', 5, 66);

-- Volcando datos para la tabla cdf_app.pedidos: ~2 rows (aproximadamente)
REPLACE INTO `pedidos` (`id`, `fecha`, `sucursal_id`, `estado`) VALUES
	(4, '2026-05-03 21:00:00.000000', 3, 'NUEVO'),
	(5, '2026-05-04 21:00:00.000000', 2, 'PREPARANDO');

-- Volcando datos para la tabla cdf_app.pedidos_finales: ~0 rows (aproximadamente)
REPLACE INTO `pedidos_finales` (`id`, `fecha_creacion`, `pedido_original_id`) VALUES
	(1, '2026-05-05 00:02:22.046341', 4),
	(2, '2026-05-05 00:18:33.316375', 5);

-- Volcando datos para la tabla cdf_app.pedidos_productos: ~0 rows (aproximadamente)

-- Volcando datos para la tabla cdf_app.pedidos_productos_seq: ~1 rows (aproximadamente)
REPLACE INTO `pedidos_productos_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(1, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_app.procesos: ~6 rows (aproximadamente)
REPLACE INTO `procesos` (`fecha`, `id`, `usuario_id`, `tipo`) VALUES
	('2026-05-04 20:55:00.752270', 3, 3, 'FRACCIONADO'),
	('2026-05-04 21:24:21.112014', 4, 3, 'FRACCIONADO'),
	('2026-05-04 21:33:24.623057', 5, 3, 'FRACCIONADO'),
	('2026-05-04 23:19:48.256176', 6, 3, 'ENVASADO'),
	('2026-05-04 23:20:43.776459', 7, 3, 'FRACCIONADO'),
	('2026-05-04 23:21:21.785170', 8, 3, 'ENVASADO');

-- Volcando datos para la tabla cdf_app.productos: ~66 rows (aproximadamente)
REPLACE INTO `productos` (`feteable`, `kilos_por_bolsita`, `picable`, `id`, `proveedor_id`, `codigo`, `nombre`) VALUES
	(b'1', 0.22, b'1', 1, NULL, '8010', 'PAULINA PATEGRAS P/SANDWICH'),
	(b'0', NULL, b'0', 4, NULL, '2374', 'FIAM LARIO SALAME BAST GRUESO'),
	(b'0', 0.35, b'0', 5, 1, '2379', 'FIQU PAULINA CREMOSO X KG'),
	(b'0', NULL, b'0', 6, NULL, '2381', 'FIAM LARIO JAMON CRUDO'),
	(b'0', NULL, b'0', 7, NULL, '2420', 'FIQU TREGAR DANBO X KG.'),
	(b'0', NULL, b'0', 8, NULL, '2422', 'FIQU TREGAR CREMOSO X KG'),
	(b'0', NULL, b'0', 9, NULL, '2424', 'FIQU TREGAR CRIOLLO X KG'),
	(b'0', NULL, b'0', 10, NULL, '2427', 'FIQU TREGAR FONTINA X KG'),
	(b'0', NULL, b'0', 11, NULL, '2431', 'FIQU TREGAR PATEGRAS X KG'),
	(b'0', NULL, b'0', 12, NULL, '2434', 'FIQU TREGAR HOLANDA X KG'),
	(b'0', NULL, b'0', 13, NULL, '2435', 'FIQU PAULINA DANBO X KG'),
	(b'0', NULL, b'0', 14, NULL, '2438', 'FIQU TREGAR MUZZARELLA BARRA X KG'),
	(b'0', NULL, b'0', 15, NULL, '2440', 'FIQU TREGAR PORT SALUT X KG'),
	(b'0', NULL, b'0', 16, NULL, '2441', 'FIQU TREGAR PORT SALUT LIGHT X KG'),
	(b'0', NULL, b'0', 17, NULL, '2912', 'FIAM RECREO FIAMB COC PATA CERDO(405)'),
	(b'0', NULL, b'0', 18, NULL, '2914', 'FIAM RECREO MORTADELA BOLG VEJ X KG'),
	(b'0', NULL, b'0', 19, NULL, '2925', 'FIAM RECREO JAMON CRUDO X KG'),
	(b'0', NULL, b'0', 20, NULL, '8974', 'FIAM CAGNOLI BONDIOLA'),
	(b'0', NULL, b'0', 21, NULL, '9778', 'FIQU RICREM DANBO X KG'),
	(b'0', NULL, b'0', 22, NULL, '1806', 'FIAM CAGNOLI SALAMIN P/G x KG'),
	(b'0', NULL, b'0', 23, NULL, '1816', 'FIAM PALADINI PALETA COC X KG'),
	(b'0', NULL, b'0', 24, NULL, '1218', 'FIQU PAULINA MUZZARELLA  P/FETEAR X KG'),
	(b'0', NULL, b'0', 25, NULL, '5915', 'FIAM CAGNOLI CHORIZO ESPANIOL X KG'),
	(b'0', NULL, b'0', 26, NULL, '6011', 'FIAM LARIO SALAME BAST FINO'),
	(b'0', NULL, b'0', 27, NULL, '6055', 'FIAM 66 MILAN'),
	(b'0', NULL, b'0', 28, NULL, '6152', 'FIAM RECREO MILAN X KG'),
	(b'0', NULL, b'0', 29, NULL, '6253', 'FIAM PALADINI SALCH PRIMAV'),
	(b'0', NULL, b'0', 30, NULL, '4116', 'FIAM CAGNOLI MILAN X KG'),
	(b'0', NULL, b'0', 31, NULL, '4318', 'FIQU TREGAR AZUL HORMA x KG'),
	(b'0', NULL, b'0', 32, NULL, '4787', 'FIAM CAGNOLI PALETA CERDO X KG'),
	(b'0', NULL, b'0', 33, NULL, '7700', 'FIAM CAGNOLI JAM COCIDO C.LENTA 5.5X'),
	(b'0', NULL, b'0', 34, NULL, '7718', 'FIAM PICADITAS X KG'),
	(b'0', NULL, b'0', 35, NULL, '8016', 'FIAM RECREO BONDIOLA X KG'),
	(b'0', NULL, b'0', 36, NULL, '8085', 'FIAM PALADINI JAM COCIDO BAJO SODIO X KG.'),
	(b'0', NULL, b'0', 37, NULL, '3483', 'FIAM LARIO LOMO COC. NAT xKG'),
	(b'1', 0.20, b'1', 38, 1, '3755', 'FIAM CAGNOLI JAM COCIDO. X KG'),
	(b'0', NULL, b'0', 39, NULL, '3781', 'FIAM RECREO JAM COCIDO X KG'),
	(b'0', NULL, b'0', 40, NULL, '3817', 'FIAM RECREO SALCHICHON PRIMAVERA X KG'),
	(b'0', NULL, b'0', 41, NULL, '2073', 'FIQU PAULINA GOUDA X KG'),
	(b'0', NULL, b'0', 42, NULL, '2187', 'FIAM LARIO SALCHICHON PRIMAV'),
	(b'0', NULL, b'0', 43, NULL, '2190', 'FIQU PAULINA PATEGRAS X KG'),
	(b'0', NULL, b'0', 44, NULL, '2250', 'FIAM PALADINI MORTADELA A/V'),
	(b'0', NULL, b'0', 45, NULL, '2254', 'FIAM PALADINI JAM COCIDO'),
	(b'0', NULL, b'0', 46, NULL, '2264', 'FIAM PALADINI MILAN'),
	(b'0', NULL, b'0', 47, NULL, '2266', 'FIAM PALADINI SALAMIN T/C'),
	(b'0', NULL, b'0', 48, NULL, '6442', 'FIQU PAULINA AZUL X KG'),
	(b'1', 0.19, b'1', 49, 1, '6572', 'FIQU PAULINA CHEDDAR X KG'),
	(b'0', NULL, b'0', 50, NULL, '4898', 'FIAM CAGNOLI SALAME BAST P/F  X KG'),
	(b'0', NULL, b'0', 51, NULL, '4929', 'FIQU PAULINA PORT SALUT X KG'),
	(b'0', NULL, b'0', 52, NULL, '4998', 'FIAM CAGNOLI SALAME BAST P/G X KG'),
	(b'0', NULL, b'0', 53, NULL, '5048', 'FIAM LARIO MORTADELA BOLOGNA'),
	(b'0', NULL, b'0', 54, NULL, '5052', 'FIAM LARIO JAM COCIDO X KG (119)'),
	(b'0', NULL, b'0', 55, NULL, '5072', 'FIAM LARIO MILAN FINO'),
	(b'0', NULL, b'0', 56, NULL, '5075', 'FIAM LARIO SALAMIN TAND P/F'),
	(b'0', NULL, b'0', 57, NULL, '5076', 'FIAM LARIO SALAMIN TAND P/G'),
	(b'0', NULL, b'0', 58, NULL, '5409', 'FIQU PAULINA REGGIANITO X KG'),
	(b'0', NULL, b'0', 59, NULL, '5446', 'FIAM CAGNOLI MORTADELA x KG'),
	(b'0', NULL, b'0', 60, NULL, '6598', 'FIAM CAGNOLI PANCETA AHUM X KG'),
	(b'0', NULL, b'0', 61, NULL, '8663', 'FIQU PAULINA TYBO X KG'),
	(b'0', NULL, b'0', 62, NULL, '7105', 'FIQU PAULINA SARDO X KG'),
	(b'0', NULL, b'0', 63, NULL, '1541', 'FIAM CAGNOLI SALAMIN P/F x KG'),
	(b'0', NULL, b'0', 64, NULL, '1611', 'FIAM LARIO BONDIOLA (122)'),
	(b'0', NULL, b'0', 65, NULL, '1617', 'FIAM RAFAELA JAM COCIDO  NAT X KG'),
	(b'0', NULL, b'0', 66, NULL, '1922', 'FIQU CREMON CREMOSO SERENISIMA X KG'),
	(b'0', NULL, b'0', 67, NULL, '667225', 'INSU BOLSA VACIO 14X24X70'),
	(b'0', NULL, b'0', 68, NULL, '663717', 'INSU BOLS VACIO CERVENY 15X25X70 FIAM 1X');

-- Volcando datos para la tabla cdf_app.productos_seq: ~1 rows (aproximadamente)
REPLACE INTO `productos_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(151, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_app.proveedor: ~1 rows (aproximadamente)
REPLACE INTO `proveedor` (`id`, `direccion`, `nombre`, `telefono`) VALUES
	(1, '-', 'Jotabe', '-');

-- Volcando datos para la tabla cdf_app.proveedor_seq: ~1 rows (aproximadamente)
REPLACE INTO `proveedor_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(51, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_app.roles: ~3 rows (aproximadamente)
REPLACE INTO `roles` (`id`, `nombre`) VALUES
	(1, 'ADMIN'),
	(2, 'REFERENTE'),
	(3, 'COLABORADOR');

-- Volcando datos para la tabla cdf_app.sucursales: ~2 rows (aproximadamente)
REPLACE INTO `sucursales` (`id`, `direccion`, `nombre`, `numero`, `telefono`, `ubicacion_id`) VALUES
	(2, 'Italia 1137', 'Italia', 3, '-', 2),
	(3, 'Sarmiento 999', 'Sarmiento', 20, '-', 52);

-- Volcando datos para la tabla cdf_app.ubicacion: ~3 rows (aproximadamente)
REPLACE INTO `ubicacion` (`numero`, `id`, `descripcion`, `nombre`) VALUES
	(1, 1, 'CD Chaco', 'CD Italia'),
	(3, 2, 'Dep. Suc Italia', 'Deposito Italia'),
	(20, 52, 'Deposti sucursal sarmiento', 'Sarmiento Dep.');

-- Volcando datos para la tabla cdf_app.ubicacion_seq: ~1 rows (aproximadamente)
REPLACE INTO `ubicacion_seq` (`next_not_cached_value`, `minimum_value`, `maximum_value`, `start_value`, `increment`, `cache_size`, `cycle_option`, `cycle_count`) VALUES
	(151, 1, 9223372036854775806, 1, 50, 0, 0, 0);

-- Volcando datos para la tabla cdf_app.usuarios: ~2 rows (aproximadamente)
REPLACE INTO `usuarios` (`id`, `rol_id`, `password`, `username`) VALUES
	(2, 1, '$2a$10$HO3i8kGTw6csg6yJYIFI9O0mfzoB6Im5hc0UFIwtDVzbiVfrrNmFC', 'edgar'),
	(3, 3, '$2a$10$x76sZmV2wqlT.GHOlrIJj.vjU9WFs1T6bS3qCto20WlZlblEsjpfG', 'juan');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
