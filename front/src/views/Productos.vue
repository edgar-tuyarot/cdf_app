<template>
  <div class="page-container animate-fade">
    <!-- VISTA 1: LISTADO DE PRODUCTOS Y TABLA (Cuando !showModal) -->
    <div v-if="!showModal">
      <div class="page-header">
        <div class="header-content">
          <h2 class="page-title">Gestión de Productos</h2>
          <p class="page-description">Administra el catálogo de productos y sus detalles.</p>
        </div>
        <div class="header-actions mt-2">
          <input v-if="isAdmin" type="file" ref="stockFileInput" accept=".xlsx, .xls" style="display: none" @change="handleStockFileUpload" />
          <button v-if="isAdmin" class="btn btn-secondary" style="background: #1a7f37; color: #fff; border: 1px solid #15692e;" @click="triggerStockFileInput" :disabled="uploadingStock">
            <i class="ph ph-spinner spinner" v-if="uploadingStock"></i>
            <i class="ph ph-package" v-else></i> Cargar Stock (Excel)
          </button>
          <button v-if="isAdmin" class="btn btn-secondary" style="background: #0284c7; color: #fff; border: 1px solid #0369a1; display: flex; align-items: center; gap: 0.25rem;" @click="runStockSync" :disabled="syncingBlock">
            <i class="ph ph-spinner spinner" v-if="syncingBlock"></i>
            <i class="ph ph-arrows-clockwise" v-else></i> Sync Block
          </button>
          <button v-if="!isSucursal" class="btn btn-secondary" style="background: #275214; color: #fff; border: 1px solid #1c3d0e; display: flex; align-items: center; gap: 0.25rem;" @click="exportToExcel" :disabled="loading || productos.length === 0">
            <i class="ph ph-file-xls"></i> Exportar Vencimientos
          </button>
          <button class="btn btn-secondary" style="background: #3d85c6; color: #fff; border: 1px solid #2b6194; display: flex; align-items: center; gap: 0.25rem;" @click="exportTableToExcel" :disabled="loading || filteredAndSortedProductos.length === 0">
            <i class="ph ph-table"></i> Exportar Tabla
          </button>
          <button v-if="isAdmin" class="btn btn-primary" @click="openModal()">
            <i class="ph ph-plus"></i> Nuevo Producto
          </button>
        </div>
      </div>

      <!-- Mensajes de estado -->
      <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
        {{ alert.message }}
      </div>

      <!-- Tabla de Productos -->
      <div class="card">
        <div class="card-header responsive-card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <span class="card-title">Listado de Productos ({{ filteredAndSortedProductos.length }})</span>
          <div class="header-filter-bar" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <!-- Filtro de Proveedor -->
            <div style="display: flex; align-items: center; gap: 0.25rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
              <i class="ph ph-truck" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
              <select v-model="filterProveedor" style="border: none; outline: none; font-size: 0.8rem; background: transparent; color: var(--text-primary); cursor: pointer; padding-right: 5px;">
                <option value="" style="background-color: var(--bg-window); color: var(--text-primary);">Todos los Proveedores</option>
                <option v-for="prov in proveedores" :key="prov.id" :value="prov.id" style="background-color: var(--bg-window); color: var(--text-primary);">
                  {{ prov.nombre }}
                </option>
              </select>
            </div>

            <!-- Filtro por Sucursal Habilitada -->
            <div style="display: flex; align-items: center; gap: 0.25rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
              <i class="ph ph-storefront" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
              <select v-model="filterSucursal" style="border: none; outline: none; font-size: 0.8rem; background: transparent; color: var(--text-primary); cursor: pointer; padding-right: 5px;">
                <option value="" style="background-color: var(--bg-window); color: var(--text-primary);">Todas las Sucursales</option>
                <option v-for="suc in sucursales" :key="suc.id" :value="suc.id" style="background-color: var(--bg-window); color: var(--text-primary);">
                  {{ suc.sucursal }}
                </option>
              </select>
            </div>

            <!-- Buscador -->
            <div class="search-box" style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
              <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.9rem;"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Buscar por código, nombre..." 
                style="border: none; outline: none; font-size: 0.8rem; background: transparent; width: 150px; color: var(--text-primary);"
              />
            </div>

            <!-- Casilla de Ver Productos Desactivados -->
            <label style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; cursor: pointer; user-select: none; margin-left: 0.25rem; font-weight: 600;">
              <input type="checkbox" v-model="showTodosProductos" style="width: 14px; height: 14px; cursor: pointer;" />
              <span>Mostrar desactivados</span>
            </label>
          </div>
        </div>

        <!-- Tabla -->
        <div class="table-container" style="overflow-x: auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th @click="sortBy('codigo')" class="sortable">
                  Código 
                  <i v-if="sortKey === 'codigo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
                </th>
                <th @click="sortBy('nombre')" class="sortable">
                  Nombre 
                  <i v-if="sortKey === 'nombre'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
                </th>
                <th>Proveedor</th>
                <th @click="sortBy('stock')" class="sortable text-right">
                  {{ isSucursal ? 'KG Stock' : 'Stock' }} 
                  <i v-if="sortKey === 'stock'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
                </th>
                <th @click="sortBy('piezas_est')" class="sortable text-right" title="Piezas estimadas calculadas dividiendo Stock / Peso por Pieza">
                  Piezas Est.
                  <i v-if="sortKey === 'piezas_est'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
                </th>
                <th @click="sortBy('activo')" class="sortable text-center">
                  Estado 
                  <i v-if="sortKey === 'activo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
                </th>
                <th v-if="!isSucursal" @click="sortBy('updated_at')" class="sortable text-center">
                  Última Modificación 
                  <i v-if="sortKey === 'updated_at'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
                </th>
                <th @click="sortBy('cantidad_piezas')" class="sortable text-center">
                  Piezas 
                  <i v-if="sortKey === 'cantidad_piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="p in filteredAndSortedProductos" 
                :key="p.codigo" 
                class="clickable-row" 
                @click="openModal(p)" 
                style="cursor: pointer;"
              >
                <td><strong>{{ p.codigo }}</strong></td>
                <td>{{ p.nombre }}</td>
                <td>
                  <span v-if="p.Proveedor" style="font-weight: 500; color: var(--text-primary);">{{ p.Proveedor.nombre }}</span>
                  <span v-else style="color: var(--text-muted); font-size: 0.8rem;">-</span>
                </td>
                <td class="text-right">{{ p.stock }} {{ p.tipo_calculo_piezas !== 'unidad' ? 'kg' : 'ud' }}</td>
                <td class="text-right fw-bold" style="color: #2563eb;">{{ getPiezasEstimadas(p) }}</td>
                <td class="text-center">
                  <span :style="p.activo !== false ? { color: '#16a34a', fontWeight: 'bold' } : { color: '#dc2626', fontWeight: 'bold' }">
                    {{ p.activo !== false ? 'Activo' : 'Desactivado' }}
                  </span>
                </td>
                <td v-if="!isSucursal" class="text-center">{{ formatDateTime(p.updated_at) }}</td>
                <td class="text-center fw-bold">{{ calcularPiezasProducto(p.stock, p) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Estado de Carga -->
          <div v-if="loading" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Cargando productos...
          </div>

          <!-- Estado Vacío -->
          <div v-if="!loading && filteredAndSortedProductos.length === 0" class="empty-state">
            <i class="ph ph-package icon-xl"></i>
            No hay productos que coincidan con la búsqueda.
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA 2: VISTA DE DETALLE DEL PRODUCTO (Cuando showModal está activo) -->
    <div v-else class="animate-fade">
      <!-- Botón Superior "Volver a la Tabla de Productos" -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
        <button class="btn btn-secondary" @click="closeModal" style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; background: var(--bg-secondary); border: 2px solid var(--bevel-dark); color: var(--text-primary);">
          <i class="ph ph-arrow-left" style="font-size: 1.1rem; color: #2563eb;"></i> Volver a la Tabla de Productos
        </button>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <template v-if="isAdmin && !isViewingOnly && isEditing">
            <button v-if="form.activo !== false" type="button" class="btn btn-danger" @click="handleFormDeactivate">
              <i class="ph ph-trash me-1"></i> Desactivar Producto
            </button>
            <button v-else type="button" class="btn btn-success" @click="handleFormReactivate">
              <i class="ph ph-check me-1"></i> Activar Producto
            </button>
          </template>

          <template v-if="isAdmin && isViewingOnly">
            <button type="button" class="btn btn-secondary" @click="isViewingOnly = false" style="font-weight: 700;">
              <i class="ph ph-pencil-simple text-blue me-1"></i> Habilitar Edición
            </button>
          </template>
        </div>
      </div>

      <!-- Card Banner de Título de la Vista de Detalle -->
      <div class="card mb-3" style="background: var(--bg-secondary); border: 2px solid var(--bevel-dark); padding: 0.85rem 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: nowrap; gap: 0.5rem;">
          <div>
            <h3 style="margin: 0; font-weight: 800; font-size: 1.25rem; color: var(--text-primary);">
              <span v-if="isViewingOnly"><i class="ph ph-eye text-blue me-1"></i> {{ form.nombre }} - {{ form.codigo }}</span>
              <span v-else-if="isEditing"><i class="ph ph-pencil-simple text-blue me-1"></i> Editar Producto</span>
              <span v-else><i class="ph ph-plus-circle text-green me-1"></i> Nuevo Producto</span>
            </h3>
          </div>

          <div v-if="isEditing">
            <span :style="form.activo !== false ? { color: '#16a34a', fontWeight: 'bold' } : { color: '#dc2626', fontWeight: 'bold' }" style="font-size: 0.9rem;">
              ● {{ form.activo !== false ? 'Producto Activo' : 'Producto Desactivado' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Formulario de Campos de Detalle del Producto -->
      <form @submit.prevent="saveProducto">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1rem; align-items: stretch;">
          
          <!-- Columna Izquierda: Información del Producto y Pesos -->
          <div style="background: var(--bg-secondary); border: 2px solid var(--bevel-dark); border-radius: 0; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: var(--inset-shadow);">
            <h4 style="margin: 0; font-weight: bold; font-size: 0.9rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem; border-bottom: 2px solid var(--bevel-dark); padding-bottom: 0.25rem;"><i class="ph ph-package"></i> Datos y Pesos de Stock</h4>
            
            <div class="form-group">
              <label class="form-label">Nombre del Producto *</label>
              <input type="text" v-model="form.nombre" class="form-control" required :disabled="isViewingOnly || !isAdmin" />
            </div>

            <div class="form-group">
              <label class="form-label">Proveedor</label>
              <select v-model="form.proveedor_id" class="form-control" :disabled="isViewingOnly || !isAdmin">
                <option :value="null">-- Ninguno --</option>
                <option v-for="prov in proveedores" :key="prov.id" :value="prov.id">
                  {{ prov.nombre }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Producto Fraccionado Relacionado</label>
              <div style="position: relative; display: flex; align-items: center;">
                <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                <input 
                  type="text" 
                  v-model="fraccionadoSearchQuery" 
                  list="catalog-products-list-fraccionado" 
                  @input="handleFraccionadoProductInput" 
                  class="form-control" 
                  placeholder="Escribe código o nombre para buscar..." 
                  :disabled="isViewingOnly || !isAdmin"
                  style="padding-left: 2rem; height: 32px;"
                />
              </div>
              <datalist id="catalog-products-list-fraccionado">
                <option 
                  v-for="p in productos" 
                  :key="p.codigo" 
                  :value="p.codigo"
                  v-show="p.codigo !== form.codigo && p.activo !== false"
                >
                  {{ p.nombre }}
                </option>
              </datalist>
              
              <!-- Vista previa del producto seleccionado -->
              <div 
                v-if="selectedFraccionadoProduct" 
                class="selected-product-badge mt-2 animate-fade"
                style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); font-size: 0.8rem; color: var(--text-primary); border-radius: 0;"
              >
                <i class="ph ph-circle-wavy-check text-green" style="font-size: 1rem;"></i>
                <span>
                  Relacionado con: <strong>{{ selectedFraccionadoProduct.nombre }}</strong>
                </span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <div class="form-group">
                <label class="form-label">Código *</label>
                <input type="text" v-model="form.codigo" class="form-control" :disabled="isEditing || !isAdmin" required />
              </div>
              
              <div class="form-group">
                <label class="form-label">Código de barras</label>
                <input type="text" v-model="form.codigo_barra" class="form-control" placeholder="EAN / Código Barra" :disabled="isViewingOnly || !isAdmin" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <div class="form-group">
                <label class="form-label">Stock</label>
                <input type="number" :step="form.tipo_calculo_piezas !== 'unidad' ? '0.001' : '1'" v-model="form.stock" class="form-control" :disabled="isEditing || !isAdmin" />
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="form-label" style="font-weight: bold;">Tipo de Producto / Presentación</label>
              <select v-model="form.tipo_calculo_piezas" class="form-control" style="font-weight: bold;" :disabled="isViewingOnly || !isAdmin">
                <option value="normal">Pieza (Horma entera)</option>
                <option value="fraccionado">Fracción (Feteado / Bolsita)</option>
                <option value="unidad">Unidad (Bulto / Unidad)</option>
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <div v-if="form.tipo_calculo_piezas === 'normal' || !form.tipo_calculo_piezas" class="form-group">
                <label class="form-label">Peso x Pieza (kg) *</label>
                <input type="number" step="0.001" v-model="form.peso_pieza" class="form-control" :disabled="isViewingOnly || !isAdmin" required />
              </div>

              <div v-if="form.tipo_calculo_piezas === 'fraccionado'" class="form-group">
                <label class="form-label">Peso x Bolsita (kg) *</label>
                <input type="number" step="0.001" v-model="form.peso_fraccion" class="form-control" :disabled="isViewingOnly || !isAdmin" required />
              </div>

              <div v-if="form.tipo_calculo_piezas === 'unidad'" class="form-group">
                <label class="form-label">Peso x Unidad (kg) *</label>
                <input type="number" step="0.001" v-model="form.peso_unidad" class="form-control" :disabled="isViewingOnly || !isAdmin" required />
              </div>

              <div class="form-group">
                <label class="form-label">Piezas Calculadas (Auto)</label>
                <input type="number" :value="calcularPiezasProducto(form.stock, form)" class="form-control" disabled style="font-weight: bold; color: #16a34a;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <div class="form-group">
                <label class="form-label">Stock p/ Decomisar</label>
                <input type="number" :step="form.tipo_calculo_piezas !== 'unidad' ? '0.001' : '1'" v-model="form.kg_decomiso" class="form-control" :disabled="isViewingOnly || !isAdmin" />
              </div>
              
              <div class="form-group">
                <label class="form-label">Stock p/ Picada</label>
                <input type="number" :step="form.tipo_calculo_piezas !== 'unidad' ? '0.001' : '1'" v-model="form.kg_recorte" class="form-control" :disabled="isViewingOnly || !isAdmin" />
              </div>
            </div>

            <div style="border-top: 1px solid var(--bevel-dark); padding-top: 0.5rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; cursor: pointer; user-select: none; color: var(--text-primary);">
                <input type="checkbox" v-model="form.destacado" style="width: 15px; height: 15px; cursor: pointer;" :disabled="isViewingOnly || !isAdmin" />
                <span style="font-weight: bold; color: var(--accent-warning);"><i class="ph ph-star-fill"></i> Destacado</span>
              </label>
              <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; cursor: pointer; user-select: none; color: var(--text-primary);">
                <input type="checkbox" v-model="form.activo" style="width: 15px; height: 15px; cursor: pointer;" :disabled="isViewingOnly || !isAdmin" />
                <span style="font-weight: bold; color: var(--accent-success);"><i class="ph ph-check-square"></i> Activo (Habilitado)</span>
              </label>
            </div>
          </div>

          <!-- Columna Derecha: Sucursales Habilitadas para Pedido -->
          <div style="background: var(--bg-secondary); border: 2px solid var(--bevel-dark); border-radius: 0; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: var(--inset-shadow); height: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--bevel-dark); padding-bottom: 0.5rem;">
              <div>
                <h4 style="margin: 0; font-weight: bold; font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                  <i class="ph ph-storefront" style="color: #2563eb; font-size: 1.2rem;"></i> Sucursales Habilitadas para Pedido
                </h4>
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 2px 0 0 0;">
                  Selecciona las sucursales autorizadas a realizar pedidos de este producto.
                </p>
              </div>
              <div v-if="isAdmin && !isViewingOnly" style="display: flex; gap: 0.4rem;">
                <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;" @click="form.sucursalesHabilitadas = sucursales.map(s => s.id)">
                  Marcar Todas
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;" @click="form.sucursalesHabilitadas = []">
                  Desmarcar
                </button>
              </div>
            </div>

            <div class="table-container" style="flex-grow: 1; max-height: 460px; overflow-y: auto; border: 1px solid var(--bevel-dark); background: var(--bg-window); padding: 0.5rem;">
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <label 
                  v-for="suc in sucursales" 
                  :key="suc.id" 
                  style="display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem; border: 1px solid var(--bevel-light); border-radius: 0; background: var(--bg-primary); cursor: pointer; user-select: none; transition: background 0.15s;"
                  :style="form.sucursalesHabilitadas.includes(suc.id) ? { borderColor: '#2563eb', background: '#eff6ff' } : {}"
                >
                  <input 
                    type="checkbox" 
                    :value="suc.id" 
                    v-model="form.sucursalesHabilitadas" 
                    :disabled="isViewingOnly || !isAdmin"
                    style="width: 16px; height: 16px; cursor: pointer; accent-color: #2563eb;" 
                  />
                  <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">
                    {{ suc.sucursal }}
                  </span>
                  <span v-if="form.sucursalesHabilitadas.includes(suc.id)" class="badge badge-success ms-auto" style="font-size: 0.7rem; background: #dcfce7; color: #166534; padding: 0.15rem 0.4rem; border-radius: 4px;">
                    Habilitada
                  </span>
                  <span v-else class="badge badge-secondary ms-auto" style="font-size: 0.7rem; color: var(--text-muted);">
                    No disponible
                  </span>
                </label>

                <div v-if="!sucursales || sucursales.length === 0" style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-style: italic;">
                  No hay sucursales registradas en la base de datos.
                </div>
              </div>
            </div>
          </div>        
        </div>

        <!-- Barra Inferior de Navegación y Guardado -->
        <div class="card mt-3" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 2px solid var(--bevel-dark); padding: 0.85rem 1.25rem;">
          <button type="button" class="btn btn-secondary" @click="closeModal" style="display: flex; align-items: center; gap: 0.4rem; font-weight: 700; color: var(--text-primary);">
            <i class="ph ph-arrow-left" style="color: #2563eb;"></i> Volver a la Tabla de Productos
          </button>

          <button v-if="isAdmin && !isViewingOnly" type="submit" class="btn btn-primary btn-lg" style="font-weight: 800; padding: 0.6rem 1.4rem;" :disabled="saving">
            <i class="ph ph-spinner spinner" v-if="saving"></i>
            <i class="ph ph-floppy-disk me-1" v-else></i> Guardar Cambios
          </button>
        </div>
      </form>
    </div>

    <!-- Modal Confirmación Eliminar -->
    <Teleport to="body">
      <div v-if="itemToDelete" class="win-dialog-overlay" @mousedown.self="itemToDelete = null">
        <div class="win-dialog">
          <div class="win-dialog-titlebar">
            <span class="win-dialog-titlebar-text">Confirmar Desactivación</span>
            <button class="win-dialog-close" @click="itemToDelete = null"><i class="ph ph-x"></i></button>
          </div>
          <div class="win-dialog-body">
            <i class="ph ph-warning-circle win-dialog-icon text-red"></i>
            <p class="win-dialog-msg">
              ¿Estás seguro de que deseas desactivar el producto <strong>{{ itemToDelete.nombre }}</strong>?<br><br>El producto dejará de estar visible para pedidos y movimientos, pero podrás volver a activarlo en cualquier momento.
            </p>
          </div>
          <div class="win-dialog-footer">
            <button class="win-dialog-btn win-dialog-btn-ok" @click="deleteProducto">Sí</button>
            <button class="win-dialog-btn" @click="itemToDelete = null">No</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Planilla de Stock para Impresión (Sólo visible al imprimir) -->
    <div id="print-stock-sheet" class="only-print-layout" v-if="!showModal">
      <div class="print-sheet-header">
        <h2>PLANILLA DE CONTROL DE STOCK</h2>
        <p>Fecha de Impresión: {{ new Date().toLocaleString('es-ES') }}</p>
      </div>
      <table class="print-sheet-table">
        <thead>
          <tr>
            <th style="width: 120px; text-align: left;">CÓDIGO</th>
            <th style="text-align: left;">PRODUCTO</th>
            <th style="width: 100px; text-align: center;">PIEZAS</th>
            <th style="width: 150px; text-align: center;">STOCK</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredAndSortedProductos" :key="p.codigo">
            <td><strong>{{ p.codigo }}</strong></td>
            <td>{{ p.nombre }}</td>
            <td style="text-align: center;">{{ p.cantidad_piezas }}</td>
            <td class="empty-stock-cell"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { calcularPiezasProducto } from '../utils/calculoPiezas'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.rol?.toLowerCase() === 'admin')
const isSucursal = computed(() => authStore.user?.rol?.toLowerCase() === 'sucursal')

const productos = ref([])
const sucursales = ref([])
const proveedores = ref([])
const filterProveedor = ref('')

const fetchSucursales = async () => {
  try {
    const res = await fetch('/api/sucursales')
    if (res.ok) {
      sucursales.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching sucursales:', error)
  }
}

const fetchProveedores = async () => {
  try {
    const res = await fetch('/api/proveedores')
    if (res.ok) {
      proveedores.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching proveedores:', error)
  }
}

const formatDateTime = (dateVal) => {
  if (!dateVal) return '-'
  try {
    const d = new Date(dateVal)
    if (isNaN(d.getTime())) return '-'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch (e) {
    return '-'
  }
}
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const isEditing = ref(false)
const itemToDelete = ref(null)
const uploading = ref(false)
const uploadingStock = ref(false)
const syncingBlock = ref(false)
const fileInput = ref(null)
const stockFileInput = ref(null)

const runStockSync = async () => {
  syncingBlock.value = true
  showAlert('Iniciando sincronización de stock con BlockWMS...', 'info')
  try {
    let headers = { 'Content-Type': 'application/json' }
    const savedSession = localStorage.getItem('wms_session')
    if (savedSession) {
      try {
        const sess = JSON.parse(savedSession)
        if (sess.sessionId) {
          headers['X-WMS-Session-Id'] = sess.sessionId
          headers['X-WMS-Site-Id'] = sess.siteId || '194326'
          headers['X-WMS-Host'] = sess.host || 'http://192.168.10.2'
        }
      } catch (e) {}
    }

    const res = await fetch('/api/wms/sync-stock', { method: 'POST', headers })
    const data = await res.json()
    if (res.ok && data.ok) {
      const msg = data.message || data.mensaje || 'Sincronización de stock con BlockWMS completada exitosamente.'
      showAlert(msg, 'success')
      await fetchProductos()
    } else {
      throw new Error(data.error || 'Error en la sincronización con BlockWMS.')
    }
  } catch (err) {
    showAlert(`Error al sincronizar con BlockWMS: ${err.message}`, 'error')
  } finally {
    syncingBlock.value = false
  }
}

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

const searchQuery = ref('')
const showTodosProductos = ref(false)
const filterStatus = ref('todos')
const filterSucursal = ref('')
const sortKey = ref('nombre')
const sortOrder = ref(1) // 1 = asc, -1 = desc

const getPiezasEstimadasNum = (p) => {
  if (!p) return 0
  return calcularPiezasProducto(p.stock, p)
}

const getPiezasEstimadas = (p) => {
  if (!p) return 0
  return calcularPiezasProducto(p.stock, p)
}

// Filtro y ordenación reactiva de productos
const filteredAndSortedProductos = computed(() => {
  let result = [...productos.value]

  // Filtro por sucursal habilitada
  if (filterSucursal.value) {
    const sucursalId = parseInt(filterSucursal.value, 10)
    result = result.filter(p => {
      if (!p.SucursalPermisos || p.SucursalPermisos.length === 0) return false
      return p.SucursalPermisos.some(perm => perm.id_sucursal === sucursalId)
    })
  }

  // Filtro por proveedor
  if (filterProveedor.value) {
    const provId = parseInt(filterProveedor.value, 10)
    result = result.filter(p => p.proveedor_id === provId)
  }

  // Si la casilla "Mostrar desactivados" NO está marcada, mostrar solo productos activos
  if (!showTodosProductos.value) {
    result = result.filter(p => p.activo !== false)
  } else if (filterStatus.value === 'con_fraccionado') {
    result = result.filter(p => p.codigo_fraccionado && p.codigo_fraccionado.trim() !== '')
  }

  // Búsqueda
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => {
      const codigoMatch = p.codigo ? p.codigo.toString().toLowerCase().includes(query) : false
      const nombreMatch = p.nombre ? p.nombre.toLowerCase().includes(query) : false
      const eanMatch = p.codigo_barra ? p.codigo_barra.toString().toLowerCase().includes(query) : false
      const provMatch = p.Proveedor?.nombre ? p.Proveedor.nombre.toLowerCase().includes(query) : false
      return codigoMatch || nombreMatch || eanMatch || provMatch
    })
  }

  // Ordenación
  if (sortKey.value) {
    result.sort((a, b) => {
      if (sortKey.value === 'piezas_est') {
        const pzA = getPiezasEstimadasNum(a)
        const pzB = getPiezasEstimadasNum(b)
        return (pzA - pzB) * sortOrder.value
      }

      let valA = a[sortKey.value]
      let valB = b[sortKey.value]

      if (sortKey.value === 'updated_at') {
        const timeA = valA ? new Date(valA).getTime() : 0
        const timeB = valB ? new Date(valB).getTime() : 0
        return (timeA - timeB) * sortOrder.value
      }

      if (sortKey.value === 'activo') {
        const statusA = a.activo !== false ? 1 : 0
        const statusB = b.activo !== false ? 1 : 0
        return (statusA - statusB) * sortOrder.value
      }

      // Valores por defecto
      if (valA === undefined || valA === null) valA = ''
      if (valB === undefined || valB === null) valB = ''

      // Verificamos si son numéricos
      const isNumeric = !isNaN(parseFloat(valA)) && isFinite(valA) && !isNaN(parseFloat(valB)) && isFinite(valB)

      if (isNumeric) {
        return (parseFloat(valA) - parseFloat(valB)) * sortOrder.value
      } else {
        return valA.toString().localeCompare(valB.toString(), undefined, { numeric: true, sensitivity: 'base' }) * sortOrder.value
      }
    })
  }

  return result
})

const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value * -1
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

const defaultForm = {
  codigo: '',
  nombre: '',
  stock: 0,
  kilos_calculado: 0,
  peso_pieza: 0,
  peso_fraccion: 0,
  peso_unidad: 1.000,
  tipo_calculo_piezas: 'normal',
  cantidad_piezas: 0,
  vencimientos: '',
  vencimientosList: [],
  kg_fraccionados: 0,
  kg_decomiso: 0,
  kg_recorte: 0,
  destacado: false,
  codigo_barra: '',
  pesable: true,
  activo: true,
  codigo_fraccionado: '',
  sucursalesHabilitadas: [],
  proveedor_id: null
}

const form = ref({ ...defaultForm })
const fraccionadoSearchQuery = ref('')

const selectedFraccionadoProduct = computed(() => {
  if (!form.value.codigo_fraccionado) return null
  return productos.value.find(p => p.codigo === form.value.codigo_fraccionado) || null
})

const handleFraccionadoProductInput = () => {
  const code = fraccionadoSearchQuery.value.trim()
  const found = productos.value.find(p => p.codigo === code)
  if (found) {
    form.value.codigo_fraccionado = found.codigo
  } else {
    form.value.codigo_fraccionado = ''
  }
}

watch(() => form.value.tipo_calculo_piezas, (newVal) => {
  if (newVal === 'normal' || newVal === 'fraccionado') {
    form.value.pesable = true
  } else if (newVal === 'unidad') {
    form.value.pesable = false
  }
})

// reactive sum of pieces in the modal list
const formTotalPieces = computed(() => {
  if (!form.value.vencimientosList || !Array.isArray(form.value.vencimientosList)) return 0
  return form.value.vencimientosList.reduce((acc, curr) => acc + (parseInt(curr.piezas, 10) || 0), 0)
})

const agregarVencimientoRow = () => {
  if (!form.value.vencimientosList) {
    form.value.vencimientosList = []
  }
  form.value.vencimientosList.push({ vencimiento: '', piezas: 1 })
}

const eliminarVencimientoRow = (index) => {
  form.value.vencimientosList.splice(index, 1)
}

const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => { alert.value.show = false }, 3000)
}

const fetchProductos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      productos.value = await res.json()
    } else {
      showAlert('Error al cargar productos', 'error')
    }
  } catch (error) {
    console.error('Error fetching productos:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    loading.value = false
  }
}

