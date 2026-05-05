package com.cdfapp.app.service;

import com.cdfapp.app.dto.EnvasadoRequestDTO;
import com.cdfapp.app.dto.ProcesamientoRequestDTO;
import com.cdfapp.app.dto.ProcesoRespuestaDTO;
import com.cdfapp.app.entity.*;
import com.cdfapp.app.enums.EstadoProducto;
import com.cdfapp.app.enums.MotivoMovimiento;
import com.cdfapp.app.enums.TipoProceso;
import com.cdfapp.app.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProcesoService {

    private final ProcesoRepository procesoRepository;
    private final MovimientoRepository movimientoRepository;
    private final ExistenciaRepository existenciaRepository;
    private final ProductoRepository productoRepository;
    private final UbicacionRepository ubicacionRepository;
    private final UsuarioRepository usuarioRepository;

    public ProcesoService(ProcesoRepository procesoRepository, MovimientoRepository movimientoRepository,
                          ExistenciaRepository existenciaRepository, ProductoRepository productoRepository,
                          UbicacionRepository ubicacionRepository, UsuarioRepository usuarioRepository) {
        this.procesoRepository = procesoRepository;
        this.movimientoRepository = movimientoRepository;
        this.existenciaRepository = existenciaRepository;
        this.productoRepository = productoRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public Proceso procesarStock(ProcesamientoRequestDTO dto) {
        // 1. Obtener entidades relacionadas
        Producto producto = productoRepository.findByCodigo(dto.getCodigo())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + dto.getCodigo()));
        Ubicacion ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.getUbicacionId()));
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + dto.getUsuarioId()));

        // 2. Crear y guardar el Proceso
        Proceso proceso = Proceso.builder()
                .tipo(TipoProceso.FRACCIONADO) // Usamos un tipo existente que encaja
                .fecha(LocalDateTime.now())
                .usuario(usuario)
                .build();
        proceso = procesoRepository.save(proceso);

        // 3. Procesar SALIDAS (Materia Prima)
        if (dto.getPiezas_utilizadas() != null && dto.getPiezas_utilizadas() > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.PIEZA,
                    MotivoMovimiento.SALIDA, null, dto.getPiezas_utilizadas());
        }

        if (dto.getPeso_consumido() != null && dto.getPeso_consumido().compareTo(BigDecimal.ZERO) > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.KILOS,
                    MotivoMovimiento.SALIDA, dto.getPeso_consumido(), null);
        }

        // 4. Procesar ENTRADAS (Resultados)
        if (dto.getFracciones() != null && dto.getFracciones() > 0) {
            // AHORA LAS FRACCIONES VAN A ESTADO FETEADO
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.FETEADO,
                    MotivoMovimiento.ENTRADA, null, dto.getFracciones());
        }

        if (dto.getRecortes() != null && dto.getRecortes().compareTo(BigDecimal.ZERO) > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.RECORTE,
                    MotivoMovimiento.ENTRADA, dto.getRecortes(), null);
        }

        if (dto.getDecomisos() != null && dto.getDecomisos().compareTo(BigDecimal.ZERO) > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.DECOMISADO,
                    MotivoMovimiento.ENTRADA, dto.getDecomisos(), null);
        }

        return proceso;
    }

    @Transactional
    public Proceso procesarEnvasado(EnvasadoRequestDTO dto) {
        // 1. Obtener entidades relacionadas
        Producto producto = productoRepository.findByCodigo(dto.getCodigo())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + dto.getCodigo()));
        Ubicacion ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.getUbicacionId()));
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + dto.getUsuarioId()));

        // 2. Crear y guardar el Proceso de tipo ENVASADO
        Proceso proceso = Proceso.builder()
                .tipo(TipoProceso.ENVASADO)
                .fecha(LocalDateTime.now())
                .usuario(usuario)
                .build();
        proceso = procesoRepository.save(proceso);

        // 3. Procesar SALIDA (Materia Prima: Feteado)
        if (dto.getCantidad() != null && dto.getCantidad() > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.FETEADO,
                    MotivoMovimiento.SALIDA, null, dto.getCantidad());
        }

        // 4. Procesar ENTRADA (Producto Terminado: Envasado)
        if (dto.getCantidad() != null && dto.getCantidad() > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.ENVASADO,
                    MotivoMovimiento.ENTRADA, null, dto.getCantidad());
        }

        return proceso;
    }

    private void actualizarYRegistrar(Producto producto, Ubicacion ubicacion, Proceso proceso,
                                      EstadoProducto estado, MotivoMovimiento motivo,
                                      BigDecimal kilos, Integer unidades) {

        // Buscar o crear la Existencia
        Existencia existencia = existenciaRepository.findByProductoAndEstadoAndUbicacion(producto, estado, ubicacion)
                .orElseGet(() -> Existencia.builder()
                        .producto(producto)
                        .estado(estado)
                        .ubicacion(ubicacion)
                        .kilos(BigDecimal.ZERO)
                        .unidades(0)
                        .build());

        // Actualizar valores según el motivo
        if (motivo == MotivoMovimiento.SALIDA) {
            if (unidades != null) existencia.setUnidades(existencia.getUnidades() - unidades);
            if (kilos != null) existencia.setKilos(existencia.getKilos().subtract(kilos));
        } else if (motivo == MotivoMovimiento.ENTRADA) {
            if (unidades != null) existencia.setUnidades(existencia.getUnidades() + unidades);
            if (kilos != null) existencia.setKilos(existencia.getKilos().add(kilos));
        }

        existenciaRepository.save(existencia);

        // Crear el Movimiento para el registro histórico
        Movimiento movimiento = Movimiento.builder()
                .producto(producto)
                .fecha(LocalDateTime.now())
                .motivo(motivo)
                .estado(estado) // AGREGADO AQUI
                .proceso(proceso)
                .cantidad(kilos != null ? kilos : new BigDecimal(unidades)) // Guardamos el valor que se movió
                .build();

        movimientoRepository.save(movimiento);
    }

    @Transactional(readOnly = true)
    public List<ProcesoRespuestaDTO> getTodosLosProcesos() {
        List<Proceso> procesos = procesoRepository.findAll();
        List<ProcesoRespuestaDTO> respuestas = new ArrayList<>();

        for (Proceso proceso : procesos) {
            List<Movimiento> movimientos = movimientoRepository.findByProcesoId(proceso.getId());
            
            ProcesoRespuestaDTO dto = new ProcesoRespuestaDTO();
            dto.setProceso_id(proceso.getId());
            dto.setFecha(proceso.getFecha());
            
            ProcesoRespuestaDTO.Detalles detalles = new ProcesoRespuestaDTO.Detalles();
            detalles.setTipo(proceso.getTipo().name());
            detalles.setUsuario(proceso.getUsuario().getUsername());
            
            if (!movimientos.isEmpty()) {
                Producto p = movimientos.get(0).getProducto();
                detalles.setProducto_codigo(p.getCodigo());
                detalles.setProducto_nombre(p.getNombre());
            }

            for (Movimiento mov : movimientos) {
                if (mov.getEstado() == null) continue; // Por si hay movimientos viejos sin estado
                
                switch (mov.getEstado()) {
                    case PIEZA:
                        detalles.setCantidad_piezas(mov.getCantidad());
                        break;
                    case RECORTE:
                        detalles.setCantidad_recorte(mov.getCantidad());
                        break;
                    case DECOMISADO:
                        detalles.setCantidad_decomiso(mov.getCantidad());
                        break;
                    case KILOS:
                        detalles.setCantidad_kilos(mov.getCantidad());
                        break;
                    case FETEADO:
                        // Si es FRACCIONADO, FETEADO es el resultado. 
                        // Si es ENVASADO, FETEADO es la entrada (la cantidad que se usó).
                        if (proceso.getTipo() == TipoProceso.FRACCIONADO) {
                            detalles.setResultado_cantidad(mov.getCantidad());
                        }
                        break;
                    case ENVASADO:
                        // Si es ENVASADO, ENVASADO es el resultado final.
                        if (proceso.getTipo() == TipoProceso.ENVASADO) {
                            detalles.setResultado_cantidad(mov.getCantidad());
                        } else if (detalles.getResultado_cantidad() == null) {
                            // Legacy fallback
                            detalles.setResultado_cantidad(mov.getCantidad());
                        }
                        break;
                    default:
                        break;
                }
            }
            
            dto.setDetalles(detalles);
            respuestas.add(dto);
        }

        return respuestas;
    }
}
