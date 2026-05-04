package com.cdfapp.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductoExcelDTO {
    private String codigo_productos;
    private String producto;
    private String cantidad_fisica;
}
