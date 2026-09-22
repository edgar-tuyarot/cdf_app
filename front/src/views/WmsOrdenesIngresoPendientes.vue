<template>
  <div class="page-container" style="padding: 1rem; max-width: 1400px; margin: 0 auto;">
    
    <!-- Encabezado de la Pantalla -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
      <div>
        <h2 class="page-title" style="margin: 0; font-size: 1.4rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i class="ph ph-clock-afternoon" style="color: #0284c7; font-size: 1.6rem;"></i>
          {{ pageTitle }}
        </h2>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
          {{ pageDescription }}
        </p>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button 
          class="win-dialog-btn" 
          @click="cargarOrdenesPendientes" 
          :disabled="loading"
          style="font-weight: 800; display: flex; align-items: center; gap: 0.35rem;"
        >
          <i class="ph ph-arrows-clockwise" :class="{ spinner: loading }"></i>
          {{ loading ? 'Consultando Block...' : 'Actualizar Consulta' }}
        </button>
        <button 
          v-if="items.length > 0" 
          class="win-dialog-btn win-dialog-btn-ok" 
          @click="exportarExcel"
          style="display: flex; align-items: center; gap: 0.35rem; font-weight: 800;"
        >
          <i class="ph ph-file-xls"></i> Exportar Excel
        </button>
      </div>
    </div>

    <!-- Pestañas Selectoras de Origen (Proveedores vs Sucursales / CD) -->
    <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 2px solid var(--bevel-dark); padding-bottom: 0.5rem; flex-wrap: wrap;">
      <button 
        @click="activeOrigenTab = 'proveedores'"
        :style="{ 
          background: activeOrigenTab === 'proveedores' ? 'var(--accent-primary)' : 'var(--bg-window)', 
          color: activeOrigenTab === 'proveedores' ? '#ffffff' : 'var(--text-primary)',
          border: '1.5px solid var(--bevel-dark)'
        }"
        style="padding: 0.5rem 1.1rem; font-weight: 800; font-size: 0.85rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; box-shadow: var(--raised-shadow);"
      >
        <i class="ph ph-storefront" style="font-size: 1.1rem;"></i>
        Ingresos de Proveedores
        <span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 10px; background: rgba(0,0,0,0.18); font-weight: 900;">
          {{ countProveedores }}
        </span>
      </button>

      <button 
        @click="activeOrigenTab = 'sucursales'"
        :style="{ 
          background: activeOrigenTab === 'sucursales' ? 'var(--accent-primary)' : 'var(--bg-window)', 
          color: activeOrigenTab === 'sucursales' ? '#ffffff' : 'var(--text-primary)',
          border: '1.5px solid var(--bevel-dark)'
        }"
        style="padding: 0.5rem 1.1rem; font-weight: 800; font-size: 0.85rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; box-shadow: var(--raised-shadow);"
      >
        <i class="ph ph-truck-trailer" style="font-size: 1.1rem;"></i>
        Ingresos de Sucursales / CD
        <span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 10px; background: rgba(0,0,0,0.18); font-weight: 900;">
          {{ countSucursales }}
        </span>
      </button>

      <button 
        @click="activeOrigenTab = 'todos'"
        :style="{ 
          background: activeOrigenTab === 'todos' ? 'var(--accent-primary)' : 'var(--bg-window)', 
          color: activeOrigenTab === 'todos' ? '#ffffff' : 'var(--text-primary)',
          border: '1.5px solid var(--bevel-dark)'
        }"
        style="padding: 0.5rem 1.1rem; font-weight: 800; font-size: 0.85rem; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; box-shadow: var(--raised-shadow);"
      >
        <i class="ph ph-list-checks" style="font-size: 1.1rem;"></i>
        Todos los Ingresos
        <span style="font-size: 0.72rem; padding: 2px 7px; border-radius: 10px; background: rgba(0,0,0,0.18); font-weight: 900;">
          {{ items.length }}
        </span>
      </button>
    </div>

    <!-- KPIs Resumen -->
    <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
      <div class="kpi-card" style="background: var(--bg-window); border: 2px solid var(--bevel-dark); padding: 1rem; border-radius: 6px; display: flex; align-items: center; gap: 1rem;">
        <div style="width: 48px; height: 48px; border-radius: 8px; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
          <i class="ph ph-receipt"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Órdenes Pendientes</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">{{ totalOrdenes }}</div>
        </div>
      </div>

      <div class="kpi-card" style="background: var(--bg-window); border: 2px solid var(--bevel-dark); padding: 1rem; border-radius: 6px; display: flex; align-items: center; gap: 1rem;">
        <div style="width: 48px; height: 48px; border-radius: 8px; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
          <i class="ph ph-package"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Lotes / Ítems en Espera</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: var(--text-primary);">{{ totalItemsFiltered }}</div>
        </div>
      </div>

      <div class="kpi-card" style="background: var(--bg-window); border: 2px solid var(--bevel-dark); padding: 1rem; border-radius: 6px; display: flex; align-items: center; gap: 1rem;">
        <div style="width: 48px; height: 48px; border-radius: 8px; background: #dcfce7; color: #16a34a; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
          <i class="ph ph-scales"></i>
        </div>
        <div>
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Peso/Cantidad Pendiente</div>
          <div style="font-size: 1.5rem; font-weight: 900; color: #16a34a;">{{ totalKilosPendientesFormateado }} kg</div>
        </div>
      </div>
    </div>

    <!-- Panel de Filtros -->
    <div class="card" style="padding: 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window); margin-bottom: 1.25rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        
        <div style="display: flex; gap: 0.75rem; flex: 1; min-width: 280px;">
          <!-- Búsqueda General -->
          <div style="flex: 1; position: relative;">
            <i class="ph ph-magnifying-glass" style="position: absolute; left: 10px; top: 10px; color: var(--text-secondary); font-size: 1.1rem;"></i>
            <input 
              type="text" 
              v-model="filterSearch" 
              placeholder="Buscar por Nº Orden WMS, N° Compra ERP, Proveedor o Producto..." 
              class="form-control" 
              style="padding-left: 2.2rem; font-size: 0.88rem; font-weight: bold; height: 38px; border: 1.5px solid var(--bevel-dark); width: 100%;"
            />
          </div>

          <!-- Filtro Proveedor -->
          <div style="min-width: 200px;">
            <select 
              v-model="filterProveedor" 
              class="form-control" 
              style="font-size: 0.85rem; font-weight: bold; height: 38px; border: 1.5px solid var(--bevel-dark); width: 100%;"
            >
              <option value="">-- Todos los Proveedores --</option>
              <option v-for="prov in proveedoresUnicos" :key="prov" :value="prov">
                {{ prov }}
              </option>
            </select>
          </div>
        </div>

        <!-- Selector Vista (Agrupada vs Tabla Detallada) -->
        <div class="view-toggle" style="display: flex; border: 2px solid var(--bevel-dark); border-radius: 4px; overflow: hidden; background: var(--bg-secondary);">
          <button 
            @click="vistaModo = 'tabla'" 
            :style="{ background: vistaModo === 'tabla' ? 'var(--accent-primary)' : 'transparent', color: vistaModo === 'tabla' ? '#fff' : 'var(--text-primary)' }"
            style="border: none; padding: 6px 14px; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;"
          >
            <i class="ph ph-table"></i> Vista Tabla
          </button>
          <button 
            @click="vistaModo = 'agrupado'" 
            :style="{ background: vistaModo === 'agrupado' ? 'var(--accent-primary)' : 'transparent', color: vistaModo === 'agrupado' ? '#fff' : 'var(--text-primary)' }"
            style="border: none; padding: 6px 14px; font-weight: 800; font-size: 0.82rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem;"
          >
            <i class="ph ph-folders"></i> Por Orden WMS
          </button>
        </div>

      </div>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loading" style="text-align: center; padding: 3rem; background: var(--bg-window); border: 2px solid var(--bevel-dark);">
      <i class="ph ph-arrows-clockwise spinner" style="font-size: 2.5rem; color: var(--accent-primary); display: block; margin: 0 auto 0.75rem auto;"></i>
      <div style="font-size: 1rem; font-weight: 800; color: var(--text-primary);">Consultando órdenes de ingreso pendientes en Block WMS...</div>
      <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.25rem;">Esto puede tomar unos segundos mientras conectamos con la base de datos del WMS.</div>
    </div>

    <!-- Sin Resultados -->
    <div v-else-if="filteredItems.length === 0" style="text-align: center; padding: 3rem; background: var(--bg-window); border: 2px solid var(--bevel-dark);">
      <i class="ph ph-check-circle" style="font-size: 3rem; color: #16a34a; margin-bottom: 0.5rem;"></i>
      <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">No se encontraron órdenes de ingreso pendientes</h3>
      <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
        {{ filterSearch || filterProveedor ? 'Intenta modificar los filtros de búsqueda aplicados.' : 'Todas las órdenes de ingreso se encuentran recepcionadas o cerradas.' }}
      </p>
    </div>

    <!-- VISTA TABLA DETALLADA -->
    <div v-else-if="vistaModo === 'tabla'" class="card" style="padding: 0; border: 2px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto;">
      <table class="table-styled" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="background: var(--bg-secondary); border-bottom: 2px solid var(--bevel-dark);">
            <th style="padding: 10px 12px; text-align: left; font-weight: 800; width: 10%;">Orden WMS</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 800; width: 8%;">N° O.C. / ERP</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 800; width: 9%;">Fecha Alta</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 800; width: 24%;">Proveedor</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 800; width: 8%;">Código</th>
            <th style="padding: 10px 12px; text-align: left; font-weight: 800; width: 21%;">Producto</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 800; width: 6%;">Esperada</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 800; width: 6%;">Recibida</th>
            <th style="padding: 10px 12px; text-align: right; font-weight: 800; width: 6%;">Pendiente</th>
            <th style="padding: 10px 12px; text-align: center; font-weight: 800; width: 9%;">Código Barras</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(item, idx) in filteredItems" 
            :key="item.id"
            :style="{ background: idx % 2 === 0 ? 'var(--bg-window)' : 'var(--bg-secondary)' }"
            style="border-bottom: 1px solid var(--bevel-light);"
          >
            <td style="padding: 10px 12px; font-weight: 800; color: #0284c7;">
              <i class="ph ph-file-text" style="margin-right: 4px;"></i> {{ item.ordenWms }}
            </td>
            <td style="padding: 10px 12px; font-weight: 700; color: var(--text-secondary);">
              {{ item.ordenCompraErp !== '-' ? item.ordenCompraErp : 'S/N' }}
            </td>
            <td style="padding: 10px 12px; font-size: 0.8rem; font-weight: 700;">
              {{ item.fechaAlta }}
            </td>
            <td style="padding: 10px 12px; font-weight: 700; color: var(--text-primary);">
              {{ item.proveedor }}
            </td>
            <td style="padding: 10px 12px; text-align: center;">
              <span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--bevel-dark); font-family: monospace; font-weight: 800;">
                {{ item.codigoProducto }}
              </span>
            </td>
            <td style="padding: 10px 12px; font-weight: 700;">
              {{ item.nombreProducto }}
            </td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700;">
              {{ item.cantidadEsperada.toFixed(3) }}
            </td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: var(--text-secondary);">
              {{ item.cantidadRecibida.toFixed(3) }}
            </td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 900; color: #d97706;">
              +{{ item.cantidadPendiente.toFixed(3) }}
            </td>
            <td style="padding: 10px 12px; text-align: center;">
              <button 
                class="win-dialog-btn" 
                @click="openBarcodesModalForSingleItem(item)"
                style="font-size: 0.75rem; font-weight: 800; padding: 2px 8px; display: inline-flex; align-items: center; gap: 0.25rem;"
                title="Ver Código de Barras de la Orden"
              >
                <i class="ph ph-barcode" style="font-size: 1rem; color: #0284c7;"></i> Ver Código
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- VISTA AGRUPADA POR ORDEN WMS -->
    <div v-else-if="vistaModo === 'agrupado'" style="display: flex; flex-direction: column; gap: 1rem;">
      <div 
        v-for="grp in ordenesAgrupadas" 
        :key="grp.ordenWms"
        class="card"
        style="padding: 1rem; border: 2px solid var(--bevel-dark); background: var(--bg-window);"
      >
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <div>
            <span style="font-size: 1.1rem; font-weight: 900; color: #0284c7;">
              Orden WMS Nº {{ grp.ordenWms }}
            </span>
            <span v-if="grp.ordenCompraErp !== '-'" style="margin-left: 0.5rem; font-size: 0.85rem; font-weight: 800; color: var(--text-secondary);">
              (O.C. ERP: {{ grp.ordenCompraErp }})
            </span>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">
              <i class="ph ph-truck" style="margin-right: 4px;"></i> {{ grp.proveedor }}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <div style="text-align: right;">
              <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary);">
                Fecha Alta: {{ grp.fechaAlta }}
              </div>
              <div style="font-size: 1rem; font-weight: 900; color: #d97706; margin-top: 0.2rem;">
                {{ grp.items.length }} ítems (Total: {{ grp.totalPendiente.toFixed(3) }} kg/uds)
              </div>
            </div>

            <!-- Botón Ver Códigos de Barra de la Orden -->
            <button 
              class="win-dialog-btn" 
              @click="openBarcodesModal(grp)" 
              style="font-size: 0.78rem; font-weight: 800; padding: 4px 10px; display: inline-flex; align-items: center; gap: 0.35rem; background: var(--bg-window);"
              title="Ver Códigos de Barras de los productos de esta orden"
            >
              <i class="ph ph-barcode" style="font-size: 1.1rem; color: #0284c7;"></i> Códigos de Barra
            </button>
          </div>
        </div>

        <!-- Tabla Interna de Ítems -->
        <table class="table-styled" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead>
            <tr style="background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-dark);">
              <th style="padding: 6px 10px; text-align: center;">Código</th>
              <th style="padding: 6px 10px; text-align: left;">Producto</th>
              <th style="padding: 6px 10px; text-align: right;">Esperada</th>
              <th style="padding: 6px 10px; text-align: right;">Recibida</th>
              <th style="padding: 6px 10px; text-align: right;">Pendiente</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in grp.items" :key="it.id" style="border-bottom: 1px solid var(--bevel-light);">
              <td style="padding: 6px 10px; text-align: center; font-family: monospace; font-weight: 800;">
                {{ it.codigoProducto }}
              </td>
              <td style="padding: 6px 10px; font-weight: 700;">
                {{ it.nombreProducto }}
              </td>
              <td style="padding: 6px 10px; text-align: right;">
                {{ it.cantidadEsperada.toFixed(3) }}
              </td>
              <td style="padding: 6px 10px; text-align: right; color: var(--text-secondary);">
                {{ it.cantidadRecibida.toFixed(3) }}
              </td>
              <td style="padding: 6px 10px; text-align: right; font-weight: 900; color: #d97706;">
                +{{ it.cantidadPendiente.toFixed(3) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL XL DE CÓDIGOS DE BARRA (UNO POR UNO) -->
    <Teleport to="body">
      <div v-if="showBarcodeModal" class="win-dialog-overlay" style="display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div class="win-dialog" style="width: 850px; max-width: 95vw; background: var(--bg-window); border: 3px solid var(--bevel-dark); box-shadow: var(--window-shadow);">
          
          <!-- Header del Modal -->
          <div class="win-dialog-header" style="background: #0b5394; color: white; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
              <i class="ph ph-barcode" style="font-size: 1.4rem;"></i>
              Código de Barras - Orden WMS Nº {{ selectedOrderForBarcodes?.ordenWms }}
            </span>
            <button @click="showBarcodeModal = false" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.3rem; display: flex; align-items: center;">
              <i class="ph ph-x"></i>
            </button>
          </div>

          <!-- Subheader Info + Paginador -->
          <div style="padding: 0.75rem 1.25rem; background: var(--bg-secondary); border-bottom: 1.5px solid var(--bevel-light); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="font-size: 0.88rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
              <div>
                <strong>Proveedor:</strong> {{ selectedOrderForBarcodes?.proveedor || '-' }}
                <span v-if="selectedOrderForBarcodes?.ordenCompraErp && selectedOrderForBarcodes?.ordenCompraErp !== '-'" style="margin-left: 0.75rem;">
                  <strong>O.C. ERP:</strong> {{ selectedOrderForBarcodes.ordenCompraErp }}
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

              <!-- Cantidad Pendiente -->
              <div style="font-size: 1.1rem; font-weight: 900; color: #d97706; background: #fffbe6; padding: 0.4rem 1rem; border-radius: 6px; display: inline-block; border: 1px solid #fef08a;">
                Cantidad Pendiente a Recepcionar: {{ currentBarcodeItem.cantidadPendiente.toFixed(3) }} kg/uds
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as XLSX from 'xlsx'

const route = useRoute()
const loading = ref(false)
const items = ref([])
const totalOrdenes = ref(0)
const vistaModo = ref('agrupado') // 'agrupado' (Por Orden WMS por defecto) | 'tabla'

const filterSearch = ref('')
const filterProveedor = ref('')
const activeOrigenTab = ref('proveedores') // 'proveedores' | 'sucursales' | 'todos'

const syncTabFromRoute = () => {
  if (route.meta?.tipoOrigen) {
    activeOrigenTab.value = route.meta.tipoOrigen
  } else if (route.path.includes('sucursales')) {
    activeOrigenTab.value = 'sucursales'
  } else if (route.path.includes('proveedores')) {
    activeOrigenTab.value = 'proveedores'
  }
}

watch(() => route.path, () => {
  syncTabFromRoute()
})

const pageTitle = computed(() => {
  if (activeOrigenTab.value === 'proveedores') return 'Ingresos Pendientes - Proveedores'
  if (activeOrigenTab.value === 'sucursales') return 'Ingresos Pendientes - Sucursales / CD'
  return 'Ingresos Pendientes'
})

const pageDescription = computed(() => {
  if (activeOrigenTab.value === 'proveedores') return 'Recepción y Entradas de Mercadería Pendientes de Proveedores'
  if (activeOrigenTab.value === 'sucursales') return 'Transferencias e Ingresos Pendientes entre Sucursales o Centro de Distribución'
  return 'Listado General de Entradas de Mercadería en Espera de Ingreso Físico en Depósito'
})

// Estado para Modal de Códigos de Barra
const showBarcodeModal = ref(false)
const selectedOrderForBarcodes = ref(null)
const barcodeItems = ref([])
const catalogProducts = ref([])
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

// Navegación por teclado (Flechas Izquierda / Derecha / Escape)
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

// Cargar catálogo de productos locales (para obtener codigo_barra si existe)
const fetchCatalogProducts = async () => {
  try {
    const res = await fetch('/api/productos')
    if (res.ok) {
      catalogProducts.value = await res.json()
    }
  } catch (e) {
    console.error('Error al cargar catálogo de productos:', e)
  }
}

// Cargar ordenes pendientes desde el backend API
const cargarOrdenesPendientes = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/wms/ordenes-ingreso-pendientes')
    const data = await res.json()
    if (data.ok) {
      items.value = data.items || []
      totalOrdenes.value = data.totalOrdenes || 0
    } else {
      console.error('Error en respuesta WMS:', data.error)
    }
  } catch (err) {
    console.error('Error al conectar con la API de WMS:', err)
  } finally {
    loading.value = false
  }
}

