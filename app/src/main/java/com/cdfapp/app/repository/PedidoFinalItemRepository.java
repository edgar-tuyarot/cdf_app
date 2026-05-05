package com.cdfapp.app.repository;

import com.cdfapp.app.entity.PedidoFinalItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PedidoFinalItemRepository extends JpaRepository<PedidoFinalItem, Long> {
}
