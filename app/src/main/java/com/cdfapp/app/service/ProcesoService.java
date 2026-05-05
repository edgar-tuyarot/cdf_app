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
import java.util.Optional;

@Service
public class ProcesoService {

    private final ProcesoRepository procesoRepository;
    private final MovimientoRepository movimientoRepository;
    private final ExistenciaRepository existenciaRepository;
    private final ProductoRepository productoRepository;
    private final UbicacionRepository ubicacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final FraccionadoRepository fraccionadoRepository; // Inyectado

    public ProcesoService(ProcesoRepository procesoRepository, MovimientoRepository movimientoRepository,
                          ExistenciaRepository existenciaRepository, ProductoRepository productoRepository,
                          UbicacionRepository ubicacionRepository, UsuarioRepository usuarioRepository,
                          FraccionadoRepository fraccionadoRepository) { // Añadido al constructor
        this.procesoRepository = procesoRepository;
        this.movimientoRepository = movimientoRepository;
        this.existenciaRepository = existenciaRepository;
        this.productoRepository = productoRepository;
        this.ubicacionRepository = ubicacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.fraccionadoRepository = fraccionadoRepository; // Asignado
    }

    @Transactional
    public Proceso procesarEnvasado(EnvasadoRequestDTO dto) {
        // 1. Obtener entidades relacionadas
        Producto productoOriginal = productoRepository.findByCodigo(dto.getCodigo())
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

        // 3. Procesar SALIDA (Materia Prima: Feteado del producto original)
        if (dto.getCantidad() != null && dto.getCantidad() > 0) {
            actualizarYRegistrar(productoOriginal, ubicacion, proceso, EstadoProducto.FETEADO,
                    MotivoMovimiento.SALIDA, null, dto.getCantidad());
        }

        // 4. LÓGICA DE FRACCIONAMIENTO: Determinar el producto de destino
        Optional<Fraccionado> reglaOpt = fraccionadoRepository.findByCodigoProductoOriginal(productoOriginal.getCodigo());
        
        Producto productoDestino;
        if (reglaOpt.isPresent()) {
            // Si hay regla, el destino es el nuevo producto
            String nuevoCodigo = reglaOpt.get().getCodigoProducto();
            productoDestino = productoRepository.findByCodigo(nuevoCodigo)
                    .orElseThrow(() -> new RuntimeException("Producto fraccionado de destino no encontrado con código: " + nuevoCodigo));
        } else {
            // Si no hay regla, el destino es el mismo producto original
            productoDestino = productoOriginal;
        }

        // 5. Procesar ENTRADA (Producto Terminado: Envasado en el producto de destino)
        if (dto.getCantidad() != null && dto.getCantidad() > 0) {
            actualizarYRegistrar(productoDestino, ubicacion, proceso, EstadoProducto.ENVASADO,
                    MotivoMovimiento.ENTRADA, null, dto.getCantidad());
        }

        return proceso;
    }

    @Transactional
    public Proceso procesarStock(ProcesamientoRequestDTO dto) {
        Producto producto = productoRepository.findByCodigo(dto.getCodigo())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado con código: " + dto.getCodigo()));
        Ubicacion ubicacion = ubicacionRepository.findById(dto.getUbicacionId())
                .orElseThrow(() -> new RuntimeException("Ubicación no encontrada con id: " + dto.getUbicacionId()));
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con id: " + dto.getUsuarioId()));

        Proceso proceso = Proceso.builder()
                .tipo(TipoProceso.FRACCIONADO)
                .fecha(LocalDateTime.now())
                .usuario(usuario)
                .build();
        proceso = procesoRepository.save(proceso);

        if (dto.getPiezas_utilizadas() != null && dto.getPiezas_utilizadas() > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.PIEZA,
                    MotivoMovimiento.SALIDA, null, dto.getPiezas_utilizadas());
        }

        if (dto.getPeso_consumido() != null && dto.getPeso_consumido().compareTo(BigDecimal.ZERO) > 0) {
            actualizarYRegistrar(producto, ubicacion, proceso, EstadoProducto.KILOS,
                    MotivoMovimiento.SALIDA, dto.getPeso_consumido(), null);
        }

        if (dto.getFracciones() != null && dto.getFracciones() > 0) {
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

    private void actualizarYRegistrar(Producto producto, Ubicacion ubicacion, Proceso proceso,
                                      EstadoProducto estado, MotivoMovimiento motivo,
                                      BigDecimal kilos, Integer unidades) {

        Existencia existencia = existenciaRepository.findByProductoAndEstadoAndUbicacion(producto, estado, ubicacion)
                .orElseGet(() -> Existencia.builder()
                        .producto(producto)
                        .estado(estado)
                        .ubicacion(ubicacion)
                        .kilos(BigDecimal.ZERO)
                        .unidades(0)
                        .build());

        if (motivo == MotivoMovimiento.SALIDA) {
            if (unidades != null) existencia.setUnidades(existencia.getUnidades() - unidades);
            if (kilos != null) existencia.setKilos(existencia.getKilos().subtract(kilos));
        } else if (motivo == MotivoMovimiento.ENTRADA) {
            if (unidades != null) existencia.setUnidades(existencia.getUnidades() + unidades);
            if (kilos != null) existencia.setKilos(existencia.getKilos().add(kilos));
        }

        existenciaRepository.save(existencia);

        Movimiento movimiento = Movimiento.builder()
                .producto(producto)
                .fecha(LocalDateTime.now())
                .motivo(motivo)
                .estado(estado)
                .proceso(proceso)
                .cantidad(kilos != null ? kilos : new BigDecimal(unidades))
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
                if (mov.getEstado() == null) continue;
                
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
                        if (proceso.getTipo() == TipoProceso.FRACCIONADO) {
                            detalles.setResultado_cantidad(mov.getCantidad());
                        }
                        break;
                    case ENVASADO:
                        if (proceso.getTipo() == TipoProceso.ENVASADO) {
                            detalles.setResultado_cantidad(mov.getCantidad());
                        } else if (detalles.getResultado_cantidad() == null) {
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