package com.cdfapp.app.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "productos")
public class Producto {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private String codigo;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private Boolean picable;

    @Column(nullable = false)
    private Boolean feteable;

    //Calculos de conversiones estimados
    @Column
    private BigDecimal kilosPorBolsita;

    //Relacion con el proveedor
    @ManyToOne
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @OneToMany
    @JoinColumn(name = "producto_id")
    private List<PedidoProducto> pedidoProducto;

}
