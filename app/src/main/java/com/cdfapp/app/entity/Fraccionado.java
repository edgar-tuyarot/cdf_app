package com.cdfapp.app.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "fraccionados")
public class Fraccionado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_producto_nuevo", nullable = false, unique = true)
    private String codigoProducto;

    @Column(name = "codigo_producto_original", nullable = false)
    private String codigoProductoOriginal;
}
