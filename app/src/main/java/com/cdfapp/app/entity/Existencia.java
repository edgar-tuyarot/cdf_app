package com.cdfapp.app.entity;

import com.cdfapp.app.enums.EstadoProducto;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(
        name = "existencias",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"producto_id", "estado", "ubicacion_id"})
        }
)
public class Existencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoProducto estado;

    @Column(precision = 19, scale = 3)
    private BigDecimal kilos;

    @Column
    private Integer unidades;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacion_id", nullable = false)
    private Ubicacion ubicacion;

    @Column
    private LocalDateTime ultimaActualizacion;

    @PrePersist
    @PreUpdate
    public void preUpdate() {
        this.ultimaActualizacion = LocalDateTime.now();
    }
}
