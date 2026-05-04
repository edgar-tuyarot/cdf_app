package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @Query("SELECT p FROM Pedido p " +
           "LEFT JOIN FETCH p.sucursal " +
           "LEFT JOIN FETCH p.items i " +
           "LEFT JOIN FETCH i.producto")
    List<Pedido> findAllWithDetails();
}
