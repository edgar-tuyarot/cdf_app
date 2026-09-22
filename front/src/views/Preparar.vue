<template>
  <div class="page-container animate-fade">
    <!-- Encabezado Dinámico de la Vista (Reemplaza 'Preparar' por la sucursal cuando un pedido está seleccionado) -->
    <div class="page-header mb-3">
      <div class="header-content">
        <h2 class="page-title" style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0;">
          {{ selectedPedido && showMobileDetail ? selectedPedido.sucursal : 'Pedidos' }}
        </h2>
        <p class="page-description" style="font-size: 0.88rem; margin-top: 0.2rem; color: var(--text-muted); font-weight: 600;">
          <template v-if="selectedPedido && showMobileDetail">
            Fecha del pedido: {{ formatDate(selectedPedido.fecha) }}
          </template>

        </p>
      </div>

      <div class="header-actions" style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.4rem;">
        <template v-if="selectedPedido && showMobileDetail">
          <button 
            class="btn btn-secondary" 
            style="padding: 0.4rem 0.85rem; font-weight: 700; font-size: 0.84rem; display: flex; align-items: center; gap: 0.35rem;"
            @click="showMobileDetail = false; selectedPedido = null"
          >
            <i class="ph ph-arrow-left"></i> 
          </button>
          <button 
            class="btn btn-primary" 
            style="padding: 0.4rem 1.1rem; font-weight: 800; font-size: 0.88rem; background-color: #16a34a; border-color: #15803d; display: flex; align-items: center; gap: 0.35rem;"
            @click="confirmarPedido"
            :disabled="confirming"
          >
            <i class="ph ph-spinner spinner" v-if="confirming"></i>
            <i class="ph ph-check-circle" v-else></i>
          </button>
        </template>
        <template v-else>
          <button class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.25rem;" @click="fetchPedidos" :disabled="loading">
            <i class="ph ph-spinner spinner" v-if="loading"></i>
            <i class="ph ph-arrows-clockwise" v-else></i> 
          </button>
        </template>
      </div>
    </div>

    <!-- Mensajes de Alerta -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      {{ alert.message }}
    </div>

    <!-- Master-Detail Layout -->
    <div class="master-detail-container" style="display: flex; gap: 1.5rem; width: 100%; align-items: flex-start;">
      
      <!-- COLUMNA MASTER: Lista de Pedidos Pendientes -->
      <div 
        class="card master-column" 
        :class="{ 'hidden-mobile': selectedPedido && showMobileDetail }"
        style="flex: 1 1 35%; max-width: 450px; display: flex; flex-direction: column; overflow: hidden;"
      >
        <div class="card-header" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span class="card-title" style="margin: 0; font-weight: bold;">Pedidos por Preparar ({{ pendingPedidos.length }})</span>
          </div>
          <!-- Buscador de pedidos -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.25rem 0.5rem; box-shadow: var(--inset-shadow); border-radius: 0; border: 1px solid var(--bevel-light); width: 100%;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.85rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por código, sucursal..." 
              style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 100%; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle" style="font-size: 1rem;"></i>
            </button>
          </div>
        </div>

        <!-- Lista con scroll -->
        <div class="list-container" style="max-height: calc(100vh - 280px); overflow-y: auto; padding: 0.5rem;">
          <div v-if="loading" style="display: flex; justify-content: center; align-items: center; padding: 2rem; flex-direction: column; gap: 0.5rem; color: var(--text-secondary);">
            <i class="ph ph-spinner spinner" style="font-size: 1.5rem;"></i>
            <span>Cargando pedidos...</span>
          </div>
          <div v-else-if="filteredPendingPedidos.length === 0" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-size: 0.85rem;">
            <i class="ph ph-shopping-cart" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
            <span>No hay pedidos pendientes o en preparación.</span>
          </div>
          <div v-else style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div 
              v-for="p in filteredPendingPedidos" 
              :key="p.id"
              class="pedido-item"
              :class="{ 'selected': selectedPedido?.id === p.id }"
              @click="selectPedido(p)"
              style="padding: 0.75rem; border-radius: 0; border: 1px solid var(--bevel-dark); background: var(--bg-secondary); cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 0.35rem;"
            >
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.9rem; color: var(--text-primary);">{{ p.codigo }}</strong>
                <span class="badge" :class="p.estado === 'Preparando' ? 'badge-primary' : 'badge-warning'" style="font-size: 0.68rem; padding: 2px 6px; border-radius: 0;">{{ p.estado }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-secondary);">
                <span>Sucursal: <strong style="color: var(--text-primary);">{{ p.sucursal || '-' }}</strong></span>
                <span>{{ formatDate(p.fecha) }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; border-top: 1px dotted var(--bevel-light); padding-top: 0.35rem; margin-top: 0.15rem;">
                <span style="color: var(--text-secondary);">Ítems: <strong style="color: var(--text-primary);">{{ p.items ? p.items.length : 0 }}</strong></span>
                
                <!-- Barra de Progreso -->
                <div style="display: flex; flex-direction: column; gap: 0.15rem; width: 110px; align-items: flex-end;">
                  <div style="display: flex; justify-content: space-between; width: 100%; font-size: 0.68rem; font-weight: bold; color: var(--text-secondary); line-height: 1;">
                    <span>Listo:</span>
                    <span :style="{ color: getPedidoProgreso(p) === 100 ? 'var(--accent-success)' : 'var(--text-primary)' }">
                      {{ getPedidoProgreso(p) }}%
                    </span>
                  </div>
                  <div style="width: 100%; height: 5px; background-color: var(--bevel-dark); border-radius: 0; overflow: hidden; border: 1px solid var(--bevel-light);">
                    <div 
                      :style="{ 
                        width: getPedidoProgreso(p) + '%', 
                        backgroundColor: getPedidoProgreso(p) === 100 ? 'var(--accent-success)' : 'var(--accent-primary)' 
                      }" 
                      style="height: 100%; transition: width 0.3s ease; border-radius: 0;"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- COLUMNA DETAIL: Tabla de Productos Ubicada Directamente sobre el Contenedor Principal -->
      <div 
        class="detail-column"
        :class="{ 'hidden-mobile': !selectedPedido || !showMobileDetail }"
        style="flex: 1 1 65%; display: flex; flex-direction: column; width: 100%;"
      >
        <div v-if="selectedPedido" style="display: flex; flex-direction: column; width: 100%;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: var(--bg-secondary); border: 1.5px solid var(--bevel-dark); border-bottom: none;">
            <span style="font-weight: 800; font-size: 0.9rem; color: var(--text-primary);">
              Pedido Nº {{ selectedPedido.codigo }} - {{ selectedPedido.sucursal }}
            </span>
            <button 
              class="btn btn-secondary" 
              style="padding: 3px 10px; font-weight: 800; font-size: 0.82rem; display: flex; align-items: center; gap: 0.35rem; background: var(--bg-window);"
              @click="openBarcodesModalForPedido(selectedPedido)"
              title="Ver Códigos de Barra de los productos de este pedido"
            >
              <i class="ph ph-barcode" style="font-size: 1.1rem; color: #0284c7;"></i> Códigos de Barra
            </button>
          </div>

          <!-- Tabla Directa sin Contenedores de Tarjetas Anidadas -->
          <div class="table-container" style="border: 1.5px solid var(--bevel-dark); border-radius: 0; background: var(--bg-window); width: 100%;">
            <div v-if="loadingDetail" style="display: flex; justify-content: center; align-items: center; padding: 4rem; flex-direction: column; gap: 0.5rem; color: var(--text-secondary);">
              <i class="ph ph-spinner spinner" style="font-size: 1.8rem;"></i>
              <span>Cargando productos del pedido...</span>
            </div>
            
            <table v-else style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 75px; text-align: center;">Cod</th>
                  <th style="text-align: left;">Producto</th>
                  <th style="width: 110px; text-align: right;">Pedido</th>
                  <th style="width: 110px; text-align: right;">Enviado</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="item in selectedPedido.items" 
                  :key="item.codigo_producto"
                  @click="openItemModal(item)"
                  style="border-bottom: 1.5px solid var(--bevel-dark); cursor: pointer; transition: background-color 0.15s ease;"
                  :class="['order-row', getItemRowClass(item)]"
                  title="Presione para cargar la cantidad enviada"
                >
                  <td style="padding: 0.5rem; font-family: monospace; font-weight: bold; color: var(--text-primary); text-align: center;">
                    {{ item.codigo_producto }}
                  </td>
                  <td style="padding: 0.5rem; color: var(--text-primary); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="item.Producto?.nombre">
                    {{ formatNombreProducto(item.Producto?.nombre || item.codigo_producto) }}
                  </td>
                  <!-- Solicitado (Texto con azul para pz y amarillo/ámbar para fracc, sin badges) -->
                  <td style="padding: 0.5rem; text-align: right; font-weight: 800;">
                    <span v-if="item.pieza > 0" style="color: #2563eb;">
                      {{ item.pieza }} P
                    </span>
                    <span v-if="item.pieza > 0 && parseFloat(item.fraccion || 0) > 0" style="color: var(--text-muted); margin: 0 2px;"> y </span>
                    <span v-if="parseFloat(item.fraccion || 0) > 0" style="color: #d97706;">
                      {{ Math.round(parseFloat(item.fraccion)) }} F
                    </span>
                    <span v-if="!(item.pieza > 0) && !(parseFloat(item.fraccion || 0) > 0) && parseFloat(item.peso || 0) > 0" style="color: var(--text-secondary);">
                      {{ parseFloat(item.peso).toFixed(3) }} kg
                    </span>
                    <span v-if="!(item.pieza > 0) && !(parseFloat(item.fraccion || 0) > 0) && !(parseFloat(item.peso || 0) > 0)" style="color: var(--text-muted);">
                      -
                    </span>
                  </td>
                  <!-- Enviado (Kilos cargados) -->
                  <td style="padding: 0.5rem; text-align: right; font-weight: 800;" :class="getEnviadoClass(item.codigo_producto)">
                    {{ getEnviadoDisplay(item.codigo_producto) }}
                  </td>
                </tr>

                <tr v-if="!selectedPedido.items || selectedPedido.items.length === 0">
                  <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    Este pedido no contiene productos.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- Placeholder cuando no hay ningún pedido seleccionado -->
        <div v-else style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; text-align: center; color: var(--text-muted); background: var(--bg-window); border: 1px solid var(--bevel-dark);">
          <i class="ph ph-package" style="font-size: 3.5rem; margin-bottom: 1rem; opacity: 0.35; color: var(--text-primary);"></i>
          <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-weight: bold;">Ningún Pedido Seleccionado</h3>
          <p style="margin: 0; font-size: 0.85rem; max-width: 320px; line-height: 1.4;">
            Selecciona un pedido pendiente de la lista para ver sus productos y comenzar la preparación.
          </p>
        </div>
      </div>

    </div>
  </div>

  <!-- MODAL POPUP VISTA ADICIONAL PARA CARGAR CANTIDAD DE KILOS A ENVIAR -->
  <Teleport to="body">
    <div v-if="activeModalItem" class="win-dialog-overlay" @mousedown.self="activeModalItem = null">
      <div class="win-dialog" style="max-width: 460px; width: 98%;">
        
        <!-- Header del Modal -->
        <div class="win-dialog-titlebar" style="display: flex; justify-content: space-between; align-items: center; background: #15803d; color: white; padding: 0.75rem 1rem;">
          <span class="win-dialog-titlebar-text" style="font-weight: bold; font-size: 0.95rem;">
            Cargar Cantidad a Enviar
          </span>
          <button class="win-dialog-close" @click="activeModalItem = null" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <!-- Cuerpo del Modal -->
        <div class="win-dialog-body" style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; background: var(--bg-secondary);">
          
          <!-- Detalle del Producto -->
          <div style="background: var(--bg-window); padding: 0.85rem; border: 1.5px solid var(--bevel-dark);">
            <span style="font-size: 0.72rem; color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 700; margin-bottom: 0.2rem;">Producto</span>
            <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-primary); line-height: 1.35;">
              [{{ activeModalItem.codigo_producto }}] {{ activeModalItem.Producto?.nombre || activeModalItem.codigo_producto }}
            </h4>
          </div>

          <!-- Label Informativo de la Cantidad Solicitada por el Cliente -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f2f2f2; padding: 0.75rem 0.9rem; border: 1.5px solid #000;">
            <span style="font-size: 0.85rem; font-weight: 700; color: #000;">Pedido:</span>
            <div style="font-size: 1.05rem; font-weight: 800; display: flex; gap: 0.35rem; align-items: center;">
              <span v-if="activeModalItem.pieza > 0" style="color: #000;">
                {{ activeModalItem.pieza }} pz
              </span>
              <span v-if="activeModalItem.pieza > 0 && parseFloat(activeModalItem.fraccion || 0) > 0" style="color: #64748b;">/</span>
              <span v-if="parseFloat(activeModalItem.fraccion || 0) > 0" style="color: #d97706;">
                {{ Math.round(parseFloat(activeModalItem.fraccion)) }} fracc
              </span>
              <span v-if="!(activeModalItem.pieza > 0) && !(parseFloat(activeModalItem.fraccion || 0) > 0) && parseFloat(activeModalItem.peso || 0) > 0" style="color: #0284c7;">
                {{ parseFloat(activeModalItem.peso).toFixed(3) }} kg
              </span>
            </div>
          </div>

          <!-- Único Input Editable: Kilos a enviar -->
          <div v-if="!itemForm.sin_stock && !itemForm.no_envia" class="form-group" style="margin-bottom: 0;">
            <label style="font-size: 0.85rem; font-weight: 800; display: block; margin-bottom: 0.35rem; color: var(--text-primary); text-transform: uppercase;">
              Se envia
            </label>
            <div style="position: relative; display: flex; align-items: center;">
              <input 
                type="number" 
                step="0.001" 
                min="0" 
                v-model.number="itemForm.kilos" 
                class="form-control" 
                placeholder="Ej: 12.500" 
                style="height: 46px; font-size: 1.2rem; font-weight: 800; padding-right: 3.2rem; text-align: right; border: 2px solid var(--bevel-dark);"
                
              />
              <span style="position: absolute; right: 0.85rem; font-weight: 800; color: var(--text-muted); font-size: 0.95rem; pointer-events: none;">kg</span>
            </div>
          </div>

          <!-- Checkboxes de Excepción S/S y N/E -->
          <div style="display: flex; gap: 0.75rem; align-items: center; margin-top: 0.25rem;">
            <label class="mobile-checkbox-label" style="flex: 1; justify-content: center; padding: 0.6rem;">
              <input type="checkbox" v-model="itemForm.sin_stock" @change="handleSinStockChange" />
              <strong>S/S (Sin Stock)</strong>
            </label>
            <label class="mobile-checkbox-label" style="flex: 1; justify-content: center; padding: 0.6rem;">
              <input type="checkbox" v-model="itemForm.no_envia" @change="handleNoEnviaChange" />
              <strong>N/E (No Envía)</strong>
            </label>
          </div>

          <!-- Opción de Sustituir / Reemplazar Producto -->
          <div style="border-top: 1px dashed var(--bevel-dark); padding-top: 0.75rem; margin-top: 0.25rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 800; cursor: pointer; color: #d97706;">
              <input type="checkbox" v-model="isReemplazo" style="width: 16px; height: 16px; accent-color: #d97706;" />
              <span><i class="ph ph-arrows-left-right"></i> Reemplazar por otro producto del catálogo</span>
            </label>

            <!-- Campo de búsqueda del producto sustituto -->
            <div v-if="isReemplazo" class="mt-2 animate-fade" style="display: flex; flex-direction: column; gap: 0.35rem;">
              <label style="font-size: 0.75rem; font-weight: bold; color: var(--text-secondary);">
                Seleccionar Producto Sustituto *
              </label>
              <div style="position: relative; display: flex; align-items: center;">
                <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted);"></i>
                <input 
                  type="text" 
                  v-model="replacementSearchQuery" 
                  list="catalog-replacement-list" 
                  @input="handleReplacementProductInput" 
                  class="form-control" 
                  placeholder="Escribe código o nombre para buscar..." 
                  style="padding-left: 2rem; height: 38px; font-weight: 700;"
                />
              </div>
              <datalist id="catalog-replacement-list">
                <option 
                  v-for="p in catalogProducts" 
                  :key="p.codigo" 
                  :value="p.codigo"
                  v-show="p.codigo !== activeModalItem.codigo_producto"
                >
                  {{ p.nombre }}
                </option>
              </datalist>

              <div v-if="selectedReplacementCode" style="font-size: 0.8rem; background: #eff6ff; color: #1d4ed8; padding: 0.4rem 0.6rem; font-weight: 700; border-left: 3px solid #2563eb; margin-top: 0.2rem;">
                ✔ Sustituto seleccionado: <strong>{{ selectedReplacementCode }}</strong> - {{ catalogProducts.find(p => p.codigo === selectedReplacementCode)?.nombre }}
              </div>
            </div>
          </div>

        </div>

        <!-- Footer del Modal -->
        <div class="win-dialog-footer" style="padding: 0.85rem 1.25rem; background: var(--bg-window); border-top: 1px solid var(--bevel-dark); display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button class="btn btn-secondary" @click="activeModalItem = null" style="height: 40px; padding: 0 1.25rem; font-weight: 700;">
            Cancelar
          </button>
          <button 
            class="btn btn-primary" 
            style="height: 40px; padding: 0 1.5rem; font-weight: 800; background-color: #16a34a; border-color: #15803d;" 
            @click="grabarItem(activeModalItem)" 
            :disabled="savingItem"
          >
            <i class="ph ph-spinner spinner" v-if="savingItem"></i>
            <i class="ph ph-floppy-disk" v-else></i> Grabar
          </button>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- MODAL XL DE CÓDIGOS DE BARRA PARA PEDIDOS -->
  <Teleport to="body">
    <div v-if="showBarcodeModal" class="win-dialog-overlay" style="display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div class="win-dialog" style="width: 850px; max-width: 95vw; background: var(--bg-window); border: 3px solid var(--bevel-dark); box-shadow: var(--window-shadow);">
        
        <!-- Header del Modal -->
        <div class="win-dialog-header" style="background: #0b5394; color: white; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="ph ph-barcode" style="font-size: 1.4rem;"></i>
            Código de Barras - Pedido Nº {{ selectedPedidoForBarcodes?.codigo || selectedPedidoForBarcodes?.id }}
          </span>
          <button @click="showBarcodeModal = false" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.3rem; display: flex; align-items: center;">
            <i class="ph ph-x"></i>
          </button>
        </div>

        <!-- Subheader Info + Paginador -->
        <div style="padding: 0.75rem 1.25rem; background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div style="font-size: 0.88rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
            <div>
              <strong>Sucursal:</strong> {{ selectedPedidoForBarcodes?.sucursal || '-' }}
              <span v-if="selectedPedidoForBarcodes?.fecha" style="margin-left: 0.75rem;">
                <strong>Fecha:</strong> {{ formatDate(selectedPedidoForBarcodes.fecha) }}
              </span>
            </div>
            <span style="font-size: 0.76rem; color: var(--text-secondary); background: var(--bg-window); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--bevel-dark); font-weight: bold;">
              <i class="ph ph-keyboard" style="margin-right: 3px;"></i> Teclas ← / → para navegar
            </span>
          </div>
          
          <!-- Contador y Controles de Navegación -->
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <button 
              class="win-dialog-btn" 
              @click="prevBarcode" 
              :disabled="barcodeItems.length <= 1"
              style="padding: 3px 10px; font-weight: 800; font-size: 0.85rem;"
              title="Ver producto anterior (Tecla Flecha Izquierda)"
            >
              <i class="ph ph-caret-left"></i> Anterior
            </button>

            <span style="font-weight: 900; font-size: 0.9rem; color: #0284c7; background: #e0f2fe; padding: 3px 12px; border-radius: 12px; border: 1px solid #bae6fd;">
              {{ currentBarcodeIndex + 1 }} de {{ barcodeItems.length }}
            </span>

            <button 
              class="win-dialog-btn" 
              @click="nextBarcode" 
              :disabled="barcodeItems.length <= 1"
              style="padding: 3px 10px; font-weight: 800; font-size: 0.85rem;"
              title="Ver producto siguiente (Tecla Flecha Derecha)"
            >
              Siguiente <i class="ph ph-caret-right"></i>
            </button>
          </div>
        </div>

        <!-- Cuerpo del Modal (Tarjeta XL Clickeable) -->
        <div style="padding: 1.5rem; text-align: center;">
          <div 
            v-if="currentBarcodeItem" 
            @click="nextBarcode"
            style="background: #ffffff; border: 3px solid #0284c7; border-radius: 10px; padding: 1.75rem 1.5rem; cursor: pointer; user-select: none; transition: transform 0.1s, box-shadow 0.1s; box-shadow: 0 4px 12px rgba(0,0,0,0.1); position: relative;"
            title="¡Haz clic aquí para avanzar al siguiente producto!"
          >
            <!-- Indicator Badge -->
            <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #0284c7; color: white; padding: 2px 14px; border-radius: 12px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
              <i class="ph ph-hand-pointing" style="margin-right: 4px;"></i> HAZ CLIC PARA VER EL SIGUIENTE
            </div>

            <!-- Código del Producto (Code 128) -->
            <div style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
              <div style="font-size: 1.15rem; font-weight: 900; color: #475569; letter-spacing: 0.05em; text-transform: uppercase;">
                CÓDIGO PRODUCTO: <span style="color: #0284c7; font-family: monospace; font-size: 1.4rem;">{{ currentBarcodeItem.codigo }}</span>
              </div>
            </div>

            <!-- Nombre del Producto -->
            <div style="font-size: 1.4rem; font-weight: 900; color: #0f172a; margin: 0.5rem 0 1.25rem 0; line-height: 1.2;">
              {{ currentBarcodeItem.nombre }}
            </div>

            <!-- Código de Barras SVG Gigante -->
            <div style="background: #ffffff; padding: 1.25rem 1rem; border: 2.5px dashed #0284c7; border-radius: 10px; margin: 0 auto 1.25rem auto; max-width: 700px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div v-html="generateBarcodeSVG(currentBarcodeItem.codigo, { scale: 4, height: 110, fontSize: 22, maxWidth: '650px' })"></div>
            </div>

            <!-- Cantidad Pedida -->
            <div style="font-size: 1.1rem; font-weight: 900; color: #d97706; background: #fffbe6; padding: 0.4rem 1rem; border-radius: 6px; display: inline-block; border: 1px solid #fef08a;">
              Cantidad Pedida: {{ currentBarcodeItem.cantidadDisplay }}
            </div>
          </div>
        </div>

        <!-- Footer del Modal -->
        <div class="win-dialog-footer" style="padding: 0.85rem 1.25rem; background: var(--bg-secondary); border-top: 1.5px solid var(--bevel-dark); display: flex; justify-content: space-between; align-items: center;">
          <button class="win-dialog-btn" @click="imprimirCodigosModal" style="display: flex; align-items: center; gap: 0.35rem; font-weight: 800;">
            <i class="ph ph-printer" style="font-size: 1.2rem; color: #0284c7;"></i> Imprimir Todos los Códigos
          </button>
          
          <button class="win-dialog-btn win-dialog-btn-ok" @click="showBarcodeModal = false" style="font-weight: 800; padding: 6px 20px;">
            Cerrar
          </button>
        </div>

      </div>
    </div>
  </Teleport>

  <!-- Contenedor exclusivo para impresión física / PDF -->
  <div v-if="activePrintPedido" class="print-only-container" style="display: none;">
    <div class="print-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-family: monospace; font-weight: bold; margin: 0; font-size: 24px; color: black;">CDF GESTIÓN</h1>
          <p style="font-family: monospace; font-size: 0.75rem; margin: 2px 0 0 0; color: black;">Control de Distribución y Fraccionamiento</p>
        </div>
        <div style="text-align: right; font-family: monospace;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: black;">REMITO DE PREPARACIÓN</h2>
          <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: black;">Documento de Uso Interno</p>
        </div>
      </div>
      
      <div style="margin-top: 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-family: monospace; font-size: 0.85rem; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 0.5rem 0; color: black;">
        <div>
          <strong>Código Pedido:</strong> {{ activePrintPedido.codigo }}<br>
          <strong>Sucursal Destino:</strong> {{ activePrintPedido.sucursal || 'Sin sucursal asignada' }}
        </div>
        <div style="text-align: right;">
          <strong>Fecha Emisión:</strong> {{ formatDate(activePrintPedido.fecha) }}<br>
          <strong>Estado Pedido:</strong> {{ activePrintPedido.estado }}
        </div>
      </div>
    </div>
    
    <table class="print-table" style="width: 100%; border-collapse: collapse; font-family: monospace; margin-top: 1rem; color: black;">
      <thead>
        <tr style="background-color: #f2f2f2; border-bottom: 2px solid #000;">
          <th style="border: 1px solid #000; text-align: left; width: 15%; padding: 4px;">Código</th>
          <th style="border: 1px solid #000; text-align: left; width: 45%; padding: 4px;">Nombre</th>
          <th style="border: 1px solid #000; text-align: right; width: 20%; padding: 4px;">Peso</th>
          <th style="border: 1px solid #000; text-align: right; width: 20%; padding: 4px;">Piezas</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in activePrintPedido.items" :key="item.id" style="border-bottom: 1px solid #000;">
          <td style="border: 1px solid #000; padding: 4px;">
            <strong>{{ item.codigo_producto }}</strong>
          </td>
          <td style="border: 1px solid #000; padding: 4px;">
            {{ item.Producto?.nombre || 'Producto sin nombre cargado' }}
          </td>
          <!-- Peso (desde pedido_armado_items) -->
          <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px;">
            {{ getPrintArmadoPeso(item.codigo_producto) }}
          </td>
          <!-- Piezas (desde pedido_armado_items) -->
          <td style="border: 1px solid #000; text-align: right; font-weight: bold; padding: 4px;">
            {{ getPrintArmadoPiezas(item.codigo_producto) }}
          </td>
        </tr>
        <tr v-if="!activePrintPedido.items || activePrintPedido.items.length === 0">
          <td colspan="4" style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 0.8rem; color: #555;">
            No hay productos registrados en este pedido.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWinDialog } from '../composables/useWinDialog'
