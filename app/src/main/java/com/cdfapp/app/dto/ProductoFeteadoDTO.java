package com.cdfapp.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductoFeteadoDTO {
    private String codigo;
    private String nombre;
    private Long existencia_feteados;
    private BigDecimal existencia_posible;

    // Un constructor extra para JPA y poder calcular existencia_posible
    public ProductoFeteadoDTO(String codigo, String nombre, Long existencia_feteados, BigDecimal existencia_kilos, BigDecimal kilosPorBolsita) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.existencia_feteados = existencia_feteados != null ? existencia_feteados : 0L;
        
        if (existencia_kilos != null && kilosPorBolsita != null && kilosPorBolsita.compareTo(BigDecimal.ZERO) > 0) {
            this.existencia_posible = existencia_kilos.divide(kilosPorBolsita, 0, RoundingMode.DOWN);
        } else {
            this.existencia_posible = BigDecimal.ZERO;
        }
    }
}
