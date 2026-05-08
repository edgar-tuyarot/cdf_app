package com.cdfapp.app.service;

import com.cdfapp.app.dto.ExistenciaRequestDTO;
import com.cdfapp.app.dto.ExistenciaSummaryDTO;
import com.cdfapp.app.dto.PicadaReqDto;
import com.cdfapp.app.dto.PicadaResDto;
import com.cdfapp.app.entity.Existencia;
import com.cdfapp.app.entity.Producto;
import com.cdfapp.app.entity.Ubicacion;
import com.cdfapp.app.entity.Usuario;
import com.cdfapp.app.enums.EstadoProducto;
import com.cdfapp.app.repository.ExistenciaRepository;
import com.cdfapp.app.repository.ProductoRepository;
import com.cdfapp.app.repository.UbicacionRepository;
import com.cdfapp.app.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExistenciaService {

    private final ExistenciaRepository existenciaRepository;
    private final ProductoRepository productoRepository;
    private final UbicacionRepository ubicacionRepository;
    private final UsuarioRepository usuarioRepository;

    public ExistenciaService(ExistenciaRepository existenciaRepository,UsuarioRepository usuarioRepository, ProductoRepository productoRepository, UbicacionRepository ubicacionRepository) {
        this.existenciaRepository = existenciaRepository;
        this.productoRepository = productoRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public Existencia crearExistencia(ExistenciaRequestDTO dto) {
        Producto producto = (Producto) productoRepository.findByCodigo(dto.getCodigo_producto())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + dto.getCodigo_producto()));

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.getUbicacionId()));

        Existencia existencia = new Existencia();
        existencia.setProducto(producto);
        existencia.setEstado(dto.getEstado());
        existencia.setKilos(dto.getKilos());
        existencia.setUnidades(dto.getUnidades());
        existencia.setUbicacion(ubicacion);

        return existenciaRepository.save(existencia);
    }

    @Transactional
    public Existencia actualizarExistencia(ExistenciaRequestDTO dto) {

        Producto producto = productoRepository.findByCodigo(dto.getCodigo_producto())
                .orElseThrow(() ->
                        new RuntimeException("Producto no encontrado"));

        Ubicacion ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                .orElseThrow(() ->
                        new RuntimeException("Ubicación no encontrada"));

        Existencia existencia = existenciaRepository
                .findByProductoIdAndEstadoAndUbicacionId(
                        producto.getId(),
                        dto.getEstado(),
                        ubicacion.getId()
                )
                .orElseGet(() -> {
                    Existencia nueva = new Existencia();
                    nueva.setProducto(producto);
                    nueva.setEstado(dto.getEstado());
                    nueva.setUbicacion(ubicacion);
                    return nueva;
                });

        existencia.setKilos(dto.getKilos());
        existencia.setUnidades(dto.getUnidades());

        return existenciaRepository.save(existencia);
    }

    @Transactional(readOnly = true)
    public List<ExistenciaSummaryDTO> getExistenciaSummary() {
        return existenciaRepository.getExistenciaSummary();
    }

    // --- Método de Diagnóstico ---
    @Transactional(readOnly = true)
    public List<Existencia> getRawExistencias() {
        return existenciaRepository.findAllWithDetails();
    }



    @Transactional
    public PicadaResDto altaPicadas (PicadaReqDto dto ){
        Producto producto = productoRepository.findByCodigo(dto.codigo())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + dto.codigo()));
        Ubicacion ubicacion = ubicacionRepository.findById(dto.ubicacionId())
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.ubicacionId()));
        Usuario usuario = usuarioRepository.findById(dto.usuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + dto.usuarioId()));



        Existencia existencia = existenciaRepository.findByProductoAndEstadoAndUbicacion(producto, EstadoProducto.RECORTE, ubicacion)
                .orElseThrow(() -> new RuntimeException("Existencia no encontrado, con codigo: " + dto.codigo()));


        existencia.setKilos(existencia.getKilos().add(dto.peso()));

        existenciaRepository.save(existencia);



        return new PicadaResDto(
                existencia.getProducto().getCodigo(),
                existencia.getKilos()
        );

    }

}