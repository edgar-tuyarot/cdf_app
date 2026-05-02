package com.cdfapp.app.entity;

import com.cdfapp.app.enums.MotivoMovimiento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Table(name = "movimientos")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
public class Movimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="producto_id", nullable = false)
    private Producto producto;

    @Column
    private BigDecimal cantidad;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Enumerated(EnumType.STRING)
    private MotivoMovimiento motivo;

    @ManyToOne
    @JoinColumn(name = "proceso_id")
    private Proceso proceso;

    @PrePersist
    public void prePersist() {
        this.fecha = LocalDateTime.now();
    }

}
