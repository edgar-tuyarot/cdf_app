package com.cdfapp.app.repository;

import com.cdfapp.app.dto.ExistenciaSummaryDTO;
import com.cdfapp.app.dto.ProductoFeteadoDTO;
import com.cdfapp.app.entity.Existencia;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.entity.Ubicacion;
import com.cdfapp.app.enums.EstadoProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExistenciaRepository extends JpaRepository<Existencia, Long> {

    Optional<Existencia> findByProductoAndEstadoAndUbicacion(Producto producto, EstadoProducto estado, Ubicacion ubicacion);

    @Query("SELECT new com.cdfapp.app.dto.ExistenciaSummaryDTO(" +
            "p.codigo, " +
            "p.nombre, " +
            "u.nombre, " +
            "SUM(CASE WHEN e.estado = 'FETEADO' THEN e.unidades ELSE 0 END), " +
            "SUM(CASE WHEN e.estado = 'PIEZA' THEN e.unidades ELSE 0 END), " +
            "SUM(CASE WHEN e.estado = 'KILOS' THEN e.kilos ELSE 0 END), " +
            "SUM(CASE WHEN e.estado = 'ENVASADO' THEN e.unidades ELSE 0 END), " +
            "SUM(CASE WHEN e.estado = 'RECORTE' THEN e.kilos ELSE 0 END), " +
            "SUM(CASE WHEN e.estado = 'DECOMISADO' THEN e.kilos ELSE 0 END)) " +
            "FROM Existencia e JOIN e.producto p JOIN e.ubicacion u " +
            "GROUP BY p.codigo, p.nombre, u.nombre")
    List<ExistenciaSummaryDTO> getExistenciaSummary();
    
    @Query("SELECT new com.cdfapp.app.dto.ProductoFeteadoDTO(" +
            "p.codigo, " +
            "p.nombre, " +
            "SUM(CASE WHEN e.estado = 'FETEADO' THEN e.unidades ELSE 0 END), " +
            "SUM(CASE WHEN e.estado = 'KILOS' THEN e.kilos ELSE 0 END), " +
            "p.kilosPorBolsita) " +
            "FROM Existencia e JOIN e.producto p " +
            "GROUP BY p.codigo, p.nombre, p.kilosPorBolsita")
    List<ProductoFeteadoDTO> getProductosFeteadosStatus();

    // --- Metodo de Diagnóstico ---
    @Query("SELECT e FROM Existencia e LEFT JOIN FETCH e.producto LEFT JOIN FETCH e.ubicacion")
    List<Existencia> findAllWithDetails();


    Optional<Existencia> findByProductoIdAndEstadoAndUbicacionId(
            Long productoId,
            EstadoProducto estado,
            Long ubicacionId
    );


}