const isViewingOnly = ref(false)

const openModal = async (producto = null) => {
  if (producto) {
    isViewingOnly.value = true
    isEditing.value = true
    form.value = { 
      ...defaultForm,
      ...producto,
      proveedor_id: producto.proveedor_id || null,
      vencimientosList: producto.vencimientosList ? [...producto.vencimientosList] : [],
      sucursalesHabilitadas: []
    }
    fraccionadoSearchQuery.value = producto.codigo_fraccionado || ''
    
    try {
      const res = await fetch(`/api/productos/${producto.codigo}/sucursales`)
      if (res.ok) {
        form.value.sucursalesHabilitadas = await res.json()
      }
    } catch (e) {
      console.error('Error fetching enabled sucursales:', e)
    }
  } else {
    isViewingOnly.value = false
    isEditing.value = false
    form.value = { 
      ...defaultForm, 
      vencimientosList: [],
      sucursalesHabilitadas: sucursales.value.map(s => s.id)
    }
    fraccionadoSearchQuery.value = ''
  }
  showModal.value = true
  window.scrollTo(0, 0)
}

const closeModal = () => {
  showModal.value = false
  form.value = { ...defaultForm, vencimientosList: [], sucursalesHabilitadas: [] }
  fraccionadoSearchQuery.value = ''
  window.scrollTo(0, 0)
}

