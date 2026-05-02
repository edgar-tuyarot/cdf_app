package com.cdfapp.app.entity;


import jakarta.persistence.Entity;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "sucursales")
public class Sucursal {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nombre;

    @Column
    private Integer numero;

    @Column
    private String direccion;

    @Column
    private String telefono;

    @OneToOne
    private Ubicacion ubicacion;

    @OneToMany
    @JoinColumn(name = "sucursal_id")
    private List<Pedido> pedidos;


}
