<template>
  <div class="page-container animate-fade" style="padding: 0.4rem 0.6rem; max-width: 100%; margin: 0 auto;">
    
    <!-- Encabezado Compacto y Toggle de Modo -->
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
      <div>
        <h2 class="page-title" style="margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-buildings" style="color: var(--accent-primary); font-size: 1.4rem;"></i>
          Stock Sucursales y Plan de Reposición
        </h2>
        <p style="margin: 0.15rem 0 0 0; font-size: 0.8rem; color: var(--text-secondary);">
          Consulte las existencias de sucursales, calcule el stock objetivo y genere pedidos de despacho desde el CD.
        </p>
      </div>

      <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
        <!-- Selector de Modo: Matriz vs Reposición -->
        <div style="display: flex; background: var(--bg-secondary); border: 1.5px solid var(--bevel-dark); border-radius: 4px; padding: 2px;">
          <button 
            type="button" 
            class="win-dialog-btn" 
            :class="{ 'win-dialog-btn-ok': !modoReposicion }"
            @click="modoReposicion = false"
            style="font-size: 0.78rem; font-weight: 800; padding: 3px 10px; border: none;"
          >
            <i class="ph ph-table"></i> Matriz de Stock
          </button>
          <button 
            type="button" 
            class="win-dialog-btn" 
            :class="{ 'win-dialog-btn-ok': modoReposicion }"
            @click="modoReposicion = true"
            style="font-size: 0.78rem; font-weight: 800; padding: 3px 10px; border: none;"
          >
            <i class="ph ph-truck"></i> Plan de Reposición
          </button>
        </div>

        <button 
          v-if="reportData && reportData.items && reportData.items.length > 0" 
          class="win-dialog-btn" 
          @click="exportarExcel"
          style="display: flex; align-items: center; gap: 0.3rem; font-weight: 800; font-size: 0.8rem; padding: 4px 10px;"
        >
          <i class="ph ph-file-xls" style="color: #16a34a;"></i> Exportar Excel
        </button>
      </div>
    </div>

    <!-- Formulario Compacto: Buscador + Selección Múltiple de Sucursales -->
    <div class="card" style="padding: 0.6rem 0.85rem; border: 1.5px solid var(--bevel-dark); background: var(--bg-window); margin-bottom: 0.5rem;">
      <form @submit.prevent="consultarStockSucursales" style="display: flex; flex-direction: column; gap: 0.5rem;">
        
        <!-- Buscador de Texto + Botón Consultar -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 260px;">
            <div style="position: relative; display: flex; align-items: center;">
              <i class="ph ph-magnifying-glass" style="position: absolute; left: 8px; color: var(--text-muted); font-size: 1rem;"></i>
              <input 
                type="text" 
                v-model="codigoProducto" 
                placeholder="Filtrar por Código SKU o Nombre (deje vacío para cargar catálogo)..." 
                class="form-control" 
                style="padding-left: 2rem; font-size: 0.88rem; font-weight: bold; height: 32px; border: 1.5px solid var(--bevel-dark); width: 100%;"
                :disabled="loading"
                ref="inputCodigo"
                autofocus
              />
              <button 
                v-if="codigoProducto" 
                type="button" 
                @click="limpiarBusquedaProducto" 
                style="position: absolute; right: 0.5rem; background: none; border: none; cursor: pointer; color: var(--text-muted);"
              >
                <i class="ph ph-x-circle" style="font-size: 1.1rem;"></i>
              </button>
            </div>
          </div>

          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button 
              type="button" 
              class="win-dialog-btn" 
              @click="seleccionarTodosSites"
              style="font-size: 0.75rem; font-weight: 800; padding: 3px 8px;"
            >
              ✓ Todas
            </button>
            <button 
              type="button" 
              class="win-dialog-btn" 
              @click="deseleccionarTodosSites"
              style="font-size: 0.75rem; font-weight: 800; padding: 3px 8px;"
            >
              ✕ Ninguna
            </button>
            <button 
              type="submit" 
              class="win-dialog-btn win-dialog-btn-ok" 
              :disabled="loading || selectedSiteIds.length === 0"
              style="height: 32px; padding: 0 1rem; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 0.3rem;"
            >
              <i class="ph ph-magnifying-glass" v-if="!loading"></i>
              <i class="ph ph-spinner spinner" v-else></i>
              Consultar Stock
            </button>
          </div>
        </div>

        <!-- Checkboxes de Sucursales Compactos -->
        <div>
          <div v-if="loadingSites" style="font-size: 0.78rem; color: var(--text-muted); padding: 2px 0;">
            <i class="ph ph-spinner spinner me-1"></i> Cargando sucursales...
          </div>
          <div 
            v-else 
            style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.35rem; background: var(--bg-secondary); padding: 0.4rem 0.6rem; border: 1.5px solid var(--bevel-dark); max-height: 120px; overflow-y: auto; border-radius: 4px;"
          >
            <label 
              v-for="site in availableSites" 
              :key="site.siteId"
              style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; color: var(--text-primary); user-select: none;"
            >
              <input 
                type="checkbox" 
                :value="site.siteId" 
                v-model="selectedSiteIds"
                style="width: 14px; height: 14px; cursor: pointer;"
              />
              <span :style="{ color: selectedSiteIds.includes(site.siteId) ? 'var(--accent-primary)' : 'var(--text-secondary)' }">
                🏢 {{ site.nombre }}
              </span>
            </label>
          </div>
        </div>

      </form>
    </div>

    <!-- Panel de Herramientas de Reposición (Guardar Objetivos) -->
    <div v-if="modoReposicion && reportData" class="card" style="padding: 0.5rem 0.85rem; border: 1.5px solid #0284c7; background: #f0f9ff; margin-bottom: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem;">
        
        <div style="font-size: 0.82rem; font-weight: 800; color: #0369a1; display: flex; align-items: center; gap: 0.4rem;">
          <i class="ph ph-target" style="font-size: 1.1rem;"></i> Configuración de Stock Objetivos por Sucursal
        </div>

        <!-- Botón Guardar Objetivos -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button 
            type="button" 
            class="win-dialog-btn win-dialog-btn-ok"
            @click="guardarObjetivos"
            :disabled="guardandoObjetivos"
            style="font-size: 0.8rem; font-weight: 800; padding: 4px 14px; display: flex; align-items: center; gap: 0.35rem;"
          >
            <i class="ph ph-spinner spinner" v-if="guardandoObjetivos"></i>
            <i class="ph ph-floppy-disk" v-else></i> Guardar Objetivos
          </button>
        </div>

      </div>
    </div>

    <!-- Indicadores / Mensajes de Feedback -->
    <div v-if="notificacion" class="card" :style="estiloNotificacion" style="padding: 0.5rem 0.85rem; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 700; display: flex; justify-content: space-between; align-items: center;">
      <span>{{ notificacion.texto }}</span>
      <button @click="notificacion = null" style="background: none; border: none; cursor: pointer;"><i class="ph ph-x"></i></button>
    </div>

    <!-- Indicador de Carga -->
    <div v-if="loading" style="text-align: center; padding: 2rem; background: var(--bg-window); border: 1.5px solid var(--bevel-dark); margin-bottom: 0.5rem;">
      <i class="ph ph-spinner spinner" style="font-size: 2.2rem; color: var(--accent-primary); margin-bottom: 0.5rem;"></i>
      <h3 style="margin: 0; font-size: 1rem; font-weight: bold; color: var(--text-primary);">Consultando stock en {{ selectedSiteIds.length }} sucursales...</h3>
    </div>

    <!-- Mensaje de Error -->
    <div v-else-if="errorMessage" class="card" style="padding: 0.6rem 0.85rem; border: 1.5px solid #ef4444; background: #fef2f2; margin-bottom: 0.5rem; color: #991b1b; font-size: 0.85rem;">
      <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 800;">
        <i class="ph ph-warning-circle" style="font-size: 1.2rem;"></i> {{ errorMessage }}
      </div>
    </div>

    <!-- Resultados en Tabla Matriz o Plan de Reposición -->
    <template v-else-if="reportData">
      
      <!-- KPIs Resumen Compactos -->
      <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.4rem; flex-wrap: wrap;">
        <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-secondary);">
          <strong style="color: var(--text-primary);">{{ filteredItems.length }}</strong> productos | 
          <strong style="color: #0284c7;">{{ activeSelectedSites.length }}</strong> sucursales consultadas
        </div>

        <div style="width: 220px; margin-left: auto;">
          <input 
            type="text" 
            v-model="searchTerm" 
            placeholder="Filtrar en la tabla..." 
            class="form-control" 
            style="font-size: 0.8rem; font-weight: 600; height: 28px; border: 1.5px solid var(--bevel-dark);"
          />
        </div>
      </div>

      <!-- VISTA 1: MODO MATRIZ DE STOCK -->
      <div v-if="!modoReposicion" class="table-container" style="border: 1.5px solid var(--bevel-dark); background: var(--bg-window); overflow-x: auto; max-height: calc(100vh - 230px);">
        <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead style="position: sticky; top: 0; z-index: 10; background: var(--bg-secondary);">
            <tr style="border-bottom: 1px solid var(--bevel-dark); font-size: 0.76rem; text-transform: uppercase;">
              <th rowspan="2" style="padding: 0.4rem 0.6rem; text-align: center; width: 85px; vertical-align: middle;">Código</th>
              <th rowspan="2" style="padding: 0.4rem 0.6rem; text-align: left; min-width: 200px; vertical-align: middle;">Nombre del Producto</th>
              
              <!-- PRIMERA COLUMNA FIJA: Stock CD (Ubicación Actual) -->
              <th colspan="2" style="padding: 0.4rem 0.6rem; text-align: center; background: #e0f2fe; color: #0369a1; border-right: 2px solid var(--bevel-dark);">
                Stock CD
              </th>

              <!-- Columnas Dinámicas para cada Sucursal -->
              <th 
                v-for="site in activeSelectedSites" 
                :key="site.siteId"
                colspan="2"
                style="padding: 0.4rem 0.6rem; text-align: center; border-right: 1px solid var(--bevel-dark); white-space: nowrap;"
              >
                🏢 {{ site.nombre }}
              </th>
            </tr>
            <tr style="border-bottom: 1.5px solid var(--bevel-dark); font-size: 0.7rem; text-transform: uppercase; background: var(--bg-secondary);">
              <th style="padding: 0.25rem 0.4rem; text-align: right; background: #e0f2fe; color: #0369a1;">Peso (kg)</th>
              <th style="padding: 0.25rem 0.4rem; text-align: right; background: #e0f2fe; color: #0369a1; border-right: 2px solid var(--bevel-dark);">Piezas</th>

              <template v-for="site in activeSelectedSites" :key="'sub-m-' + site.siteId">
                <th style="padding: 0.25rem 0.4rem; text-align: right; color: var(--text-secondary);">Peso (kg)</th>
                <th style="padding: 0.25rem 0.4rem; text-align: right; color: var(--text-secondary); border-right: 1px solid var(--bevel-dark);">Piezas</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in filteredItems" 
              :key="item.codigo"
              style="border-bottom: 1px solid var(--bevel-dark); font-size: 0.83rem;"
              class="matrix-row"
            >
              <!-- 1. Código SKU -->
              <td style="padding: 0.35rem 0.6rem; text-align: center; font-family: monospace; font-weight: 800; color: var(--accent-primary); font-size: 0.88rem;">
                {{ item.codigo }}
              </td>

              <!-- 2. Nombre del Producto -->
              <td style="padding: 0.35rem 0.6rem; font-weight: 700; color: var(--text-primary);">
                {{ item.nombre }}
              </td>

              <!-- 3. Stock Ubicación CD: Peso y Piezas -->
              <td 
                style="padding: 0.35rem 0.5rem; text-align: right; font-weight: 900; font-size: 0.84rem; background: rgba(224, 242, 254, 0.3); white-space: nowrap;"
                :style="{ color: (item.stockLocal > 0) ? '#0284c7' : 'var(--text-muted)' }"
              >
                {{ formatPeso(item.stockLocal) }}
              </td>
              <td 
                style="padding: 0.35rem 0.5rem; text-align: right; font-weight: 800; font-size: 0.84rem; background: rgba(224, 242, 254, 0.3); border-right: 2px solid var(--bevel-dark); white-space: nowrap;"
                :style="{ color: (item.stockLocal > 0) ? '#0284c7' : 'var(--text-muted)' }"
              >
                {{ formatPiezas(item.stockLocal, item) }}
              </td>

              <!-- 4. Stock Sucursales: Peso y Piezas -->
              <template v-for="site in activeSelectedSites" :key="site.siteId">
                <td 
                  style="padding: 0.35rem 0.5rem; text-align: right; font-weight: 800; font-size: 0.84rem; white-space: nowrap;"
                  :style="{
                    color: (item.stocks[site.siteId] > 0) ? '#16a34a' : 'var(--text-muted)',
                    opacity: (item.stocks[site.siteId] > 0) ? 1 : 0.45
                  }"
                >
                  {{ formatPeso(item.stocks[site.siteId]) }}
                </td>
                <td 
                  style="padding: 0.35rem 0.5rem; text-align: right; font-weight: 700; font-size: 0.84rem; border-right: 1px solid var(--bevel-dark); white-space: nowrap;"
                  :style="{
                    color: (item.stocks[site.siteId] > 0) ? '#16a34a' : 'var(--text-muted)',
                    opacity: (item.stocks[site.siteId] > 0) ? 1 : 0.45
                  }"
                >
                  {{ formatPiezas(item.stocks[site.siteId], item) }}
                </td>
              </template>
            </tr>

            <tr v-if="filteredItems.length === 0">
              <td :colspan="activeSelectedSites.length * 2 + 4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
                No se encontraron productos en el catálogo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- VISTA 2: MODO PLAN DE REPOSICIÓN -->
      <div v-else class="table-container" style="border: 1.5px solid #0284c7; background: var(--bg-window); overflow-x: auto; max-height: calc(100vh - 270px);">
        <table class="win-table" style="width: 100%; border-collapse: collapse; font-family: 'Nunito', sans-serif;">
          <thead style="position: sticky; top: 0; z-index: 10; background: #f0f9ff;">
            <tr style="border-bottom: 1px solid #0284c7; font-size: 0.76rem; text-transform: uppercase;">
              <th rowspan="2" style="padding: 0.4rem 0.6rem; text-align: center; width: 85px; vertical-align: middle;">Código</th>
              <th rowspan="2" style="padding: 0.4rem 0.6rem; text-align: left; min-width: 180px; vertical-align: middle;">Producto</th>
              
              <!-- Stock CD (2 sub-columnas) -->
              <th colspan="2" style="padding: 0.4rem 0.6rem; text-align: center; background: #e0f2fe; color: #0369a1; border-right: 2px solid var(--bevel-dark);">
                Stock CD
              </th>

              <!-- Grupo de columnas por Sucursal (7 sub-columnas) -->
              <th 
                v-for="site in activeSelectedSites" 
                :key="site.siteId"
                colspan="7"
                style="padding: 0.4rem 0.6rem; text-align: center; border-left: 2px solid var(--bevel-dark); border-right: 2px solid var(--bevel-dark); background: #e2e8f0; color: #1e293b;"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem;">
                  <span>🏢 {{ site.nombre }}</span>
                  <button 
                    type="button"
                    class="win-dialog-btn win-dialog-btn-ok"
                    @click="generarPedidoSucursal(site)"
                    style="font-size: 0.7rem; font-weight: 800; padding: 2px 6px;"
                    title="Crear pedido de reposición para esta sucursal"
                  >
                    <i class="ph ph-truck"></i> Pedir
                  </button>
                </div>
              </th>
            </tr>
            <tr style="border-bottom: 1.5px solid #0284c7; font-size: 0.7rem; text-transform: uppercase; background: #f8fafc;">
              <th style="padding: 0.25rem 0.4rem; text-align: right; background: #e0f2fe; color: #0369a1;">Peso (kg)</th>
              <th style="padding: 0.25rem 0.4rem; text-align: right; background: #e0f2fe; color: #0369a1; border-right: 2px solid var(--bevel-dark);">Piezas</th>
              
              <template v-for="site in activeSelectedSites" :key="'sub-' + site.siteId">
                <th style="padding: 0.25rem 0.4rem; text-align: right; min-width: 85px; color: #0284c7; border-left: 2px solid var(--bevel-dark);">Objetivo (kg)</th>
                <th style="padding: 0.25rem 0.4rem; text-align: right; min-width: 80px; color: #475569;">Actual (kg)</th>
                <th style="padding: 0.25rem 0.4rem; text-align: right; min-width: 75px; color: #475569;">Actual (pzs)</th>
                <th style="padding: 0.25rem 0.4rem; text-align: right; min-width: 85px; color: #d97706;">Faltante (+10%) (kg)</th>
                <th style="padding: 0.25rem 0.4rem; text-align: right; min-width: 80px; color: #d97706;">Faltante (pzs)</th>
                <th style="padding: 0.25rem 0.4rem; text-align: right; min-width: 85px; color: #15803d;">Sugerido (kg)</th>
                <th style="padding: 0.25rem 0.4rem; text-align: right; min-width: 80px; color: #15803d; border-right: 2px solid var(--bevel-dark);">Sugerido (pzs)</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="item in filteredItems" 
              :key="'rep-' + item.codigo"
              style="border-bottom: 1px solid var(--bevel-dark); font-size: 0.83rem;"
              class="matrix-row"
            >
              <!-- 1. Código SKU -->
              <td style="padding: 0.35rem 0.6rem; text-align: center; font-family: monospace; font-weight: 800; color: var(--accent-primary);">
                {{ item.codigo }}
              </td>

              <!-- 2. Nombre del Producto -->
              <td style="padding: 0.35rem 0.6rem; font-weight: 700; color: var(--text-primary);">
                {{ item.nombre }}
              </td>

              <!-- 3. Stock Ubicación CD: Peso y Piezas -->
              <td 
                style="padding: 0.35rem 0.5rem; text-align: right; font-weight: 900; font-size: 0.84rem; background: rgba(224, 242, 254, 0.3); white-space: nowrap;"
                :style="{ color: (item.stockLocal > 0) ? '#0284c7' : 'var(--text-muted)' }"
              >
                {{ formatPeso(item.stockLocal) }}
              </td>
              <td 
                style="padding: 0.35rem 0.5rem; text-align: right; font-weight: 800; font-size: 0.84rem; background: rgba(224, 242, 254, 0.3); border-right: 2px solid var(--bevel-dark); white-space: nowrap;"
                :style="{ color: (item.stockLocal > 0) ? '#0284c7' : 'var(--text-muted)' }"
              >
                {{ formatPiezas(item.stockLocal, item) }}
              </td>

              <!-- Columnas de Reposición por Sucursal (7 sub-columnas) -->
              <template v-for="site in activeSelectedSites" :key="'rep-cols-' + site.siteId">
                
                <!-- 1. Stock Objetivo Editable (Meta) -->
                <td style="padding: 0.25rem 0.4rem; text-align: right; border-left: 2px solid var(--bevel-dark);">
                  <input 
                    type="number" 
                    v-model.number="item.stockObjetivos[site.siteId]" 
                    @input="recalcularFaltantesItem(item, site.siteId)"
                    step="0.001"
                    min="0"
                    :disabled="item.permisos && item.permisos[site.siteId] === false"
                    :placeholder="item.permisos && item.permisos[site.siteId] === false ? 'N/A' : '0'"
                    style="width: 75px; height: 26px; text-align: right; font-weight: 800; font-size: 0.8rem; border-radius: 3px; transition: all 0.2s ease;"
                    :style="{
                      background: (item.permisos && item.permisos[site.siteId] === false) ? '#e2e8f0' : '#fff',
                      color: (item.permisos && item.permisos[site.siteId] === false) ? '#94a3b8' : 'var(--text-primary)',
                      borderColor: (item.permisos && item.permisos[site.siteId] === false) ? '#cbd5e1' : '#7dd3fc',
                      cursor: (item.permisos && item.permisos[site.siteId] === false) ? 'not-allowed' : 'text'
                    }"
                    :title="item.permisos && item.permisos[site.siteId] === false ? 'Producto NO habilitado para esta sucursal' : 'Kilos objetivo deseados tras la reposición'"
                  />
                </td>

                <!-- 2. Actual (kg) -->
                <td style="padding: 0.35rem 0.4rem; text-align: right; font-weight: 800; white-space: nowrap;" :style="{ color: item.stocks[site.siteId] > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }">
                  {{ formatPeso(item.stocks[site.siteId]) }}
                </td>

                <!-- 3. Actual (pzs) -->
                <td style="padding: 0.35rem 0.4rem; text-align: right; font-weight: 700; white-space: nowrap;" :style="{ color: item.stocks[site.siteId] > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }">
                  {{ formatPiezas(item.stocks[site.siteId], item) }}
                </td>

                <!-- 4. Faltante (+10%) (kg) -->
                <td style="padding: 0.35rem 0.4rem; text-align: right; font-weight: 900; white-space: nowrap;" :style="{ color: item.faltantes[site.siteId] > 0 ? '#d97706' : 'var(--text-muted)' }">
                  {{ formatPeso(item.faltantes[site.siteId]) }}
                </td>

                <!-- 5. Faltante (+10%) (pzs) -->
                <td style="padding: 0.35rem 0.4rem; text-align: right; font-weight: 800; white-space: nowrap;" :style="{ color: item.faltantes[site.siteId] > 0 ? '#d97706' : 'var(--text-muted)' }">
                  {{ formatPiezas(item.faltantes[site.siteId], item) }}
                </td>

                <!-- 6. Sugerencia Envío (kg) -->
                <td 
                  style="padding: 0.35rem 0.4rem; text-align: right; font-weight: 900; white-space: nowrap;"
                  :style="{
                    background: item.sugerencias[site.siteId] > 0 ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                    color: item.sugerencias[site.siteId] > 0 ? '#15803d' : 'var(--text-muted)'
                  }"
                >
                  {{ formatPeso(item.sugerencias[site.siteId]) }}
                </td>

                <!-- 7. Sugerencia Envío (pzs) -->
                <td 
                  style="padding: 0.35rem 0.4rem; text-align: right; font-weight: 800; border-right: 2px solid var(--bevel-dark); white-space: nowrap;"
                  :style="{
                    background: item.sugerencias[site.siteId] > 0 ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                    color: item.sugerencias[site.siteId] > 0 ? '#15803d' : 'var(--text-muted)'
                  }"
                >
                  {{ formatPiezas(item.sugerencias[site.siteId], item) }}
                </td>

              </template>
            </tr>

            <tr v-if="filteredItems.length === 0">
              <td :colspan="activeSelectedSites.length * 7 + 4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
                No se encontraron productos en el catálogo.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Estado Inicial sin búsqueda -->
    <div v-else-if="!reportData && !loading" class="card p-3 text-center" style="border: 1.5px solid var(--bevel-dark); background: var(--bg-window); padding: 1.5rem 1rem;">
      <i class="ph ph-storefront" style="font-size: 2.2rem; color: var(--text-muted); opacity: 0.5;"></i>
      <h4 style="margin: 0.5rem 0 0.15rem 0; font-weight: 800; color: var(--text-primary);">Seleccione las Sucursales a Consultar</h4>
      <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary);">
        Marque los checkboxes de las sucursales deseadas y presione <strong>"Consultar Stock"</strong>.
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import { calcularPiezasProducto } from '../utils/calculoPiezas'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const codigoProducto = ref('')
const loading = ref(false)
const loadingSites = ref(false)
const errorMessage = ref('')
const reportData = ref(null)
const searchTerm = ref('')
const inputCodigo = ref(null)

