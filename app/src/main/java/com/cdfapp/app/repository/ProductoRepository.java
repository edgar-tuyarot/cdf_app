package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    @Query("SELECT p FROM Producto p LEFT JOIN FETCH p.proveedor")
    List<Producto> findAllWithProveedor();

    Optional<Producto> findByCodigo(String codigo);

    @Query("SELECT DISTINCT p FROM Existencia e JOIN e.producto p WHERE e.estado = 'FETEADO'")
    List<Producto> findProductosConExistenciaFeteada();
}
