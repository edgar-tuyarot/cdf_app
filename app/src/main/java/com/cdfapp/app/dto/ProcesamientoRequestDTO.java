package com.cdfapp.app.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProcesamientoRequestDTO {
    private String codigo;
    private Long ubicacionId; // Necesario para saber dónde procesar
    private Long usuarioId; // Quién hace el proceso
    private BigDecimal recortes;
    private BigDecimal decomisos;
    private Integer fracciones;
    private Integer piezas_utilizadas;
    private BigDecimal peso_consumido;
}