import { formatDate } from '../utils/dateFormat'

const { winConfirm } = useWinDialog()

const pedidos = ref([])
const loading = ref(false)
const loadingDetail = ref(false)
const savingItem = ref(false)
const searchQuery = ref('')
const selectedPedido = ref(null)
const showMobileDetail = ref(false)
const activePrintPedido = ref(null)
const confirming = ref(false)

// Estado para Modal de Códigos de Barra
const showBarcodeModal = ref(false)
const selectedPedidoForBarcodes = ref(null)
const barcodeItems = ref([])
const currentBarcodeIndex = ref(0)

const currentBarcodeItem = computed(() => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return null
  return barcodeItems.value[currentBarcodeIndex.value] || barcodeItems.value[0]
})

const nextBarcode = () => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return
  currentBarcodeIndex.value = (currentBarcodeIndex.value + 1) % barcodeItems.value.length
}

const prevBarcode = () => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return
  currentBarcodeIndex.value = (currentBarcodeIndex.value - 1 + barcodeItems.value.length) % barcodeItems.value.length
}

const handleKeyDown = (e) => {
  if (!showBarcodeModal.value) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault()
    nextBarcode()
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault()
    prevBarcode()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    showBarcodeModal.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

const formatCantidadItemDisplay = (item) => {
  const pzas = parseInt(item.pieza || item.cantidad_enviada || 0, 10)
  const frac = parseFloat(item.fraccion || item.fraccion_enviada || 0)
  const peso = parseFloat(item.peso || item.peso_enviado || 0)
  const pesoPieza = parseFloat(item.Producto?.peso_pieza || 0)

  let partes = []

  // Si hay peso grabado explícito o enviado
  if (peso > 0) {
    partes.push(`${peso.toFixed(3)} kg`)
  } else if (frac > 0) {
    partes.push(`${frac.toFixed(3)} kg`)
  } else if (pzas > 0 && pesoPieza > 0) {
    partes.push(`${(pzas * pesoPieza).toFixed(3)} kg`)
  }

  // Agregar detalle de piezas/fracciones si existen
  if (pzas > 0 && frac > 0) {
    partes.push(`(${pzas} P y ${Math.round(frac)} F)`)
  } else if (pzas > 0) {
    partes.push(`(${pzas} Pzs)`)
  } else if (frac > 0 && peso === 0) {
    partes.push(`(${frac.toFixed(3)} Frac)`)
  }

  if (partes.length > 0) {
    return partes.join(' ')
  }
  return '-'
}

const openBarcodesModalForPedido = (pedido) => {
  if (!pedido || !pedido.items || pedido.items.length === 0) {
    showAlert('El pedido seleccionado no posee ítems.', 'error')
    return
  }
  selectedPedidoForBarcodes.value = pedido
  currentBarcodeIndex.value = 0

  const mapProds = new Map()
  pedido.items.forEach(it => {
    const cod = String(it.codigo_producto || it.Producto?.codigo || '-').trim()
    if (!cod || cod === '-') return
    const nom = it.Producto?.nombre || it.nombre || cod
    const cantDisp = formatCantidadItemDisplay(it)

    if (!mapProds.has(cod)) {
      mapProds.set(cod, {
        codigo: cod,
        nombre: nom,
        cantidadDisplay: cantDisp
      })
    }
  })

  barcodeItems.value = Array.from(mapProds.values())
  showBarcodeModal.value = true
}

const imprimirCodigosModal = () => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return

  const win = window.open('', '_blank', 'width=1000,height=750')
  if (!win) return

  const codigoPedido = selectedPedidoForBarcodes.value?.codigo || selectedPedidoForBarcodes.value?.id || 'S/N'
  const sucursal = selectedPedidoForBarcodes.value?.sucursal || '-'

  const itemsHtml = barcodeItems.value.map(it => {
    const svgCode = generateBarcodeSVG(it.codigo, { scale: 1.5, height: 40 })
    return `
      <div style="border: 1.5px solid #000; padding: 6px 4px; text-align: center; page-break-inside: avoid; border-radius: 4px; background: #fff; display: flex; flex-direction: column; justify-content: space-between; min-height: 100px;">
        <div style="font-size: 10px; font-weight: bold; font-family: monospace; color: #000;">CÓD: ${it.codigo}</div>
        <div style="font-size: 11px; font-weight: bold; font-family: sans-serif; margin: 2px 0; color: #000; line-height: 1.1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${it.nombre}">${it.nombre}</div>
        <div style="margin: 2px 0;">${svgCode}</div>
        <div style="font-size: 10px; font-weight: bold; font-family: monospace; color: #d97706;">CANTIDAD: ${it.cantidadDisplay}</div>
      </div>
    `
  }).join('')

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Códigos de Barra - Pedido ${codigoPedido}</title>
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: sans-serif; padding: 10px; color: #000; background: #fff; margin: 0; }
          .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          @media print {
            body { padding: 0; }
            .header { margin-bottom: 8px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h3 style="margin: 0; font-size: 16px;">PEDIDO Nº ${codigoPedido}</h3>
          <p style="margin: 2px 0 0 0; font-size: 12px;">Sucursal Destino: ${sucursal}</p>
        </div>
        <div class="grid">
          ${itemsHtml}
        </div>
        <script>
          window.onload = function() { window.print(); }
        <\/script>
      </body>
    </html>
  `)
  win.document.close()
}

// Generador SVG de Código de Barras Code 128 (Usando únicamente el Código del Producto)
const generateBarcodeSVG = (text, options = {}) => {
  if (!text) return ''
  const str = String(text).trim()
  if (!str) return ''
  
  const patterns = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","332111","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","411112","411211","211142",
    "211241","211421","231112","112142","112241","114122","114221","124112","124211","411221",
    "421121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112"
  ]

  let codeBuffer = [104]
  let checkSum = 104

  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    let code = charCode - 32
    if (code < 0 || code > 95) code = 0
    codeBuffer.push(code)
    checkSum += code * (i + 1)
  }

  const checksumVal = checkSum % 103
  codeBuffer.push(checksumVal)
  codeBuffer.push(106)

  let bars = ""
  for (let i = 0; i < codeBuffer.length; i++) {
    bars += patterns[codeBuffer[i]]
  }

  const scale = options.scale || 3.5
  const height = options.height || 95
  const fontSize = options.fontSize || 20
  const quietZone = 20

  let x = quietZone
  let rects = ""
  let isBar = true

  for (let i = 0; i < bars.length; i++) {
    const width = parseInt(bars[i], 10) * scale
    if (isBar) {
      rects += `<rect x="${x}" y="4" width="${width}" height="${height}" fill="#000000"/>`
    }
    x += width
    isBar = !isBar
  }

  const totalWidth = x + quietZone
  const svgHeight = height + fontSize + 15

  const showText = options.showText !== false
  const textHtml = showText ? `<text x="${totalWidth / 2}" y="${height + fontSize + 8}" font-family="monospace" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="#000000">${str}</text>` : ''

  const maxWidthCss = options.maxWidth || '100%'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${svgHeight}" style="width: 100%; max-width: ${maxWidthCss}; height: auto; display: block; margin: 0 auto;">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${rects}
    ${textHtml}
  </svg>`
}

const catalogProducts = ref([])
const armadoItems = ref([])

// Item modal para cargar envío
const activeModalItem = ref(null)
const itemForm = ref({
  kilos: 0,
  sin_stock: false,
  no_envia: false
})

const alert = ref({
  show: false,
  message: '',
  type: 'success'
})

// Mostrar alerta interactiva
const showAlert = (msg, type = 'success') => {
  alert.value = { show: true, message: msg, type }
  setTimeout(() => {
    alert.value.show = false
  }, 4000)
}

// Obtener porcentaje de progreso de preparación del pedido
const getPedidoProgreso = (pedido) => {
  if (!pedido || !pedido.items || pedido.items.length === 0) return 0
  const total = pedido.items.length
  
  const count = pedido.items.filter(item => {
    const arm = pedido.ArmadoItems && pedido.ArmadoItems.find(a => a.codigo_producto === item.codigo_producto)
    if (!arm) return false
    return !!(arm.piezas > 0 || parseFloat(arm.peso) > 0 || parseFloat(arm.fraccion) > 0 || arm.no_envia || arm.sin_stock)
  }).length
  
  return Math.round((count / total) * 100)
}

// Cargar pedidos desde la API
const fetchPedidos = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/pedidos')
    if (res.ok) {
      pedidos.value = await res.json()
      // Si el pedido seleccionado ya no está en preparación (pasó a Listo, Enviado, etc.), deseleccionarlo
      if (selectedPedido.value) {
        const found = pedidos.value.find(p => p.id === selectedPedido.value.id)
        if (!found || !['Pendiente', 'Preparando', 'Procesando', 'Armando'].includes(found.estado)) {
          selectedPedido.value = null
          showMobileDetail.value = false
          armadoItems.value = []
        }
      }
    } else {
      showAlert('Error al descargar listado de pedidos', 'error')
    }
  } catch (error) {
    console.error('Error fetching pedidos:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loading.value = false
  }
}

// Cargar catálogo de productos (para mostrar el stock)
const fetchCatalogProducts = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      catalogProducts.value = await res.json()
    }
  } catch (error) {
    console.error('Error fetching catalog products:', error)
  }
}