const availableSites = ref([])
const selectedSiteIds = ref([])

const modoReposicion = ref(false)
const guardandoObjetivos = ref(false)
const calculandoHistorico = ref(false)
const diasHistorico = ref(14)
const factorCobertura = ref(14)

const notificacion = ref(null)

const estiloNotificacion = computed(() => {
  if (!notificacion.value) return {}
  if (notificacion.value.tipo === 'success') {
    return { border: '1.5px solid #16a34a', background: '#f0fdf4', color: '#15803d' }
  }
  return { border: '1.5px solid #0284c7', background: '#f0f9ff', color: '#0369a1' }
})

// Formatear celda mostrando "peso kg | X pzs"
const formatCellStock = (stockVal, item) => {
  const peso = parseFloat(stockVal) || 0
  if (peso <= 0) return '-'
  const pzs = calcularPiezasProducto(peso, item)
  const pesoStr = `${peso.toFixed(3)} kg`
  if (pzs > 0) {
    return `${pesoStr} | ${pzs} pzs`
  }
  return pesoStr
}

const formatPeso = (stockVal) => {
  const peso = parseFloat(stockVal) || 0
  if (peso <= 0) return '-'
  return `${peso.toFixed(3)} kg`
}

const formatPiezas = (stockVal, item) => {
  const peso = parseFloat(stockVal) || 0
  if (peso <= 0) return '-'
  const pzs = calcularPiezasProducto(peso, item)
  if (pzs > 0) {
    return `${pzs} pzs`
  }
  return '-'
}

