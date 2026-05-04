package com.cdfapp.app.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductoDTO {
    private String codigo;
    private String nombre;
    private Boolean picable;
    private Boolean feteable;
    private BigDecimal kilosPorBolsita;
    private Long proveedorId;
}