const saveProducto = async () => {
  saving.value = true
  
  // Set calculated pieces count
  form.value.cantidad_piezas = formTotalPieces.value
  
  const url = isEditing.value ? `/api/productos/${form.value.codigo}` : '/api/productos'
  const method = isEditing.value ? 'PUT' : 'POST'
  
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    
    if (res.ok) {
      showAlert(isEditing.value ? 'Producto actualizado' : 'Producto creado')
      closeModal()
      fetchProductos()
    } else {
      const errData = await res.json().catch(() => ({}))
      showAlert(errData.error || 'Error al guardar producto', 'error')
    }
  } catch (error) {
    console.error('Error saving:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (prod) => {
  itemToDelete.value = prod
}

const deleteProducto = async () => {
  if (!itemToDelete.value) return
  
  try {
    const res = await fetch(`/api/productos/${itemToDelete.value.codigo}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      showAlert('Producto desactivado exitosamente')
      fetchProductos()
    } else {
      showAlert('Error al desactivar el producto', 'error')
    }
  } catch (error) {
    console.error('Error deleting:', error)
    showAlert('Error de conexión', 'error')
  } finally {
    itemToDelete.value = null
  }
}

const reactivarProducto = async (prod) => {
  try {
    const res = await fetch(`/api/productos/${prod.codigo}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prod, activo: true })
    })
    if (res.ok) {
      showAlert('Producto reactivado exitosamente')
      fetchProductos()
    } else {
      showAlert('Error al reactivar el producto', 'error')
    }
  } catch (error) {
    console.error('Error reactivating:', error)
    showAlert('Error de conexión', 'error')
  }
}