// Cargar los detalles frescos de un pedido específico y su armado
const fetchPedidoDetalle = async (id) => {
  loadingDetail.value = true
  try {
    const [resPedido, resArmado] = await Promise.all([
      fetch(`/api/pedidos/${id}`),
      fetch(`/api/pedidos/${id}/armado`)
    ])
    if (resPedido.ok && resArmado.ok) {
      selectedPedido.value = await resPedido.json()
      armadoItems.value = await resArmado.json()
    } else {
      showAlert('Error al descargar detalles o armado del pedido', 'error')
    }
  } catch (error) {
    console.error('Error fetching pedido detalle:', error)
    showAlert('Error de conexión con el servidor', 'error')
  } finally {
    loadingDetail.value = false
  }
}

// Filtrar pedidos en estado "Pendiente" y "Preparando"
const pendingPedidos = computed(() => {
  return pedidos.value.filter(p => ['Pendiente', 'Preparando', 'Procesando', 'Armando'].includes(p.estado))
})

// Filtrar por campo de búsqueda
const filteredPendingPedidos = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return pendingPedidos.value

  return pendingPedidos.value.filter(p => {
    const codigoMatch = p.codigo?.toLowerCase().includes(query)
    const sucursalMatch = p.sucursal?.toLowerCase().includes(query)
    return codigoMatch || sucursalMatch
  })
})

