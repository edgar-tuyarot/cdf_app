-- --------------------------------------------------------
-- Host:                         192.168.10.2
-- Versión del servidor:         Microsoft SQL Server 2016 (RTM) - 13.0.1601.5
-- SO del servidor:              Windows Server 2019 Standard 6.3 <X64> (Build 17763: ) (Hypervisor)
-- HeidiSQL Versión:             12.17.0.7270
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES  */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para master
CREATE DATABASE IF NOT EXISTS "master";
USE "master";

-- Volcando estructura para tabla master.MSreplication_options
CREATE TABLE IF NOT EXISTS "MSreplication_options" 
);

-- Volcando datos para la tabla master.MSreplication_options: 3 rows
DELETE FROM "MSreplication_options";

-- Volcando estructura de base de datos para master
CREATE DATABASE IF NOT EXISTS "master";
USE "master";

-- Volcando estructura para procedimiento master.sp_MScleanupmergepublisher
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento master.sp_MSrepl_startup
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para tabla master.spt_fallback_db
CREATE TABLE IF NOT EXISTS "spt_fallback_db" 
);

-- Volcando datos para la tabla master.spt_fallback_db: 0 rows
DELETE FROM "spt_fallback_db";

-- Volcando estructura para tabla master.spt_fallback_dev
CREATE TABLE IF NOT EXISTS "spt_fallback_dev" 
);

-- Volcando datos para la tabla master.spt_fallback_dev: 0 rows
DELETE FROM "spt_fallback_dev";

-- Volcando estructura para tabla master.spt_fallback_usg
CREATE TABLE IF NOT EXISTS "spt_fallback_usg" 
);

-- Volcando datos para la tabla master.spt_fallback_usg: 0 rows
DELETE FROM "spt_fallback_usg";

-- Volcando estructura para tabla master.spt_monitor
CREATE TABLE IF NOT EXISTS "spt_monitor" 
);

-- Volcando datos para la tabla master.spt_monitor: 1 rows
DELETE FROM "spt_monitor";
-- Volcando estructura para vista master.spt_values
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE "spt_values" 
);

-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS "spt_values";

;


-- Volcando estructura de base de datos para msdb
CREATE DATABASE IF NOT EXISTS "msdb";
USE "msdb";

-- Volcando estructura para función msdb.fn_available_backups
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para función msdb.fn_backup_db_config
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para función msdb.fn_backup_instance_config
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para función msdb.fn_get_current_xevent_settings
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para función msdb.fn_get_health_status
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para función msdb.fn_get_parameter
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para función msdb.fn_is_master_switch_on
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_add_task_command
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_backup_config_advanced
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_backup_config_basic
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_backup_config_schedule
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_backup_master_switch
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_backup_on_demand
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_create_job
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_do_backup
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_get_backup_diagnostics
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_get_encryption_option
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_get_striping_option
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_set_db_backup
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_set_instance_backup
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.sp_set_parameter
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para función msdb.agent_datetime
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para vista msdb.autoadmin_backup_configuration_summary
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE "autoadmin_backup_configuration_summary" 
);

-- Volcando estructura para vista msdb.autoadmin_backup_configurations
-- Creando tabla temporal para superar errores de dependencia de VIEW
CREATE TABLE "autoadmin_backup_configurations" 
);

-- Volcando estructura para procedimiento msdb.autoadmin_fetch_system_flags
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para tabla msdb.autoadmin_managed_databases
CREATE TABLE IF NOT EXISTS "autoadmin_managed_databases" 
);

-- Volcando datos para la tabla msdb.autoadmin_managed_databases: 0 rows
DELETE FROM "autoadmin_managed_databases";

-- Volcando estructura para tabla msdb.autoadmin_master_switch
CREATE TABLE IF NOT EXISTS "autoadmin_master_switch" 
);

-- Volcando datos para la tabla msdb.autoadmin_master_switch: 0 rows
DELETE FROM "autoadmin_master_switch";

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_cleanup
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_delete
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_delete_task_agent_data_for_database
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_delete_task_agent_global_data
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_insert_task_agent_global_data
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_query_dbs
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_query_schema_version
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_query_task_agent_global_data
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_update_task_agent_data_for_database
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_metadata_update_task_agent_global_data
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_restore_headeronly
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_set_master_switch
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para procedimiento msdb.autoadmin_set_system_flag
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para tabla msdb.autoadmin_system_flags
CREATE TABLE IF NOT EXISTS "autoadmin_system_flags" 
);

-- Volcando datos para la tabla msdb.autoadmin_system_flags: 0 rows
DELETE FROM "autoadmin_system_flags";

-- Volcando estructura para tabla msdb.autoadmin_task_agent_metadata
CREATE TABLE IF NOT EXISTS "autoadmin_task_agent_metadata" 
);

-- Volcando datos para la tabla msdb.autoadmin_task_agent_metadata: 1 rows
DELETE FROM "autoadmin_task_agent_metadata";
-- Volcando estructura para tabla msdb.autoadmin_task_agents
CREATE TABLE IF NOT EXISTS "autoadmin_task_agents" 
);

-- Volcando datos para la tabla msdb.autoadmin_task_agents: 1 rows
DELETE FROM "autoadmin_task_agents";
-- Volcando estructura para procedimiento msdb.autoadmin_update_task_agent_path
DELIMITER //
//
DELIMITER ;

-- Volcando estructura para tabla msdb.backupfile
CREATE TABLE IF NOT EXISTS "backupfile" 
);

-- Volcando datos para la tabla msdb.backupfile: 466 rows
DELETE FROM "backupfile";
-- Volcando estructura para tabla msdb.backupfilegroup
CREATE TABLE IF NOT EXISTS "backupfilegroup" 
);

-- Volcando datos para la tabla msdb.backupfilegroup: 233 rows
DELETE FROM "backupfilegroup";
-- Volcando estructura para tabla msdb.backupmediafamily
CREATE TABLE IF NOT EXISTS "backupmediafamily" 
);

-- Volcando datos para la tabla msdb.backupmediafamily: 218 rows
DELETE FROM "backupmediafamily";
-- Volcando estructura para tabla msdb.backupmediaset
CREATE TABLE IF NOT EXISTS "backupmediaset" 
);

-- Volcando datos para la tabla msdb.backupmediaset: 218 rows
DELETE FROM "backupmediaset";
-- Eliminando tabla temporal y crear estructura final de VIEW
DROP TABLE IF EXISTS "autoadmin_backup_configuration_summary";

;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
