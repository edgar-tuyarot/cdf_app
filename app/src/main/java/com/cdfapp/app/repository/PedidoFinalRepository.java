package com.cdfapp.app.repository;

import com.cdfapp.app.entity.PedidoFinal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PedidoFinalRepository extends JpaRepository<PedidoFinal, Long> {
    Optional<PedidoFinal> findByPedidoOriginalId(Long pedidoOriginalId);
}
