package com.cdfapp.app.dto;

import com.cdfapp.app.enums.EstadoProducto;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PrepararItemDTO {
    private String productoCodigo;
    private EstadoProducto estado;
    private Integer cantidad;
    private BigDecimal pesoReal;
}
