package com.cdfapp.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "pedidos_finales")
public class PedidoFinal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_original_id", nullable = false, unique = true)
    private Pedido pedidoOriginal;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @OneToMany(mappedBy = "pedidoFinal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PedidoFinalItem> items = new ArrayList<>();

    public void addItem(PedidoFinalItem item) {
        items.add(item);
        item.setPedidoFinal(this);
    }
}