const recalcularFaltantesItem = (item, siteId) => {
  if (!item.stockObjetivos) item.stockObjetivos = {}
  if (!item.faltantes) item.faltantes = {}
  if (!item.sugerencias) item.sugerencias = {}

  // Si no está permitido para esta sucursal, no se calcula ni sugiere
  if (item.permisos && item.permisos[siteId] === false) {
    item.stockObjetivos[siteId] = 0
    item.faltantes[siteId] = 0
    item.sugerencias[siteId] = 0
    return
  }

  const objVal = Math.max(0, parseFloat(item.stockObjetivos[siteId]) || 0)
  const actualVal = parseFloat(item.stocks[siteId]) || 0

  // Fórmula: (Stock objetivo - Stock actual) * 1.10. Si es < 0, entregar 0.
  const diff = objVal - actualVal
  let faltanteVal = 0
  if (diff > 0) {
    faltanteVal = parseFloat((diff * 1.10).toFixed(3))
  }

  let sugerenciaVal = Math.min(faltanteVal, item.stockLocal || 0)

  // Si la cantidad de piezas/fracciones resultantes es menor a 5, descargar (omitir sugerencia)
  const pzasFrac = calcularPiezasProducto(sugerenciaVal, item)
  const cantFinal = pzasFrac > 0 ? pzasFrac : Math.round(sugerenciaVal)
  if (cantFinal < 5) {
    sugerenciaVal = 0
  }

  item.stockObjetivos[siteId] = objVal
  item.faltantes[siteId] = faltanteVal
  item.sugerencias[siteId] = sugerenciaVal
}

