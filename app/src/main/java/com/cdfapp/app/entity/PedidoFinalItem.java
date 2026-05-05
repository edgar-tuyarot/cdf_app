package com.cdfapp.app.entity;

import com.cdfapp.app.enums.EstadoProducto;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "pedido_final_items")
public class PedidoFinalItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_final_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private PedidoFinal pedidoFinal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    // Cantidad en unidades (ej. 3 paquetes)
    @Column
    private Integer cantidad;

    // Peso real de lo que se preparó (ej. 1.250 kg)
    @Column(precision = 10, scale = 3)
    private BigDecimal pesoReal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoProducto estado;
}
