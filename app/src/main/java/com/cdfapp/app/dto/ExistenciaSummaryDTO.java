package com.cdfapp.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExistenciaSummaryDTO {
    private String codigo_producto;
    private String nombre;
    private String ubicacionNombre;
    private Long feteados;
    private Long piezas;
    private BigDecimal kilos;
}
