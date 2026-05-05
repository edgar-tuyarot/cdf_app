package com.cdfapp.app.dto;

import lombok.Data;

@Data
public class EnvasadoRequestDTO {
    private String codigo;
    private Long ubicacionId;
    private Long usuarioId;
    private Integer cantidad;
}
