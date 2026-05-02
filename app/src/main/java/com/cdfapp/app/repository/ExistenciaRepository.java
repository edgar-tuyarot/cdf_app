package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Existencia;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.enums.EstadoProducto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExistenciaRepository extends JpaRepository<Existencia, Long> {

    // Busca un registro de stock específico basado en la clave única de negocio que definiste.
    Optional<Existencia> findByProductoAndEstadoAndUbicacion(Producto producto, EstadoProducto estado, Long ubicacion);

    // Devuelve todos los tipos de existencia (en diferentes estados o ubicaciones) para un producto.
    List<Existencia> findByProducto(Producto producto);
}