// Usar únicamente el código del producto como código de barra
const getProductBarcodeProperty = (codigoProducto) => {
  return String(codigoProducto || '').trim()
}

// Abrir Modal de Códigos de Barra para una orden agrupada
const openBarcodesModal = (grp) => {
  selectedOrderForBarcodes.value = grp
  currentBarcodeIndex.value = 0
  const mapProds = new Map()
  
  grp.items.forEach(it => {
    const rawBarProp = getProductBarcodeProperty(it.codigoProducto)

    if (!mapProds.has(it.codigoProducto)) {
      mapProds.set(it.codigoProducto, {
        codigo: it.codigoProducto,
        nombre: it.nombreProducto,
        cantidadPendiente: it.cantidadPendiente,
        codigoBarra: rawBarProp
      })
    } else {
      const existing = mapProds.get(it.codigoProducto)
      existing.cantidadPendiente += it.cantidadPendiente
    }
  })
  
  barcodeItems.value = Array.from(mapProds.values())
  showBarcodeModal.value = true
}

// Abrir Modal para un ítem individual en la vista de tabla
const openBarcodesModalForSingleItem = (item) => {
  currentBarcodeIndex.value = 0
  const grpMatch = ordenesAgrupadas.value.find(g => g.ordenWms === item.ordenWms)
  if (grpMatch) {
    openBarcodesModal(grpMatch)
  } else {
    const rawBarProp = getProductBarcodeProperty(item.codigoProducto)
    
    selectedOrderForBarcodes.value = {
      ordenWms: item.ordenWms,
      ordenCompraErp: item.ordenCompraErp,
      proveedor: item.proveedor
    }
    
    barcodeItems.value = [{
      codigo: item.codigoProducto,
      nombre: item.nombreProducto,
      cantidadPendiente: item.cantidadPendiente,
      codigoBarra: rawBarProp
    }]
    
    showBarcodeModal.value = true
  }
}

