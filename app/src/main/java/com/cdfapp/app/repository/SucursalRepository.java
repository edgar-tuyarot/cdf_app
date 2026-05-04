package com.cdfapp.app.repository;

import com.cdfapp.app.entity.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SucursalRepository extends JpaRepository<Sucursal, Long> {

    @Query("SELECT s FROM Sucursal s LEFT JOIN FETCH s.ubicacion")
    List<Sucursal> findAllWithUbicacion();
}
