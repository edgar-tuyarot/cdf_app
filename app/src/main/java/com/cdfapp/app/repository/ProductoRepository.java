package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    // Permite buscar un producto por su código de negocio. Devuelve un Optional para manejar de forma segura los casos en que no se encuentra.
    Optional<Producto> findByCodigo(String codigo);
}