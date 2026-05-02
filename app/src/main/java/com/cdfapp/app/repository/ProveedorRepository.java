package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {
    // JpaRepository ya proporciona los métodos CRUD básicos.
}