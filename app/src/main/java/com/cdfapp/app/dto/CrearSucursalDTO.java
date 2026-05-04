package com.cdfapp.app.dto;

import lombok.Data;

@Data
public class CrearSucursalDTO {
    private String nombre;
    private Integer numero;
    private String direccion;
    private String telefono;
    private Long ubicacionId; // Opcional. Si es nulo, se crea una ubicación nueva.
}