// Seleccionar un pedido para ver detalle
const selectPedido = async (pedido) => {
  activeModalItem.value = null
  showMobileDetail.value = true
  await fetchPedidoDetalle(pedido.id)
}

// Obtener item de armado si ya está cargado
const getArmadoItem = (codigo_producto) => {
  return armadoItems.value.find(a => a.codigo_producto === codigo_producto)
}

// Truncar nombre del producto a un máximo de 24 caracteres agregando ".."
const formatNombreProducto = (nombre) => {
  if (!nombre) return '-'
  const str = String(nombre).trim()
  return str.length > 24 ? str.substring(0, 24) + '..' : str
}

// Formatear texto informativo de lo solicitado por el cliente (solo texto plano)
const getSolicitadoDisplay = (item) => {
  if (!item) return '-'
  const parts = []
  if (item.pieza > 0) {
    parts.push(`${item.pieza} pz`)
  }
  if (parseFloat(item.fraccion || 0) > 0) {
    parts.push(`${Math.round(parseFloat(item.fraccion))} fracc`)
  }
  if (parts.length > 0) {
    return parts.join(' / ')
  }
  if (parseFloat(item.peso || 0) > 0) {
    return `${parseFloat(item.peso).toFixed(3)} kg`
  }
  return '-'
}

