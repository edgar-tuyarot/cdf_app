package com.cdfapp.app.entity;

import com.cdfapp.app.enums.EstadoProducto;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "pedido_productos")
public class PedidoProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id", nullable = false)
    @EqualsAndHashCode.Exclude // Rompe el ciclo en equals/hashCode
    @ToString.Exclude // Rompe el ciclo en toString
    private Pedido pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private EstadoProducto estado;
}
