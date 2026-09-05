/*
GENERA_LISTADO.JS
-----------------

Descripción general: Este archivo es utilizado por genera_listado.asp para generar grillas automáticas.
Autor: Esteban Bringas
Fecha Ult. Modificación: 21/03/2017

Archivos relacionados:
• genera_listado.asp
• proc_paginado_query.php

 */

/*
count
-----

Variable que se utilizará para verificar la cantidad de registros que devolverá el SP/vista/query para luego
hacer posible que la grilla haga el paginado.
 */
var count = 0;

/*
createTable
-----------

Esta función verifica si el origen de datos es un Stored Procedure, una vista o una consulta.
• Si es un SP o una consulta ejecutara el SQL y devolverá una fila para obtener los encabezados, luego
hará la consulta real.
• Si es una vista consultará INFORMATION_SCHEMA.TABLES para obtener las columnas que devuelve la vista y
asi setear la grilla.	+
 */
function createTable(vista, sql) {
	if (vista == ""  
		&& !sql.toUpperCase().includes("SP_") 
		&& !sql.toUpperCase().includes("PROC_") 
		&& !sql.toUpperCase().includes("CUSTOM_")) {
		jAlert("No se pudo determinar la vista " + sql, "Error");
		return;
	}
	if (sql == "") {
		jAlert("No se pudo determinar la consulta", "Error");
		return;
	}
	// STORED PROCEDURE
	if ( sql.toUpperCase().includes("SP_") 
		|| sql.toUpperCase().includes("PROC_") 
		|| sql.toUpperCase().startsWith("CUSTOM_")
		|| sql.toUpperCase().startsWith("EXEC CUSTOM")		) {
		if (sql.trim().match(/\s/g).length > 1) {
			sql = sql + ", ";
		}
		$.ajax({
			type: "POST",
			url: "proc_paginado_query.php",
			data: {
				query: sql,
				start: 0,
				length: 1
			},
			success: function (data) {
console.log(data);
				var json = JSON.parse(data);
				var names = [];
				for (var prop in json[0]) {
					if (json[0].hasOwnProperty(prop)) {
						if (prop != undefined) {
						    var COLUMN_NAME = prop;
                            if ( COLUMN_NAME != "Count" && COLUMN_NAME != "Row" )
							names.push({
								COLUMN_NAME: COLUMN_NAME
							});
						}
					}
				}
                var cols = getTableColumns(names);                
                if (cols.length == 0) {
                    alert("Los filtros ingresados no devuelven ningun registro. " + names);
                }

                loadTable(cols, sql, "", false);
			},
			error: function (data) {
console.log(data);
				jAlert("createTable:"+data.responseText, "Error");
			}
		});
	} else { // QUERY
		if (!sql.toUpperCase().includes("VIEW_")) {
			var aux = sql;
			if (aux.includes("'")) {
				aux = aux.replace(/'/g, "''");
			}
			// jAlert("Las vistas deben comenzar con el prefijo VIEW_. <br> Ha ingresado ---> " + vista, "Error");
			// return;
			$.ajax({
				type: "POST",
				url: "proc_paginado_query.php",
				data: {
					query: aux,
					start: 0,
					length: 1
				},
				success: function (data) {

					var json = JSON.parse(data);
					var names = [];
					for (var prop in json[0]) {
						if (json[0].hasOwnProperty(prop)) {
							if (prop != undefined) {
								var COLUMN_NAME = prop;
								if (COLUMN_NAME != "Count")
									names.push({
										COLUMN_NAME: COLUMN_NAME
									});
							}
						}
					}
					var cols = getTableColumns(names);
					loadTable(cols, sql);
				},
				error: function (data) {
					console.log(data);
					jAlert(data.responseText, "Error");
				}
			});
        } else { //VIEW
			
			console.log("sql ",sql);
			$.ajax({
				type: "POST",
				url: "proc_paginado_query.php",
				data: {
					query: "SELECT LOWER(COLUMN_NAME) AS COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '" + vista + "'"
				},
				success: function (data) {
					var json = JSON.parse(data);
					var cols = getTableColumns(json);
					loadTable(cols, sql, vista);
				},
				error: function (data) {
					console.log(data);
					jAlert(data.responseText, "Error");
				}
			});
		}
	}
}
/*
loadTable
---------

Esta función verificará si el reporte es genérico o manual, obtendrá la configuración de REPORTES o le dará la configuración predeterminada
y luego creará la tabla.
*/
function loadTable(cols, sql, vista, reemplazaComillas) {

    if (reemplazaComillas == undefined)
        reemplazaComillas = true;

    if (reemplazaComillas) {
        if (sql.includes("'")) {
            sql = sql.replace(/'/g, "''");
        }
    }

    //cols = lowerCaseList(cols);
    for (var i = 0; i < cols.length; i++) {
        cols[i].data = cols[i].data.toLowerCase();
    }

    var query = getQueryParams(parent.location.search);
    var codigo_reportes = query.codigo_reportes;

    if (codigo_reportes == undefined) {
        var reportesConfig = {};
        reportesConfig.display_length = 50;
        var table = setDataTable("table", sql, cols, "", reportesConfig);
    } else {
        $.ajax({
            type: "POST",
            url: "proc_paginado_query.php",
            data: {
                query: "SELECT display_length FROM Reportes WHERE codigo_reportes = '" + codigo_reportes + "'"
            },
            success: function (data) {
                var reportesConfig = JSON.parse(data)[0];
                if (reportesConfig.display_length == 0)
                    reportesConfig.display_length = 50;

                // Uso "setDataTable" definida en js/library.js
                var table = setDataTable("table", sql, cols, "", reportesConfig, vista);
            },
            error: function (data) {

                console.log(data);
                jAlert("loadTable:"+data.responseText, "Error");
            }

        });

    }

}

function MaysPrimera(string){
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getTimeFormat(dSeconds) {
    var iSeconds = parseInt(dSeconds);
    var hours = Math.floor(iSeconds / 3600);
    var minutes = Math.floor((iSeconds - hours * 3600) / 60);
    var seconds = iSeconds - (hours * 3600 + minutes * 60);

    return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
}

/*
getFormattedHeader
------------------

Recibe un encabezado y setea correctamente la forma en que se va visualizar.
 */
function getFormattedHeader(title) {
		
	if (title.includes("#")) {
		title = title.substring(0, title.indexOf("#"));
	}
  if (title.includes("_vis_")) {
		title = title.substring(0, title.indexOf("_vis_"));
	}
  if (title.includes("_VIS_")) {
		title = title.substring(0, title.indexOf("_VIS_"));
	}
	
	title =	MaysPrimera(title);
	title = title.replace("_sec_", "");
	title = title.replace("_SEC_", "");
	title = title.replace("@", "");
	title = title.replace("*", "");
	title = title.replace(/_/g, " ");

	return title;
}
/*
getTableColumns
---------------

Esta función recibe un JSON con el COLUMN_NAME de cada uno de los campos del result set del SP/Vista/Query de origen de datos
y creara el json array de columnasm ( cols ) que utiliza la grilla para inicializar las columnas.
 */
function getTableColumns(json) {

	var cols = [];

	// Si ningun campo trae # traigo todo
	var camposNumeral = 0;
	for (var i = 0; i < json.length; i++) {
		var title = json[i].COLUMN_NAME;
		if (title.includes("#")) {
			camposNumeral++;
		}
	}

	for (var i = 0; i < json.length; i++) {
		var title = json[i].COLUMN_NAME;
		if( title.indexOf("?") != -1 ) {
			var caracter_index = title.indexOf("?");		
			title = title.substring(0, caracter_index)
		}
    
		// Chequeo si traigo todo, si no traigo todo me fijo si ese campo tiene #
		if (camposNumeral > 1) {
			if (title.includes("#")) {
				title = getFormattedHeader(title);
				cols.push({
					data: json[i].COLUMN_NAME,
					title: title,
					sortable: true
				});
			}
		} else { // Si trae todo agrego la columna , pero excluimos las de uso interno
        if (title.indexOf("_hse_")==-1 && title.indexOf("id_")==-1) {
          title = getFormattedHeader(title);
          cols.push({
            data: json[i].COLUMN_NAME,
            title: title,
            sortable: true
          });      
        }
		}
		
	}
	
	return cols;
}

function getTableColumnsFromJson(auxiliar, callback) {

    $.ajax({
        type: "POST",
        url: "proc_paginado_query.php",
        data: {
            query: auxiliar,
            start: 0,
            length: 1
        },
        success: function (data) {
			console.log(data);
            var json = JSON.parse(data);
            var names = [];
            for (var prop in json[0]) {
                if (json[0].hasOwnProperty(prop)) {
                    if (prop != undefined) {
                        var COLUMN_NAME = prop;
                        if (COLUMN_NAME != "Count" && COLUMN_NAME != "Row") names.push({
                                COLUMN_NAME: COLUMN_NAME
                        });
                    }
                }
            }
            var cols = getTableColumns(names);
            //cols = lowerCaseList(cols);
            for (var i = 0; i < cols.length; i++) {
                cols[i].data = cols[i].data.toLowerCase();
            }
            callback(cols);
        },
        error: function (data) {
            console.log(data);
            jAlert("getTableColumnsFromJson:" + data.responseText, "Error");
        }
    });
}

/*-- FIN --*/