// Formatear texto de lo efectivamente cargado para enviar
const getEnviadoDisplay = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm) return 'Pendiente'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? `${totalPeso.toFixed(3)} kg` : '0.000 kg'
}

// Obtener clase CSS para destacar el estado del envío en la columna Enviado
const getEnviadoClass = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm) return 'text-muted'
  if (arm.sin_stock) return 'text-danger'
  if (arm.no_envia) return 'text-secondary'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? 'text-success' : 'text-muted'
}

// Comprobar si un ítem está cargado / completado (para pintar de verde)
const isItemCargado = (codigo_producto) => {
  const arm = getArmadoItem(codigo_producto)
  if (!arm) return false
  return !!(arm.piezas > 0 || parseFloat(arm.peso) > 0 || parseFloat(arm.fraccion) > 0 || arm.no_envia || arm.sin_stock)
}

// Obtener clase de fila según su estado
const getItemRowClass = (item) => {
  const arm = getArmadoItem(item.codigo_producto)
  if (!arm) return ''
  
  if (arm.sin_stock) {
    return 'row-sin-stock'
  }
  if (arm.no_envia) {
    return 'row-no-envia'
  }
  if (arm.piezas > 0 || parseFloat(arm.peso) > 0 || parseFloat(arm.fraccion) > 0) {
    return 'row-cargado'
  }
  
  return ''
}

