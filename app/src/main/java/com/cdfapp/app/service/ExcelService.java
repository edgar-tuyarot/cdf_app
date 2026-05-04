package com.cdfapp.app.service;

import com.cdfapp.app.dto.ProductoExcelDTO;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
public class ExcelService {

    public List<ProductoExcelDTO> leerDesdeExcel(InputStream inputStream) {
        List<ProductoExcelDTO> listaProductos = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheetAt(0); // Obtiene la primera hoja

            Iterator<Row> rowIterator = sheet.iterator();

            // Opcional: Omitir la fila de encabezado
            if (rowIterator.hasNext()) {
                rowIterator.next(); 
            }

            while (rowIterator.hasNext()) {
                Row row = rowIterator.next();
                
                // Leer las columnas 3, 5 y 10 (índices 2, 4, 9)
                Cell cellCodigo = row.getCell(2, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                Cell cellProducto = row.getCell(4, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
                Cell cellCantidad = row.getCell(9, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);

                // Convertir el contenido de la celda a String
                DataFormatter dataFormatter = new DataFormatter();
                String codigo = dataFormatter.formatCellValue(cellCodigo);
                String producto = dataFormatter.formatCellValue(cellProducto);
                String cantidad = dataFormatter.formatCellValue(cellCantidad);

                listaProductos.add(new ProductoExcelDTO(codigo, producto, cantidad));
            }

        } catch (Exception e) {
            // En un caso real, aquí deberías manejar la excepción de forma más robusta
            e.printStackTrace();
        }

        return listaProductos;
    }
}