const handleFormDeactivate = () => {
  closeModal()
  confirmDelete(form.value)
}

const handleFormReactivate = async () => {
  await reactivarProducto(form.value)
  closeModal()
}

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploading.value = true
  const formData = new FormData()
  formData.append("file", file)

  try {
    const res = await fetch("/api/productos/upload", {
      method: "POST",
      body: formData // No enviar headers como Content-Type, el navegador lo pone solo
    })
    
    const result = await res.json()
    if (res.ok) {
      showAlert(`Subida exitosa: ${result.mensaje || 'Productos cargados'}`)
      fetchProductos()
    } else {
      showAlert(`Error: ${result.error || 'No se pudo procesar el archivo'}`, 'error')
    }
  } catch (error) {
    console.error("Error subiendo el archivo:", error)
    showAlert('Error de conexión al subir archivo', 'error')
  } finally {
    uploading.value = false
    // Limpiar el input para permitir subir el mismo archivo de nuevo
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const triggerStockFileInput = () => {
  if (stockFileInput.value) {
    stockFileInput.value.click()
  }
}

const handleStockFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploadingStock.value = true
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch('/api/productos/cargar-stock', {
      method: 'POST',
      body: formData
    })

    const result = await res.json()
    if (res.ok) {
      showAlert(`${result.mensaje}`)
      fetchProductos()
    } else {
      showAlert(`Error: ${result.error || 'No se pudo procesar el archivo'}`, 'error')
    }
  } catch (error) {
    console.error('Error subiendo stock:', error)
    showAlert('Error de conexión al subir archivo de stock', 'error')
  } finally {
    uploadingStock.value = false
    if (stockFileInput.value) {
      stockFileInput.value.value = ''
    }
  }
}