const isReemplazo = ref(false)
const replacementSearchQuery = ref('')
const selectedReplacementCode = ref('')

const handleReplacementProductInput = () => {
  const code = replacementSearchQuery.value.trim()
  const found = catalogProducts.value.find(p => p.codigo === code || p.nombre.toLowerCase().includes(code.toLowerCase()))
  if (found) {
    selectedReplacementCode.value = found.codigo
  } else {
    selectedReplacementCode.value = ''
  }
}

// Control de cambios en checkboxes de exclusión
const handleSinStockChange = () => {
  if (itemForm.value.sin_stock) {
    itemForm.value.no_envia = false
  }
}

const handleNoEnviaChange = () => {
  if (itemForm.value.no_envia) {
    itemForm.value.sin_stock = false
  }
}

// Abrir el modal de carga para el producto seleccionado
const openItemModal = (item) => {
  activeModalItem.value = item
  isReemplazo.value = false
  replacementSearchQuery.value = ''
  selectedReplacementCode.value = ''

  const arm = getArmadoItem(item.codigo_producto)
  if (arm) {
    const totalCargado = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
    itemForm.value = {
      kilos: totalCargado > 0 ? totalCargado : '',
      sin_stock: !!arm.sin_stock,
      no_envia: !!arm.no_envia
    }
  } else {
    itemForm.value = {
      kilos: '',
      sin_stock: false,
      no_envia: false
    }
  }
}

