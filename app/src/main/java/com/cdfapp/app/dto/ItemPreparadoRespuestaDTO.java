package com.cdfapp.app.dto;

import com.cdfapp.app.enums.EstadoProducto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ItemPreparadoRespuestaDTO {
    private Long itemId; // Clave para poder editarlo después
    private String productoCodigo;
    private EstadoProducto estado;
    private Integer cantidad;
    private BigDecimal pesoReal;
    private Integer cantidad_pedida;
}
