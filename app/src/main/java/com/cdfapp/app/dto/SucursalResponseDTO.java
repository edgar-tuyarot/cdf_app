package com.cdfapp.app.dto;

import com.cdfapp.app.entity.Ubicacion;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SucursalResponseDTO {
    private Long id;
    private String nombre;
    private Integer numero;
    private String direccion;
    private String telefono;
    private UbicacionDTO ubicacion;

    // Un DTO anidado para la ubicación, para no exponer la entidad directamente
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UbicacionDTO {
        private Long id;
        private String nombre;
        private String descripcion;
        private Integer numero;

        public UbicacionDTO(Ubicacion ubicacion) {
            this.id = ubicacion.getId();
            this.nombre = ubicacion.getNombre();
            this.descripcion = ubicacion.getDescripcion();
            this.numero = ubicacion.getNumero();
        }
    }
}