// Cargar la lista de sucursales/sites disponibles desde la API WMS
const userUbicacionId = computed(() => authStore.user?.id_ubicacion || '')

// Cargar la lista de sucursales/sites disponibles desde la API WMS
const cargarSites = async () => {
  loadingSites.value = true
  try {
    const headers = {}
    if (userUbicacionId.value) {
      headers['X-Ubicacion-Id'] = String(userUbicacionId.value)
    }
    const res = await fetch(`/api/wms/sites?id_ubicacion=${userUbicacionId.value}`, { 
      headers,
      suppressGlobalError: true, 
      silentError: true 
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.ok && data.sites && data.sites.length > 0) {
        availableSites.value = data.sites
        selectedSiteIds.value = data.sites.map(s => String(s.siteId))
        return
      }
    }
  } catch (err) {
    console.warn('Error al cargar sites desde API WMS:', err)
  } finally {
    loadingSites.value = false
  }

  // Fallback seguro si la API responde error (filtrando por la ubicación del usuario)
  const allFallbackSites = [
    { siteId: '184934', nombre: '03 - Italia', id_ubicacion: 1 },
    { siteId: '184939', nombre: '09 - Laprida', id_ubicacion: 1 },
    { siteId: '185346', nombre: '12 - Córdoba', id_ubicacion: 1 },
    { siteId: '185350', nombre: '16 - Ameghino', id_ubicacion: 1 },
    { siteId: '185354', nombre: '20 - Sarmiento', id_ubicacion: 1 },
    { siteId: '190463', nombre: '22 - Roca', id_ubicacion: 1 },
    { siteId: '184935', nombre: '05 - Bolívar', id_ubicacion: 2 }
  ]
  const targetUb = userUbicacionId.value ? parseInt(userUbicacionId.value, 10) : 1
  const filteredFallback = allFallbackSites.filter(s => s.id_ubicacion === targetUb)

  availableSites.value = filteredFallback.length > 0 ? filteredFallback : allFallbackSites
  selectedSiteIds.value = availableSites.value.map(s => String(s.siteId))
}