const printStockSheet = () => {
  window.print()
}

const exportToExcel = () => {
  if (filteredAndSortedProductos.value.length === 0) return

  let csvContent = '\uFEFF' // BOM para Excel
  csvContent += 'Código;Producto;Piezas;Fecha de Vencimiento\n'

  filteredAndSortedProductos.value.forEach(p => {
    if (p.vencimientosList && p.vencimientosList.length > 0) {
      p.vencimientosList.forEach(v => {
        // Formatear fecha del vencimiento a DD/MM/YYYY
        const dateParts = v.vencimiento.split('-')
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : v.vencimiento
        csvContent += `"${p.codigo}";"${p.nombre}";"${parseInt(v.piezas, 10) || 0}";"${formattedDate}"\n`
      })
    } else {
      // Si el producto no tiene lotes de vencimiento registrados, lo exportamos con piezas = 0 y sin vencimiento
      csvContent += `"${p.codigo}";"${p.nombre}";"${parseInt(p.cantidad_piezas, 10) || 0}";"Sin vencimiento"\n`
    }
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  
  const dateStr = new Date().toISOString().split('T')[0]
  link.setAttribute('download', `Vencimientos_Productos_${dateStr}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showAlert('Planilla de vencimientos exportada correctamente')
}

const sucursalNameById = (id) => {
  const found = sucursales.value.find(s => s.id === parseInt(id, 10))
  return found ? found.sucursal : ''
}

const exportTableToExcel = () => {
  if (filteredAndSortedProductos.value.length === 0) return

  let csvContent = '\uFEFF' // BOM para Excel
  
  if (!isSucursal.value) {
    csvContent += 'Código;Nombre;Stock;Unidad;Piezas Est.;Piezas;Última Modificación\n'
  } else {
    csvContent += 'Código;Nombre;Stock;Unidad;Piezas Est.;Piezas\n'
  }

  filteredAndSortedProductos.value.forEach(p => {
    const stockVal = p.stock || 0
    const unidad = p.tipo_calculo_piezas !== 'unidad' ? 'kg' : 'ud'
    const piezasEst = getPiezasEstimadas(p)
    const piezas = p.cantidad_piezas || 0
    
    if (!isSucursal.value) {
      csvContent += `"${p.codigo}";"${p.nombre}";"${stockVal}";"${unidad}";"${piezasEst}";"${piezas}";"${formatDateTime(p.updated_at)}"\n`
    } else {
      csvContent += `"${p.codigo}";"${p.nombre}";"${stockVal}";"${unidad}";"${piezasEst}";"${piezas}"\n`
    }
  })

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  
  let filterSuffix = ''
  if (filterSucursal.value) {
    const foundSuc = sucursalNameById(filterSucursal.value)
    if (foundSuc) {
      filterSuffix = `_${foundSuc.replace(/\s+/g, '_')}`
    }
  }
  
  const dateStr = new Date().toISOString().split('T')[0]
  link.setAttribute('download', `Catalogo_Productos${filterSuffix}_${dateStr}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showAlert('Tabla de productos exportada correctamente')
}

onMounted(() => {
  fetchProductos()
  fetchSucursales()
  fetchProveedores()
})
</script>

<style scoped>
/* Las clases de estilos globales de main.css se encargan del layout básico */
th.sortable {
  cursor: pointer;
  user-select: none;
}
th.sortable:hover {
  background-color: var(--accent-primary-hover);
}
th i {
  margin-left: 0.25rem;
  font-size: 0.8rem;
  vertical-align: middle;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.clickable-row:hover {
  background-color: rgba(37, 99, 235, 0.08) !important;
}

/* ---- MEDIA QUERIES PARA VISTA MÓVIL EN PRODUCTOS ---- */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 0.75rem !important;
  }

  .page-title {
    font-size: 1.35rem !important;
  }

  .page-description {
    font-size: 0.9rem !important;
  }

  .header-actions {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.4rem !important;
    margin-top: 0.5rem !important;
  }

  .header-actions .btn {
    width: 100% !important;
    justify-content: center !important;
    font-size: 0.82rem !important;
    padding: 0.45rem 0.4rem !important;
    text-align: center !important;
    white-space: nowrap !important;
  }

  /* Si hay un número impar de botones, el último ocupa ambas columnas */
  .header-actions .btn:last-child:nth-child(odd) {
    grid-column: span 2 !important;
  }

  .responsive-card-header {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 0.75rem !important;
  }

  .header-filter-bar {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
  }

  .header-filter-bar > div {
    width: 100% !important;
    height: 34px !important;
  }

  .header-filter-bar select,
  .header-filter-bar input[type="text"] {
    width: 100% !important;
    font-size: 0.88rem !important;
  }

  .header-filter-bar label {
    font-size: 0.88rem !important;
    margin-top: 0.25rem !important;
  }

  /* EN MÓVIL: MOSTRAR SOLO COLUMNAS 1 (CÓDIGO) Y 2 (NOMBRE) */
  .data-table th:nth-child(n+3),
  .data-table td:nth-child(n+3) {
    display: none !important;
  }

  .data-table th:nth-child(1),
  .data-table td:nth-child(1) {
    width: 30% !important;
    font-size: 0.95rem !important;
  }

  .data-table th:nth-child(2),
  .data-table td:nth-child(2) {
    width: 70% !important;
    font-size: 0.95rem !important;
    font-weight: 700 !important;
  }

  .data-table td {
    padding: 0.75rem 0.6rem !important;
    font-size: 0.95rem !important;
  }
}

.only-print-layout {
  display: none !important;
}

.print-sheet-header {
  text-align: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid #000000;
  padding-bottom: 0.75rem;
}

.print-sheet-header h2 {
  font-size: 1.6rem;
  font-weight: 800;
  margin: 0 0 0.25rem 0;
  color: #000000;
  letter-spacing: 0.05em;
}

.print-sheet-header p {
  font-size: 0.85rem;
  margin: 0;
  color: #555555;
}

.print-sheet-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.print-sheet-table th {
  background-color: #f2f2f2 !important;
  color: #000000 !important;
  border: 1px solid #000000 !important;
  padding: 8px 10px !important;
  font-weight: bold;
  font-size: 0.85rem;
  text-transform: uppercase;
  text-shadow: none !important;
}

.print-sheet-table td {
  border: 1px solid #000000 !important;
  padding: 8px 10px !important;
  font-size: 0.85rem;
  background-color: transparent !important;
}

.empty-stock-cell {
  background-color: #ffffff !important;
  min-width: 150px;
}
</style>

<style>
/* ---- ESTILOS GLOBALES DE IMPRESIÓN (SIN SCOPE PARA OVERRIDE DE LAYOUTS PADRE) ---- */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Anular scroll y alturas fijas en toda la jerarquía de layouts globales */
  html, body, #app, 
  .layout-wrapper, 
  .main-content, 
  .page-content,
  .page-container {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    position: static !important;
    display: block !important;
  }
  
  /* Ocultar barra lateral, cabeceras, botones de acción y diálogos de toda la app */
  .sidebar,
  .sidebar-header,
  .sidebar-nav,
  .sidebar-footer,
  .close-btn,
  .user-profile,
  header,
  .page-header,
  .card,
  .tabs,
  .alert-box,
  .modal-overlay,
  .win-dialog-overlay {
    display: none !important;
    visibility: hidden !important;
  }

  .page-container {
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
  }
  
  /* Forzar visibilidad de la planilla de impresión */
  .only-print-layout {
    display: block !important;
    visibility: visible !important;
    width: 100% !important;
    position: static !important; /* Estático para fluir en múltiples páginas naturales */
    color: #000000 !important;
    background: #ffffff !important;
    padding: 10px 0 !important;
    z-index: 9999 !important;
  }

  /* Ocultar contenido interactivo de la página */
  .page-container > div:not(.only-print-layout) {
    display: none !important;
  }
}
</style>