// Obtener nombre del usuario activo desde storage
const getCurrentUserName = () => {
  const userString = localStorage.getItem('usuario') || sessionStorage.getItem('usuario')
  if (userString) {
    try {
      const u = JSON.parse(userString)
      if (u && u.nombre) return u.nombre
      if (u && u.usuario) return u.usuario
    } catch (e) {
      if (typeof userString === 'string' && userString.trim()) return userString
    }
  }
  return 'Sistema'
}

// Grabar el envío de un producto específico en el pedido de armado
const grabarItem = async (item) => {
  if (!item) return
  if (isReemplazo.value && !selectedReplacementCode.value) {
    showAlert('Debe seleccionar un producto sustituto válido del catálogo.', 'error')
    return
  }

  savingItem.value = true
  try {
    const isSpecial = itemForm.value.no_envia || itemForm.value.sin_stock
    const kilosVal = isSpecial ? 0 : (parseFloat(itemForm.value.kilos) || 0)
    const esFraccionado = parseFloat(item.fraccion || 0) > 0

    const targetCode = (isReemplazo.value && selectedReplacementCode.value) ? selectedReplacementCode.value : item.codigo_producto
    const codigoOriginal = isReemplazo.value ? item.codigo_producto : null

    const body = {
      codigo_producto: targetCode,
      codigo_original_reemplazado: codigoOriginal,
      piezas: 0,
      peso: esFraccionado ? 0 : kilosVal,
      fraccion: esFraccionado ? kilosVal : 0,
      no_envia: itemForm.value.no_envia,
      sin_stock: itemForm.value.sin_stock,
      usuario: getCurrentUserName()
    }

    const res = await fetch(`/api/pedidos/${selectedPedido.value.id}/armado`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      showAlert(isReemplazo.value ? 'Producto reemplazado y cargado con éxito.' : 'Cantidad enviada cargada correctamente.')
      activeModalItem.value = null
      isReemplazo.value = false
      replacementSearchQuery.value = ''
      selectedReplacementCode.value = ''
      await fetchPedidoDetalle(selectedPedido.value.id)
      
      const pIndex = pedidos.value.findIndex(p => p.id === selectedPedido.value.id)
      if (pIndex !== -1) {
        pedidos.value[pIndex].ArmadoItems = [...armadoItems.value]
      }
    } else {
      const data = await res.json()
      showAlert(data.error || 'Error al grabar la cantidad enviada.', 'error')
    }
  } catch (error) {
    console.error('Error al grabar armado del pedido:', error)
    showAlert('Error de red al guardar los cambios.', 'error')
  } finally {
    savingItem.value = false
  }
}

// Obtener stock actual de un producto del catálogo
const getStockActual = (codigo) => {
  const prod = catalogProducts.value.find(p => p.codigo === codigo)
  if (prod) {
    return parseFloat(prod.stock || 0).toFixed(3)
  }
  return '0.000'
}

const getPrintArmadoItem = (codigo_producto) => {
  if (!activePrintPedido.value || !activePrintPedido.value.ArmadoItems) return null
  return activePrintPedido.value.ArmadoItems.find(a => a.codigo_producto === codigo_producto)
}

const getPrintArmadoPeso = (codigo_producto) => {
  const arm = getPrintArmadoItem(codigo_producto)
  if (!arm) return '-'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  const totalPeso = parseFloat(arm.peso || 0) + parseFloat(arm.fraccion || 0)
  return totalPeso > 0 ? totalPeso.toFixed(3) + ' kg' : '-'
}

const getPrintArmadoPiezas = (codigo_producto) => {
  const arm = getPrintArmadoItem(codigo_producto)
  if (!arm) return '-'
  if (arm.sin_stock) return 'S/S'
  if (arm.no_envia) return 'N/E'
  return arm.piezas > 0 ? arm.piezas : '-'
}

const printPedido = (pedido) => {
  if (pedido.id === selectedPedido.value?.id) {
    pedido.ArmadoItems = [...armadoItems.value]
  }
  activePrintPedido.value = pedido
  setTimeout(() => {
    window.print()
  }, 100)
}

