package com.cdfapp.app.dto;

import com.cdfapp.app.enums.EstadoProducto;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ExistenciaRequestDTO {
    private String codigo_producto;
    private EstadoProducto estado;
    private BigDecimal kilos;
    private Integer unidades;
    private Long ubicacionId;
}