// Generador SVG de Código de Barras Code 128 (Exacto según la propiedad del producto)
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

// Función para imprimir códigos de barra desde el Modal
const imprimirCodigosModal = () => {
  if (!barcodeItems.value || barcodeItems.value.length === 0) return

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  const ordenWms = selectedOrderForBarcodes.value?.ordenWms || 'S/N'
  const prov = selectedOrderForBarcodes.value?.proveedor || '-'

  const itemsHtml = barcodeItems.value.map(it => {
    const svgCode = generateBarcodeSVG(it.codigo, { scale: 2, height: 45 })
    return `
      <div style="border: 2px solid #000; padding: 10px; text-align: center; page-break-inside: avoid; border-radius: 4px; background: #fff;">
        <div style="font-size: 11px; font-weight: bold; font-family: monospace;">CÓDIGO: ${it.codigo}</div>
        <div style="font-size: 13px; font-weight: bold; font-family: sans-serif; margin: 4px 0 8px 0; color: #000;">${it.nombre}</div>
        <div>${svgCode}</div>
        <div style="font-size: 11px; font-weight: bold; margin-top: 6px; font-family: monospace; color: #d97706;">PENDIENTE: ${it.cantidadPendiente.toFixed(3)} kg/uds</div>
      </div>
    `
  }).join('')

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Códigos de Barra - Orden WMS ${ordenWms}</title>
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          body { font-family: sans-serif; padding: 10px; color: #000; background: #fff; margin: 0; }
          .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 6px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          @media print {
            @page { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">ORDEN DE INGRESO WMS Nº ${ordenWms}</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px;">Proveedor: ${prov}</p>
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

// Helpers para clasificar Origen (Proveedores vs Sucursales / CD)
const esIngresoSucursalCD = (item) => {
  const doc = String(item.tipoComprobante || '').toUpperCase()
  const prov = String(item.proveedor || '').toUpperCase()
  if (doc.includes('SU_TR') || doc.includes('TR') || doc.includes('TRANSFERENCIA') || doc.includes('SUCURSAL')) {
    return true
  }
  if (prov.includes('SUCURSAL') || prov.includes('CENTRO DE DISTRIBUCION') || prov.includes('CD ') || prov.startsWith('CD') || prov.includes('TRANSF')) {
    return true
  }
  return false
}

const esIngresoProveedor = (item) => {
  return !esIngresoSucursalCD(item)
}

const countProveedores = computed(() => {
  return items.value.filter(i => esIngresoProveedor(i)).length
})

const countSucursales = computed(() => {
  return items.value.filter(i => esIngresoSucursalCD(i)).length
})

// Lista única de proveedores para el selector
const proveedoresUnicos = computed(() => {
  const setProv = new Set()
  items.value.forEach(i => {
    if (i.proveedor && i.proveedor !== '-') setProv.add(i.proveedor)
  })
  return Array.from(setProv).sort()
})

// Filtrado reactivo de ítems
const filteredItems = computed(() => {
  return items.value.filter(i => {
    // Filtro por pestaña de origen
    if (activeOrigenTab.value === 'proveedores' && !esIngresoProveedor(i)) {
      return false
    }
    if (activeOrigenTab.value === 'sucursales' && !esIngresoSucursalCD(i)) {
      return false
    }
    // Filtro por proveedor
    if (filterProveedor.value && i.proveedor !== filterProveedor.value) {
      return false
    }
    // Búsqueda general
    if (filterSearch.value.trim()) {
      const q = filterSearch.value.trim().toLowerCase()
      const matchWms = i.ordenWms.toLowerCase().includes(q)
      const matchErp = i.ordenCompraErp.toLowerCase().includes(q)
      const matchProv = i.proveedor.toLowerCase().includes(q)
      const matchCod = i.codigoProducto.toLowerCase().includes(q)
      const matchNom = i.nombreProducto.toLowerCase().includes(q)
      if (!matchWms && !matchErp && !matchProv && !matchCod && !matchNom) {
        return false
      }
    }
    return true
  })
})

const totalItemsFiltered = computed(() => filteredItems.value.length)

const totalKilosPendientesFormateado = computed(() => {
  const sum = filteredItems.value.reduce((acc, i) => acc + i.cantidadPendiente, 0)
  return sum.toLocaleString('es-AR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
})

// Agrupamiento por Orden WMS
const ordenesAgrupadas = computed(() => {
  const map = new Map()
  filteredItems.value.forEach(item => {
    if (!map.has(item.ordenWms)) {
      map.set(item.ordenWms, {
        ordenWms: item.ordenWms,
        ordenCompraErp: item.ordenCompraErp,
        proveedor: item.proveedor,
        fechaAlta: item.fechaAlta,
        totalPendiente: 0,
        items: []
      })
    }
    const grp = map.get(item.ordenWms)
    grp.items.push(item)
    grp.totalPendiente += item.cantidadPendiente
  })
  return Array.from(map.values())
})

// Exportar listado a Excel
const exportarExcel = () => {
  if (filteredItems.value.length === 0) return

  const dataExport = filteredItems.value.map(i => ({
    'Orden WMS': i.ordenWms,
    'Orden ERP / OC': i.ordenCompraErp,
    'Fecha Alta': i.fechaAlta,
    'Proveedor / Origen': i.proveedor,
    'Código Producto': i.codigoProducto,
    'Descripción Producto': i.nombreProducto,
    'Cantidad Esperada': i.cantidadEsperada,
    'Cantidad Recibida': i.cantidadRecibida,
    'Cantidad Pendiente': i.cantidadPendiente
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataExport)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ingresos Pendientes')

  const fileName = `WMS_Ingresos_Pendientes_${activeOrigenTab.value}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  syncTabFromRoute()
  fetchCatalogProducts()
  cargarOrdenesPendientes()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
