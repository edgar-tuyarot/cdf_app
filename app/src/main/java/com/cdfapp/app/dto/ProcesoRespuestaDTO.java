package com.cdfapp.app.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ProcesoRespuestaDTO {
    private Long proceso_id;
    private Detalles detalles;
    private LocalDateTime fecha;

    @Data
    public static class Detalles {
        private String tipo;
        private String usuario;
        private String producto_codigo;
        private String producto_nombre;
        private BigDecimal cantidad_piezas;
        private BigDecimal cantidad_recorte;
        private BigDecimal cantidad_decomiso;
        private BigDecimal cantidad_kilos;
        private BigDecimal resultado_cantidad;
    }
}