const confirmarPedido = async () => {
  if (!selectedPedido.value) return

  // Check if some items are completely unprepared
  const itemsSinPreparar = selectedPedido.value.items.filter(item => {
    const arm = armadoItems.value.find(a => a.codigo_producto === item.codigo_producto)
    if (!arm) return true
    const hasValues = (parseInt(arm.piezas) || 0) > 0 || (parseFloat(arm.peso) || 0) > 0 || (parseFloat(arm.fraccion) || 0) > 0
    const isSpecial = arm.sin_stock || arm.no_envia
    return !hasValues && !isSpecial
  })

  if (itemsSinPreparar.length > 0) {
    if (!await winConfirm(`Hay ${itemsSinPreparar.length} productos sin preparar en la lista. Si deseas continuar, estos se marcarán como "No Envía". ¿Confirmar?`, 'Productos Sin Preparar')) {
      return
    }
  } else {
    if (!await winConfirm('¿Estás seguro de confirmar este pedido? Se guardarán los datos y el pedido pasará a estado "Listo".', 'Confirmar Pedido')) {
      return
    }
  }

  confirming.value = true
  try {
    const itemsPayload = selectedPedido.value.items.map(item => {
      const arm = armadoItems.value.find(a => a.codigo_producto === item.codigo_producto)
      const hasValues = arm && ((parseInt(arm.piezas) || 0) > 0 || (parseFloat(arm.peso) || 0) > 0 || (parseFloat(arm.fraccion) || 0) > 0)
      const isSpecial = arm && (arm.sin_stock || arm.no_envia)
      const isNoEnvia = arm ? !!arm.no_envia : (!hasValues && !isSpecial)
      return {
        codigo: item.codigo_producto,
        peso: (arm && !isSpecial) ? parseFloat(arm.peso || 0) : 0,
        piezas: (arm && !isSpecial) ? parseInt(arm.piezas || 0, 10) : 0,
        fraccion: (arm && !isSpecial) ? parseFloat(arm.fraccion || 0) : 0,
        sinStock: arm ? !!arm.sin_stock : false,
        noEnvia: isNoEnvia
      }
    })

    const userName = getCurrentUserName()

    const res = await fetch(`/api/pedidos/${selectedPedido.value.id}/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: itemsPayload,
        usuario: userName
      })
    })

    const data = await res.json()
    if (res.ok) {
      showAlert('Pedido guardado exitosamente en estado "Listo".')
      selectedPedido.value = null
      showMobileDetail.value = false
      fetchPedidos()
    } else {
      if (data.productos_sin_stock && data.productos_sin_stock.length > 0) {
        const detalles = data.productos_sin_stock.map(p => 
          `${p.codigo} (${p.nombre}): stock ${p.stock_actual} kg, solicitado ${p.peso_solicitado} kg`
        ).join(' | ')
        showAlert(`${data.error} Detalles: ${detalles}`, 'error')
      } else {
        showAlert(data.error || 'Error al confirmar el pedido.', 'error')
      }
    }
  } catch (error) {
    console.error('Error al confirmar pedido:', error)
    showAlert('Error de conexión con el servidor.', 'error')
  } finally {
    confirming.value = false
  }
}

onMounted(() => {
  fetchPedidos()
  fetchCatalogProducts()
})
</script>

<style scoped>
/* Color overrides for tds inside customized rows to bypass main.css rules */
.order-row.row-cargado td {
  background-color: rgba(34, 197, 94, 0.15) !important;
}
.order-row.row-sin-stock td {
  background-color: rgba(239, 68, 68, 0.15) !important;
}
.order-row.row-no-envia td {
  background-color: rgba(148, 163, 184, 0.25) !important;
}

/* Transición suave al cambiar de color en hover */
.pedido-item {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.pedido-item:hover {
  border-color: var(--accent-primary) !important;
  background-color: var(--bg-window) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.pedido-item.selected {
  border-color: var(--accent-primary) !important;
  background-color: rgba(26, 127, 55, 0.05) !important;
  border-left: 3px solid var(--accent-primary) !important;
}

/* Hover de filas */
.order-row:hover td {
  background-color: #a7f3d0 !important;
}

/* Soporte responsive master-detail */
.mobile-only-btn {
  display: none;
}

@media (max-width: 768px) {
  .master-detail-container {
    flex-direction: column;
    gap: 0 !important;
  }
  
  .master-column, .detail-column {
    max-width: 100% !important;
    width: 100% !important;
    flex: 1 1 100% !important;
  }
  
  .hidden-mobile {
    display: none !important;
  }
  
  .mobile-only-btn {
    display: flex !important;
  }
}

/* Mobile optimized inputs and buttons in details card */
.mobile-input {
  height: 38px !important;
  font-size: 0.95rem !important;
  padding: 6px 10px !important;
  border-radius: 0 !important;
  border: 1.5px solid var(--bevel-dark) !important;
}

.mobile-checkbox-label {
  font-size: 0.85rem !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  cursor: pointer;
  padding: 6px 10px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--bevel-light);
  border-radius: 0;
  user-select: none;
  margin: 0 !important;
}

.mobile-checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.mobile-btn {
  height: 38px !important;
  font-size: 0.85rem !important;
  padding: 0 1.25rem !important;
  border-radius: 0 !important;
}
</style>

<style>
/* Estilos globales exclusivos para impresión en remito (evita sobreposición) */
@media print {
  html, body, #app {
    height: auto !important;
    overflow: visible !important;
    position: static !important;
    background: white !important;
    color: black !important;
  }

  /* Ocultar elementos de interfaz en pantalla */
  .no-print,
  .page-container,
  .master-detail-container,
  .master-column,
  .detail-column,
  .page-header,
  .alert-box,
  .win-dialog-overlay,
  aside,
  header,
  div[class^="alert-"],
  button {
    display: none !important;
  }
  
  /* Habilitar contenedor de impresión */
  .print-only-container {
    display: block !important;
    visibility: visible !important;
    position: static !important;
    width: 100% !important;
    height: auto !important;
    background: white !important;
    color: black !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .print-table {
    width: 100% !important;
    border-collapse: collapse !important;
    margin-top: 1rem !important;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #000000 !important;
    padding: 3px 5px !important;
    font-size: 8.5pt !important;
    line-height: 1.15 !important;
    color: black !important;
  }

  .print-table th {
    background-color: #f2f2f2 !important;
    color: black !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-weight: bold !important;
  }
}
</style>
