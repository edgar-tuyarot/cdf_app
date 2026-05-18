package org.example.entidades;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "productos")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(unique = true)
    String codigo;

    String nombre;

    @ManyToOne
    @JoinColumn(name = "proveedor_id")
    Proveedor proveedor;

}
