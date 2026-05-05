package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Fraccionado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FraccionadoRepository extends JpaRepository<Fraccionado, Long> {
    Optional<Fraccionado> findByCodigoProductoOriginal(String codigoProductoOriginal);
}