const seleccionarTodosSites = () => {
  selectedSiteIds.value = availableSites.value.map(s => String(s.siteId))
}

const deseleccionarTodosSites = () => {
  selectedSiteIds.value = []
}

const limpiarBusquedaProducto = () => {
  codigoProducto.value = ''
}

const activeSelectedSites = computed(() => {
  if (!availableSites.value || availableSites.value.length === 0) return []
  return availableSites.value.filter(s => selectedSiteIds.value.includes(String(s.siteId)))
})

const consultarStockSucursales = async () => {
  if (selectedSiteIds.value.length === 0) {
    errorMessage.value = 'Debe seleccionar al menos una sucursal en los checkboxes.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  reportData.value = null

  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    if (userUbicacionId.value) {
      headers['X-Ubicacion-Id'] = String(userUbicacionId.value)
    }

    const res = await fetch('/api/wms/stock-matriz-sucursales', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        siteIds: selectedSiteIds.value,
        codigoProducto: codigoProducto.value.trim(),
        id_ubicacion: userUbicacionId.value
      }),
      suppressGlobalError: true
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Error HTTP ${res.status} al consultar Block WMS`)
    }

    const data = await res.json()
    reportData.value = data
  } catch (err) {
    console.error('Error al consultar stock matricial por sucursales:', err)
    errorMessage.value = err.message || 'Error al conectar con el servidor backend / Block WMS.'
  } finally {
    loading.value = false
  }
}

const guardarObjetivos = async () => {
  if (!reportData.value || !reportData.value.items) return
  guardandoObjetivos.value = true
  notificacion.value = null

  try {
    const itemsToSave = []
    reportData.value.items.forEach(item => {
      activeSelectedSites.value.forEach(site => {
        if (item.permisos && item.permisos[site.siteId] === false) return
        const objVal = parseFloat(item.stockObjetivos?.[site.siteId]) || 0
        itemsToSave.push({
          site_id: String(site.siteId),
          codigo_producto: item.codigo,
          stock_objetivo: objVal
        })
      })
    })

    const res = await fetch('/api/wms/guardar-stock-objetivos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsToSave })
    })

    const data = await res.json()
    if (data.ok) {
      notificacion.value = { tipo: 'success', texto: `¡Stock Objetivos guardados exitosamente (${data.count} registros)!` }
    } else {
      throw new Error(data.error || 'Error al guardar objetivos')
    }
  } catch (err) {
    notificacion.value = { tipo: 'error', texto: `Error: ${err.message}` }
  } finally {
    guardandoObjetivos.value = false
  }
}

const calcularHistorico = async () => {
  calculandoHistorico.value = true
  notificacion.value = null

  try {
    const res = await fetch('/api/wms/calcular-stock-objetivo-historico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteIds: selectedSiteIds.value,
        dias: diasHistorico.value,
        factorDiasCobertura: factorCobertura.value,
        autoGuardar: true
      })
    })

    const data = await res.json()
    if (data.ok && data.resultados) {
      reportData.value.items.forEach(item => {
        activeSelectedSites.value.forEach(site => {
          const sugVal = data.resultados[site.siteId]?.[item.codigo] || 0
          if (sugVal > 0) {
            item.stockObjetivos[site.siteId] = sugVal
            recalcularFaltantesItem(item, site.siteId)
          }
        })
      })
      notificacion.value = { tipo: 'success', texto: `¡Objetivos recalculados y guardados en base al consumo de los últimos ${diasHistorico.value} días!` }
    } else {
      throw new Error(data.error || 'Error al calcular histórico')
    }
  } catch (err) {
    notificacion.value = { tipo: 'error', texto: `Error: ${err.message}` }
  } finally {
    calculandoHistorico.value = false
  }
}

const generarPedidoSucursal = async (site) => {
  if (!reportData.value || !reportData.value.items) return

  const itemsConEnvio = reportData.value.items.filter(i => {
    const sug = i.sugerencias?.[site.siteId] || 0
    if (sug <= 0) return false
    const pzas = calcularPiezasProducto(sug, i)
    const cant = pzas > 0 ? pzas : Math.round(sug)
    return cant >= 5
  }).map(i => ({
    codigo_producto: i.codigo,
    peso_sugerido: i.sugerencias[site.siteId],
    piezas_sugeridas: calcularPiezasProducto(i.sugerencias[site.siteId], i)
  }))

  if (itemsConEnvio.length === 0) {
    alert(`No hay productos con sugerencia de envío mayor a 0 para la sucursal ${site.nombre}.`)
    return
  }

  if (!confirm(`¿Desea generar la orden de pedido de reposición para ${site.nombre} con ${itemsConEnvio.length} productos?`)) {
    return
  }

  try {
    const res = await fetch('/api/wms/generar-pedido-reposicion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: site.siteId,
        sucursalNombre: site.nombre,
        items: itemsConEnvio
      })
    })

    const data = await res.json()
    if (data.ok) {
      notificacion.value = { tipo: 'success', texto: `🚚 ${data.mensaje}` }
    } else {
      throw new Error(data.error || 'Error al generar pedido de reposición')
    }
  } catch (err) {
    alert(`Error al generar pedido: ${err.message}`)
  }
}

const filteredItems = computed(() => {
  if (!reportData.value || !reportData.value.items) return []
  if (!searchTerm.value.trim()) return reportData.value.items

  const q = searchTerm.value.trim().toLowerCase()
  return reportData.value.items.filter(i => 
    String(i.codigo).toLowerCase().includes(q) ||
    String(i.nombre).toLowerCase().includes(q)
  )
})

const exportarExcel = () => {
  if (!reportData.value || !reportData.value.items || reportData.value.items.length === 0) return

  const sitesList = activeSelectedSites.value

  const rows = filteredItems.value.map(i => {
    const rowObj = {
      'Código SKU': i.codigo,
      'Nombre del Producto': i.nombre,
      'Stock CD (kg)': formatPeso(i.stockLocal),
      'Stock CD (pzs)': formatPiezas(i.stockLocal, i)
    }

    sitesList.forEach(s => {
      rowObj[`Stock Actual ${s.nombre} (kg)`] = formatPeso(i.stocks[s.siteId])
      rowObj[`Stock Actual ${s.nombre} (pzs)`] = formatPiezas(i.stocks[s.siteId], i)
      if (modoReposicion.value) {
        rowObj[`Stock Objetivo ${s.nombre} (kg)`] = `${i.stockObjetivos?.[s.siteId] || 0} kg`
        rowObj[`Faltante (+10%) ${s.nombre} (kg)`] = formatPeso(i.faltantes?.[s.siteId] || 0)
        rowObj[`Faltante (+10%) ${s.nombre} (pzs)`] = formatPiezas(i.faltantes?.[s.siteId] || 0, i)
        rowObj[`Sugerencia Envío ${s.nombre} (kg)`] = formatPeso(i.sugerencias?.[s.siteId] || 0)
        rowObj[`Sugerencia Envío ${s.nombre} (pzs)`] = formatPiezas(i.sugerencias?.[s.siteId] || 0, i)
      }
    })

    return rowObj
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, modoReposicion.value ? 'Plan Reposicion' : 'Stock Sucursales')
  XLSX.writeFile(wb, `${modoReposicion.value ? 'Plan_Reposicion' : 'Stock_Sucursales'}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

onMounted(async () => {
  await cargarSites()
})
</script>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
.matrix-row:hover {
  background-color: var(--bg-secondary) !important;
}
</style>
