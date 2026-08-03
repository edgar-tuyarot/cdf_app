<template>
  <div class="page-container animate-fade">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Ingreso de Mercadería</h2>
        <p class="page-description">Registra el alta de piezas en el stock central, ya sea provenientes de proveedores externos o devueltas desde las sucursales.</p>
      </div>
      <div class="header-actions mt-2">
        <button class="btn btn-secondary" @click="fetchInitialData" :disabled="loadingIngresos || loadingProducts || loadingProveedores || loadingSucursales">
          <i class="ph ph-spinner spinner" v-if="loadingIngresos || loadingProducts || loadingProveedores || loadingSucursales"></i>
          <i class="ph ph-arrows-clockwise" v-else></i> Actualizar Datos
        </button>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="alert.show" :class="['alert-box mb-4', alert.type]">
      <div class="alert-icon">
        <i class="ph ph-info" v-if="alert.type === 'info'"></i>
        <i class="ph ph-check-circle" v-if="alert.type === 'success'"></i>
        <i class="ph ph-warning-circle" v-if="alert.type === 'error'"></i>
      </div>
      <div class="alert-message">
        {{ alert.message }}
      </div>
      <button class="alert-close" @click="alert.show = false">
        <i class="ph ph-x"></i>
      </button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      
      <!-- CONTROLES Y FORMULARIO DE ALTA -->
      <div class="card">
        <div class="card-header" style="background-color: #0b5394; display: flex; justify-content: space-between; align-items: center;">
          <span class="card-title" style="color: white; font-weight: bold;">Formulario de Ingreso de Mercadería</span>
          
          <!-- Selector de Origen (Toggle) -->
          <div style="display: flex; background: rgba(0,0,0,0.25); border-radius: 4px; padding: 2px;">
            <button 
              type="button"
              :class="['btn', form.tipoIngreso === 'lote_proveedor' ? 'btn-primary' : 'btn-secondary']"
              style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border: none; font-weight: bold; border-radius: 2px;"
              @click="setTipoIngreso('lote_proveedor')"
            >
              <i class="ph ph-truck"></i> Proveedor (Lote/Factura)
            </button>
            <button 
              type="button"
              :class="['btn', form.tipoIngreso === 'sucursal' ? 'btn-primary' : 'btn-secondary']"
              style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border: none; font-weight: bold; border-radius: 2px;"
              @click="setTipoIngreso('sucursal')"
            >
              <i class="ph ph-storefront"></i> Sucursal (Manual)
            </button>
          </div>
        </div>

        <div class="card-body">
          <form @submit.prevent="submitForm">
            <div style="display: grid; grid-template-columns: 1fr; gap: 1.25rem;">
              
              <!-- Proveedor (Si es lote de Proveedor) -->
              <div v-if="form.tipoIngreso === 'lote_proveedor'" class="form-group">
                <label class="form-label">Proveedor / Fabricante *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-truck" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none; z-index: 10;"></i>
                  <select 
                    v-model="form.proveedor_id" 
                    class="form-control" 
                    required 
                    style="padding-left: 2.2rem; height: 34px;"
                    :disabled="previewItems.length > 0"
                    @change="handleProveedorChange"
                  >
                    <option value="" disabled>Seleccione un proveedor...</option>
                    <option 
                      v-for="prov in proveedores" 
                      :key="prov.id" 
                      :value="prov.id"
                    >
                      {{ prov.nombre }}
                    </option>
                  </select>
                </div>
                <span v-if="previewItems.length > 0" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">
                  <i class="ph ph-info"></i> No se puede cambiar de proveedor mientras haya artículos en la tabla previa.
                </span>
              </div>

              <!-- Sucursal (Si es ingreso de Sucursal) -->
              <div v-else-if="form.tipoIngreso === 'sucursal'" class="form-group">
                <label class="form-label">Sucursal de Origen *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <i class="ph ph-storefront" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none; z-index: 10;"></i>
                  <select 
                    v-model="form.sucursal_id" 
                    class="form-control" 
                    required 
                    style="padding-left: 2.2rem; height: 34px;"
                  >
                    <option value="" disabled>Seleccione la sucursal de origen...</option>
                    <option 
                      v-for="suc in sucursales" 
                      :key="suc.id" 
                      :value="suc.id"
                    >
                      {{ suc.numero ? `Sucursal ${suc.numero} - ${suc.sucursal}` : suc.sucursal }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- ÁREA DE CARGA DE ARTÍCULOS PARA EL LOTE (PROVEEDOR) -->
              <div v-if="form.tipoIngreso === 'lote_proveedor' && form.proveedor_id" style="border: 1px solid var(--bevel-dark); border-radius: 4px; padding: 1rem; background-color: var(--bg-secondary); display: flex; flex-direction: column; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--bevel-dark); padding-bottom: 0.5rem;">
                  <span style="font-weight: bold; color: #0b5394; font-size: 0.9rem;">Carga de Artículos al Lote</span>
                  
                  <!-- Selector de Modo de Carga (Bulto / Unidad) -->
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: bold;">Modo:</span>
                    <div style="display: flex; background: rgba(0,0,0,0.1); border-radius: 4px; padding: 2px;">
                      <button 
                        type="button"
                        :class="['btn', itemForm.tipo === 'bulto' ? 'btn-primary' : 'btn-secondary']"
                        style="padding: 0.1rem 0.5rem; font-size: 0.7rem; border: none; border-radius: 2px;"
                        @click="setItemFormTipo('bulto')"
                      >
                        Bulto
                      </button>
                      <button 
                        type="button"
                        :class="['btn', itemForm.tipo === 'unidad' ? 'btn-primary' : 'btn-secondary']"
                        style="padding: 0.1rem 0.5rem; font-size: 0.7rem; border: none; border-radius: 2px;"
                        @click="setItemFormTipo('unidad')"
                      >
                        Unidad
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Fila: Búsqueda de Producto -->
                <div class="form-group">
                  <label class="form-label">Producto *</label>
                  <div style="position: relative; display: flex; align-items: center;">
                    <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                    <input 
                      ref="codigoInput"
                      type="text" 
                      v-model="productSearchInput" 
                      list="catalog-products-list" 
                      @input="handleProductInput"
                      @keydown.enter.prevent="onCodigoEnter"
                      class="form-control" 
                      placeholder="Escribe código o nombre del producto para buscar..." 
                      style="padding-left: 2rem; height: 34px;"
                    />
                  </div>
                  <datalist id="catalog-products-list">
                    <option 
                      v-for="p in catalogProducts" 
                      :key="p.codigo" 
                      :value="p.codigo"
                    >
                      {{ p.nombre }}
                    </option>
                  </datalist>
                  
                  <!-- Vista previa del producto seleccionado -->
                  <div 
                    v-if="selectedProduct" 
                    class="selected-product-badge mt-2 animate-fade"
                    style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); color: var(--text-primary); font-size: 0.85rem;"
                  >
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <i class="ph ph-circle-wavy-check text-green" style="font-size: 1.1rem;"></i>
                      <span>
                        Seleccionado: <strong>{{ selectedProduct.nombre }}</strong>
                      </span>
                    </div>
                    <div style="display: flex; gap: 0.75rem; font-size: 0.8rem; font-weight: bold; background: var(--bg-window); padding: 2px 6px; box-shadow: var(--inset-shadow);">
                      <span>Peso unitario: {{ parseFloat(selectedProduct.peso_x_pieza).toFixed(3) }} kg</span>
                      <span>|</span>
                      <span>Stock actual: {{ selectedProduct.cantidad_piezas }} piezas</span>
                      <span>|</span>
                      <span :style="{ color: selectedProduct.pesable !== false ? '#0b5394' : '#c2410c' }">
                        Tipo: {{ selectedProduct.pesable !== false ? 'Pesable (kg)' : 'Unidad (ud)' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Inputs específicos según el modo (Bulto / Unidad) -->
                <div v-if="selectedProduct" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; align-items: end;">
                  
                  <!-- Si es modo Bulto: Selección de Bulto y Cajas -->
                  <div v-if="itemForm.tipo === 'bulto'" class="form-group" style="grid-column: span 1;">
                    <label class="form-label">Tipo de Bulto *</label>
                    <select 
                      ref="bultoInput"
                      v-model="itemForm.bulto_id" 
                      class="form-control" 
                      required 
                      style="height: 34px;"
                      @change="handleItemBultoChange"
                      @keydown.enter.prevent="onBultoEnter"
                    >
                      <option value="" disabled>Seleccione un bulto...</option>
                      <option 
                        v-for="b in filteredBultosByProveedor" 
                        :key="b.id" 
                        :value="b.id"
                      >
                        {{ b.nombre }} ({{ b.cantidad_piezas }} pz / {{ parseFloat(b.peso_caja).toFixed(3) }} kg)
                      </option>
                    </select>
                  </div>

                  <div v-if="itemForm.tipo === 'bulto'" class="form-group">
                    <label class="form-label">Cantidad de Cajas *</label>
                    <input 
                      ref="cantidadInput"
                      type="number" 
                      min="1" 
                      step="1" 
                      v-model.number="itemForm.cantidad_bultos" 
                      class="form-control text-right font-mono" 
                      required 
                      style="font-weight: bold; height: 34px;"
                      @keydown.enter.prevent="onCantidadEnter"
                    />
                  </div>

                  <!-- Si es modo Unidad: Cantidad de piezas -->
                  <div v-else-if="itemForm.tipo === 'unidad'" class="form-group" style="grid-column: span 1;">
                    <label class="form-label">Cantidad de Piezas *</label>
                    <input 
                      ref="cantidadInput"
                      type="number" 
                      min="1" 
                      step="1" 
                      v-model.number="itemForm.piezas" 
                      class="form-control text-right font-mono" 
                      required 
                      style="font-weight: bold; height: 34px;"
                      @keydown.enter.prevent="onCantidadEnter"
                    />
                  </div>

                  <!-- Peso Recibido (Bruto para bultos / Total para unidades) -->
                  <div class="form-group">
                    <label class="form-label">
                      Peso Total Recibido ({{ selectedProduct.pesable === false ? 'unidades' : 'kilos' }}) *
                    </label>
                    <input 
                      ref="pesoInput"
                      type="number" 
                      min="0.001" 
                      :step="selectedProduct.pesable === false ? '1' : '0.001'" 
                      v-model.number="itemForm.peso" 
                      class="form-control text-right font-mono" 
                      required 
                      style="font-weight: bold; height: 34px; color: #0b5394;"
                      @keydown.enter.prevent="onPesoEnter"
                    />
                  </div>

                  <!-- Fecha de Vencimiento -->
                  <div class="form-group">
                    <label class="form-label">Fecha de Vencimiento *</label>
                    <input 
                      ref="vencimientoInput"
                      type="date" 
                      v-model="itemForm.vencimiento" 
                      class="form-control" 
                      required 
                      style="height: 34px;"
                      @keydown.enter.prevent="addItemToPreview"
                    />
                  </div>
                </div>

                <!-- Vista previa de pesos (descuento tara) si es bulto -->
                <div v-if="itemForm.tipo === 'bulto' && selectedBulto" class="animate-fade" style="background: var(--bg-window); border: 1px solid var(--bevel-dark); border-radius: 4px; padding: 0.5rem; font-size: 0.8rem;">
                  <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                    <span>Total piezas estimadas: <strong>{{ itemForm.cantidad_bultos * selectedBulto.cantidad_piezas }} pz</strong></span>
                    <span>Descuento tara (cajas vacías): <strong>-{{ (itemForm.cantidad_bultos * parseFloat(selectedBulto.peso_caja_vacia || 0)).toFixed(3) }} kg</strong></span>
                    <span style="color: #0b5394;">Peso neto estimado: <strong>{{ Math.max(0, itemForm.peso - (itemForm.cantidad_bultos * parseFloat(selectedBulto.peso_caja_vacia || 0))).toFixed(3) }} kg</strong></span>
                  </div>
                </div>

                <div v-if="selectedProduct" style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                  <button 
                    type="button" 
                    class="btn btn-secondary" 
                    style="height: 32px; font-size: 0.8rem; padding: 0 1rem;" 
                    @click="clearItemForm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-primary" 
                    style="height: 32px; font-size: 0.8rem; padding: 0 1.2rem; background-color: var(--accent-success); border-color: var(--accent-success);" 
                    @click="addItemToPreview"
                  >
                    <i class="ph ph-plus"></i> Agregar Artículo
                  </button>
                </div>
              </div>

              <!-- Si es Sucursal (Manual) -->
              <div v-if="form.tipoIngreso === 'sucursal'" style="display: flex; flex-direction: column; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Producto *</label>
                  <div style="position: relative; display: flex; align-items: center;">
                    <i class="ph ph-magnifying-glass" style="position: absolute; left: 0.6rem; color: var(--text-muted); pointer-events: none;"></i>
                    <input 
                      type="text" 
                      v-model="productSearchInput" 
                      list="catalog-products-list" 
                      @input="handleProductInput" 
                      class="form-control" 
                      placeholder="Escribe código o nombre del producto para buscar..." 
                      required 
                      style="padding-left: 2rem; height: 34px;"
                    />
                  </div>
                  <datalist id="catalog-products-list">
                    <option 
                      v-for="p in catalogProducts" 
                      :key="p.codigo" 
                      :value="p.codigo"
                    >
                      {{ p.nombre }}
                    </option>
                  </datalist>
                  
                  <!-- Vista previa del producto seleccionado -->
                  <div 
                    v-if="selectedProduct" 
                    class="selected-product-badge mt-2 animate-fade"
                    style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background-color: var(--accent-success-light); border: 1px solid var(--accent-success); color: var(--text-primary); font-size: 0.85rem;"
                  >
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <i class="ph ph-circle-wavy-check text-green" style="font-size: 1.1rem;"></i>
                      <span>
                        Seleccionado: <strong>{{ selectedProduct.nombre }}</strong>
                      </span>
                    </div>
                    <div style="display: flex; gap: 0.75rem; font-size: 0.8rem; font-weight: bold; background: var(--bg-window); padding: 2px 6px; box-shadow: var(--inset-shadow);">
                      <span>Peso unitario: {{ parseFloat(selectedProduct.peso_x_pieza).toFixed(3) }} kg</span>
                      <span>|</span>
                      <span>Stock actual: {{ selectedProduct.cantidad_piezas }} piezas</span>
                      <span>|</span>
                      <span :style="{ color: selectedProduct.pesable !== false ? '#0b5394' : '#c2410c' }">
                        Tipo: {{ selectedProduct.pesable !== false ? 'Pesable (kg)' : 'Unidad (ud)' }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Fila: Cantidad Piezas e Indicador Peso Recibido -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; align-items: end;">
                  <div class="form-group">
                    <label class="form-label">Cantidad de Piezas a Ingresar *</label>
                    <input 
                      type="number" 
                      min="1" 
                      step="1" 
                      v-model.number="form.piezas" 
                      class="form-control text-right font-mono" 
                      required 
                      style="font-weight: bold; height: 34px;"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      Peso Total Recibido ({{ selectedProduct && selectedProduct.pesable === false ? 'unidades' : 'kilos' }}) *
                    </label>
                    <input 
                      type="number" 
                      min="0.001" 
                      :step="selectedProduct && selectedProduct.pesable === false ? '1' : '0.001'" 
                      v-model.number="form.peso" 
                      class="form-control text-right font-mono" 
                      required 
                      style="font-weight: bold; height: 34px; color: #0b5394;"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">Fecha de Vencimiento *</label>
                    <input 
                      type="date" 
                      v-model="form.vencimiento" 
                      class="form-control" 
                      required 
                      style="height: 34px;"
                    />
                  </div>
                </div>

                <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end;">
                  <button 
                    type="submit" 
                    class="btn btn-primary" 
                    style="width: 100%; height: 38px; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: bold; background-color: var(--accent-success); border-color: var(--accent-success-hover);"
                    :disabled="submitting || !form.codigo || !form.sucursal_id"
                  >
                    <i class="ph ph-spinner spinner" v-if="submitting"></i>
                    <i class="ph ph-floppy-disk" v-else></i>
                    {{ submitting ? 'Registrando Ingreso...' : 'Registrar Ingreso de Sucursal' }}
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>

      <!-- TABLA PREVIA DE ARTÍCULOS EN EL LOTE (PROVEEDOR) -->
      <div v-if="form.tipoIngreso === 'lote_proveedor' && previewItems.length > 0" class="card animate-fade">
        <div class="card-header" style="background-color: #3f51b5; display: flex; justify-content: space-between; align-items: center; color: white;">
          <span class="card-title" style="color: white; font-weight: bold;">Artículos en el Lote Actual</span>
          <button type="button" class="btn btn-secondary" style="padding: 0.2rem 0.6rem; font-size: 0.75rem; border: none; font-weight: bold; border-radius: 2px;" @click="clearPreviewTable">
            <i class="ph ph-trash"></i> Vaciar Lote
          </button>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-container" style="max-height: 300px; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th style="width: 120px;">Código</th>
                  <th>Producto</th>
                  <th style="width: 180px;">Carga</th>
                  <th style="width: 100px; text-align: right;">Piezas</th>
                  <th style="width: 120px; text-align: right;">Peso Bruto</th>
                  <th style="width: 120px; text-align: right;">Peso Neto</th>
                  <th style="width: 120px;">Vencimiento</th>
                  <th style="width: 80px; text-align: center;">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in previewItems" :key="item.id">
                  <td><span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--bevel-dark); font-weight: bold;">{{ item.codigo }}</span></td>
                  <td><strong>{{ item.nombre }}</strong></td>
                  <td>
                    <span :class="['badge', item.tipo === 'bulto' ? 'badge-primary' : 'badge-secondary']" style="font-size: 0.72rem; padding: 2px 6px;">
                      {{ item.tipo === 'bulto' ? 'Bulto' : 'Unidad' }}
                    </span>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 0.4rem;">{{ item.label }}</span>
                  </td>
                  <td style="text-align: right; font-weight: bold;">{{ item.piezas }} pz</td>
                  <td style="text-align: right; font-weight: bold; color: var(--text-secondary);">{{ parseFloat(item.peso).toFixed(3) }} kg</td>
                  <td style="text-align: right; font-weight: bold; color: #0b5394;">{{ parseFloat(item.peso_neto).toFixed(3) }} kg</td>
                  <td><span class="font-mono text-xs">{{ formatDate(item.vencimiento) }}</span></td>
                  <td style="text-align: center;">
                    <button type="button" class="btn btn-secondary" style="padding: 0.1rem 0.3rem; border: none; color: #ef4444; background: transparent; cursor: pointer;" @click="removePreviewItem(index)">
                      <i class="ph ph-trash" style="font-size: 1.1rem;"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Resumen de Totales y Botón de Cierre -->
          <div style="background: var(--bg-secondary); padding: 1rem; border-top: 1px solid var(--bevel-dark); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; font-weight: bold; flex-wrap: wrap;">
              <span>Artículos: <span style="color: #0b5394;">{{ previewItems.length }}</span></span>
              <span>Cajas: <span style="color: #0b5394;">{{ totalCajasPreview }}</span></span>
              <span>Piezas: <span style="color: #0b5394;">{{ totalPiezasPreview }} pz</span></span>
              <span>Peso Neto: <span style="color: #38761d;">{{ totalWeightPreview.toFixed(3) }} kg</span></span>
            </div>
            
            <button 
              type="button" 
              class="btn btn-primary btn-lg" 
              style="padding: 0.5rem 2rem; font-weight: bold; background-color: var(--accent-success); border-color: var(--accent-success);"
              @click="openInvoiceModal"
            >
              <i class="ph ph-check-square"></i> Cerrar Lote (Guardar en BD)
            </button>
          </div>
        </div>
      </div>

      <!-- HISTORIAL PERSISTENTE DE INGRESOS (UNIFICADO) -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background-color: #38761d;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="card-title" style="color: white; font-weight: bold;">Registro Histórico de Ingresos</span>
            
            <!-- Mini-filtro de tipo en el historial -->
            <div style="display: flex; background: rgba(0,0,0,0.25); border-radius: 4px; padding: 2px;">
              <button 
                type="button"
                :class="['btn', historyFilter === 'todos' ? 'btn-primary' : 'btn-secondary']"
                style="padding: 0.1rem 0.4rem; font-size: 0.7rem; border: none; font-radius: 2px;"
                @click="historyFilter = 'todos'"
              >
                Todos
              </button>
              <button 
                type="button"
                :class="['btn', historyFilter === 'proveedor' ? 'btn-primary' : 'btn-secondary']"
                style="padding: 0.1rem 0.4rem; font-size: 0.7rem; border: none; font-radius: 2px;"
                @click="historyFilter = 'proveedor'"
              >
                Proveedores
              </button>
              <button 
                type="button"
                :class="['btn', historyFilter === 'sucursal' ? 'btn-primary' : 'btn-secondary']"
                style="padding: 0.1rem 0.4rem; font-size: 0.7rem; border: none; font-radius: 2px;"
                @click="historyFilter = 'sucursal'"
              >
                Sucursales
              </button>
            </div>
          </div>
          
          <!-- Filtro de Búsqueda Rápida -->
          <div style="display: flex; align-items: center; gap: 0.3rem; background: var(--bg-window); padding: 0.1rem 0.3rem; box-shadow: var(--inset-shadow); height: 26px;">
            <i class="ph ph-magnifying-glass" style="color: var(--text-secondary); font-size: 0.8rem;"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Buscar por origen o producto..." 
              style="border: none; outline: none; font-size: 0.85rem; background: transparent; width: 220px; color: var(--text-primary);"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" style="background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center;">
              <i class="ph ph-x-circle"></i>
            </button>
          </div>
        </div>

        <div class="table-container" style="max-height: 480px; overflow-y: auto;">
          <table v-if="!loadingIngresos && filteredAndSortedIngresos.length > 0">
            <thead>
              <tr>
                <th @click="sortBy('id')" class="sortable" style="width: 70px;">ID <i v-if="sortKey === 'id'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('fecha')" class="sortable" style="width: 140px;">Fecha/Hora <i v-if="sortKey === 'fecha'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('tipo')" class="sortable" style="width: 100px;">Tipo <i v-if="sortKey === 'tipo'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('origen')" class="sortable">Origen <i v-if="sortKey === 'origen'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th>Producto</th>
                <th @click="sortBy('piezas')" class="sortable text-right" style="width: 90px;">Piezas <i v-if="sortKey === 'piezas'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('peso')" class="sortable text-right" style="width: 110px;">Peso <i v-if="sortKey === 'peso'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th @click="sortBy('vencimiento')" class="sortable" style="width: 110px;">Vencimiento <i v-if="sortKey === 'vencimiento'" :class="['ph', sortOrder === 1 ? 'ph-caret-up' : 'ph-caret-down']"></i></th>
                <th style="width: 100px;">Operario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ing in filteredAndSortedIngresos" :key="ing.globalId">
                <td><strong>{{ ing.id }}</strong></td>
                <td><span class="font-mono text-xs">{{ formatDateTime(ing.fecha) }}</span></td>
                <td>
                  <span :class="['badge', ing.tipo === 'Proveedor' ? 'badge-primary' : 'badge-secondary']" style="font-size: 0.72rem; padding: 2px 6px;">
                    {{ ing.tipo }}
                  </span>
                </td>
                <td class="fw-bold">{{ ing.origen }}</td>
                <td>
                  <span class="fw-bold text-xs" style="background: var(--bg-secondary); padding: 1px 4px; border: 1px solid var(--bevel-dark); border-radius: 2px;">
                    {{ ing.codigo_producto }}
                  </span>
                  <div style="font-size: 0.8rem; margin-top: 2px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                    {{ ing.Producto?.nombre || 'Desconocido' }}
                    <span v-if="ing.Bulto" class="badge" style="background-color: var(--accent-success-light); color: var(--accent-success); font-size: 0.7rem; padding: 1px 4px; border: 1px solid var(--accent-success); display: inline-flex; align-items: center; gap: 2px;">
                      <i class="ph ph-box-multiple"></i> {{ ing.Bulto.nombre }} ({{ ing.cantidad_bultos }} bultos)
                    </span>
                    <span v-if="ing.nro_factura" class="badge" style="background-color: #e0f2fe; color: #0369a1; font-size: 0.7rem; padding: 1px 4px; border: 1px solid #bae6fd; display: inline-flex; align-items: center; gap: 2px;">
                      <i class="ph ph-file-text"></i> Factura: {{ ing.nro_factura }}
                    </span>
                  </div>
                </td>
                <td class="text-right fw-bold font-mono">{{ ing.piezas }} pz</td>
                <td class="text-right fw-bold font-mono text-blue">
                  {{ parseFloat(ing.peso).toFixed(3) }} {{ ing.Producto?.pesable !== false ? 'kg' : 'ud' }}
                </td>
                <td>
                  <span :class="['vencimiento-badge font-mono', getVencimientoClass(ing.vencimiento)]">
                    {{ formatDate(ing.vencimiento) }}
                  </span>
                </td>
                <td class="text-center text-xs text-muted">{{ ing.usuario || 'Sistema' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Cargando -->
          <div v-if="loadingIngresos" class="loading-state">
            <i class="ph ph-spinner spinner icon-xl"></i>
            Cargando historial de ingresos...
          </div>

          <!-- Listado Vacío -->
          <div v-if="!loadingIngresos && filteredAndSortedIngresos.length === 0" class="empty-state">
            <i class="ph ph-download-simple icon-xl text-muted"></i>
            No se encontraron ingresos registrados en el historial.
          </div>
        </div>
      </div>

    </div>

    <!-- MODAL PARA NÚMERO DE FACTURA -->
    <div v-if="showInvoiceModal" class="modal-overlay animate-fade" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div class="card" style="width: 400px; box-shadow: var(--shadow-xl); border: 2px solid #0b5394; background: var(--bg-window);">
        <div class="card-header" style="background-color: #0b5394; color: white; display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem;">
          <span style="font-weight: bold; color: white;">Cerrar Lote de Ingreso</span>
          <button type="button" @click="showInvoiceModal = false" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="card-body" style="padding: 1.25rem;">
          <form @submit.prevent="submitBatch">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label">Número de Factura / Remito / Lote *</label>
              <input 
                ref="invoiceNumberInput"
                type="text" 
                v-model="invoiceNumber" 
                class="form-control font-mono text-lg" 
                placeholder="Ej: FACT-0001-00002345" 
                required 
                style="height: 38px; text-transform: uppercase; font-weight: bold;"
              />
            </div>
            
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.25rem; background: var(--bg-secondary); border: 1px solid var(--bevel-dark); padding: 0.5rem; border-radius: 4px;">
              <i class="ph ph-info" style="color: #0284c7;"></i> Se guardarán <strong>{{ previewItems.length }}</strong> artículos con un total de <strong>{{ totalPiezasPreview }}</strong> piezas y <strong>{{ totalWeightPreview.toFixed(3) }} kg</strong> netos.
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button 
                type="button" 
                class="btn btn-secondary" 
                style="height: 36px; padding: 0 1rem;"
                @click="showInvoiceModal = false"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                style="height: 36px; background-color: var(--accent-success); border-color: var(--accent-success); padding: 0 1rem;"
                :disabled="submitting || !invoiceNumber.trim()"
              >
                <i class="ph ph-spinner spinner" v-if="submitting"></i>
                <i class="ph ph-check" v-else></i> Confirmar e Ingresar Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Estado reactivo
const catalogProducts = ref([])
const proveedores = ref([])
const sucursales = ref([])
const ingresos = ref([])
const bultos = ref([])

const loadingProducts = ref(false)
const loadingProveedores = ref(false)
const loadingSucursales = ref(false)
const loadingBultos = ref(false)
const loadingIngresos = ref(false)
const submitting = ref(false)

const productSearchInput = ref('')
const selectedProduct = ref(null)
const selectedBulto = ref(null)

// Variables para lote/recepción previa
const previewItems = ref([])
const invoiceNumber = ref('')
const showInvoiceModal = ref(false)
const lastVencimiento = ref('')

const itemForm = ref({
  tipo: 'bulto', // 'bulto' o 'unidad'
  codigo: '',
  bulto_id: '',
  cantidad_bultos: 1,
  piezas: 1,
  peso: 0,
  vencimiento: ''
})

const invoiceNumberInput = ref(null)
const codigoInput = ref(null)
const bultoInput = ref(null)
const cantidadInput = ref(null)
const pesoInput = ref(null)
const vencimientoInput = ref(null)

const form = ref({
  tipoIngreso: 'lote_proveedor', // 'lote_proveedor' o 'sucursal'
  proveedor_id: '',
  sucursal_id: '',
  codigo: '',
  piezas: 1,
  vencimiento: '',
  peso: 0,
  bulto_id: '',
  cantidad_bultos: 1
})

const alert = ref({ show: false, message: '', type: 'info' })
const searchQuery = ref('')
const historyFilter = ref('todos') // 'todos', 'proveedor', 'sucursal'
const sortKey = ref('fecha')
const sortOrder = ref(-1) // Más reciente primero

// Cambiar tipo de ingreso
const setTipoIngreso = (tipo) => {
  form.value.tipoIngreso = tipo
  
  // Limpiar campos para evitar conflictos
  form.value.codigo = ''
  form.value.piezas = 1
  form.value.vencimiento = ''
  form.value.peso = 0
  form.value.bulto_id = ''
  form.value.cantidad_bultos = 1
  productSearchInput.value = ''
  selectedProduct.value = null
  selectedBulto.value = null
  
  // Limpiar el lote si cambia a sucursal
  if (tipo === 'sucursal') {
    previewItems.value = []
  }
}

const handleProveedorChange = () => {
  clearItemForm()
}

const handleProductInput = () => {
  const code = productSearchInput.value.trim()
  const found = catalogProducts.value.find(p => p.codigo === code)
  if (found) {
    selectedProduct.value = found
    form.value.codigo = found.codigo
    itemForm.value.codigo = found.codigo
  } else {
    selectedProduct.value = null
    form.value.codigo = ''
    itemForm.value.codigo = ''
  }
}

const handleItemBultoChange = () => {
  const found = bultos.value.find(b => b.id === parseInt(itemForm.value.bulto_id, 10))
  if (found) {
    selectedBulto.value = found
    // Alinear producto si no estaba seleccionado
    selectedProduct.value = catalogProducts.value.find(p => p.codigo === found.codigo_producto)
    itemForm.value.codigo = found.codigo_producto
    // Auto-calcular el peso estimado
    itemForm.value.peso = parseFloat((itemForm.value.cantidad_bultos * parseFloat(found.peso_caja)).toFixed(3))
  } else {
    selectedBulto.value = null
  }
}

const setItemFormTipo = (tipo) => {
  itemForm.value.tipo = tipo
  itemForm.value.bulto_id = ''
  itemForm.value.cantidad_bultos = 1
  itemForm.value.piezas = 1
  itemForm.value.peso = 0
  selectedBulto.value = null
  
  // Auto-seleccionar bulto si ya hay un producto seleccionado
  if (selectedProduct.value && tipo === 'bulto') {
    const list = bultos.value.filter(b => b.id_proveedor === parseInt(form.value.proveedor_id, 10) && b.codigo_producto === selectedProduct.value.codigo)
    if (list.length > 0) {
      itemForm.value.bulto_id = list[0].id
      handleItemBultoChange()
    }
  }
}

// Navegación por teclado
const onCodigoEnter = () => {
  if (selectedProduct.value) {
    if (itemForm.value.tipo === 'bulto') {
      const list = filteredBultosByProveedor.value
      if (list.length > 0) {
        if (!itemForm.value.bulto_id) {
          itemForm.value.bulto_id = list[0].id
          handleItemBultoChange()
        }
        if (list.length === 1) {
          cantidadInput.value?.focus()
        } else {
          bultoInput.value?.focus()
        }
      } else {
        showAlert('Este producto no tiene bultos definidos para este proveedor.', 'error')
      }
    } else {
      cantidadInput.value?.focus()
    }
  }
}

const onBultoEnter = () => {
  cantidadInput.value?.focus()
}

const onCantidadEnter = () => {
  pesoInput.value?.focus()
}

const onPesoEnter = () => {
  vencimientoInput.value?.focus()
}

// Agregar artículo a la tabla previa
const addItemToPreview = () => {
  if (itemForm.value.tipo === 'bulto') {
    if (!itemForm.value.bulto_id || itemForm.value.cantidad_bultos <= 0 || !itemForm.value.vencimiento) {
      showAlert('Complete todos los campos del bulto con valores válidos.', 'error')
      return
    }
  } else {
    if (!selectedProduct.value || itemForm.value.piezas <= 0 || itemForm.value.peso <= 0 || !itemForm.value.vencimiento) {
      showAlert('Complete todos los campos del producto con valores válidos.', 'error')
      return
    }
  }

  const p = selectedProduct.value
  const b = selectedBulto.value

  let pieces = 0
  let netWeight = 0
  let labelText = ''

  if (itemForm.value.tipo === 'bulto') {
    pieces = itemForm.value.cantidad_bultos * b.cantidad_piezas
    const totalTare = itemForm.value.cantidad_bultos * parseFloat(b.peso_caja_vacia || 0)
    netWeight = Math.max(0, itemForm.value.peso - totalTare)
    labelText = `${itemForm.value.cantidad_bultos} bulto/s - ${b.nombre}`
  } else {
    pieces = itemForm.value.piezas
    netWeight = itemForm.value.peso
    labelText = `${itemForm.value.piezas} piezas`
  }

  previewItems.value.push({
    id: Date.now() + Math.random(),
    codigo: p.codigo,
    nombre: p.nombre,
    tipo: itemForm.value.tipo,
    bulto_id: itemForm.value.tipo === 'bulto' ? itemForm.value.bulto_id : null,
    cantidad_bultos: itemForm.value.tipo === 'bulto' ? itemForm.value.cantidad_bultos : null,
    bulto_nombre: itemForm.value.tipo === 'bulto' ? b.nombre : null,
    piezas: pieces,
    peso: itemForm.value.peso,
    peso_neto: netWeight,
    vencimiento: itemForm.value.vencimiento,
    label: labelText
  })

  // Guardar última fecha de vencimiento ingresada
  lastVencimiento.value = itemForm.value.vencimiento

  // Limpiar campos para la siguiente carga y hacer foco en el buscador de producto
  itemForm.value.codigo = ''
  itemForm.value.bulto_id = ''
  itemForm.value.cantidad_bultos = 1
  itemForm.value.piezas = 1
  itemForm.value.peso = 0
  itemForm.value.vencimiento = lastVencimiento.value // Retener el vencimiento

  productSearchInput.value = ''
  selectedProduct.value = null
  selectedBulto.value = null

  codigoInput.value?.focus()
}

const removePreviewItem = (index) => {
  previewItems.value.splice(index, 1)
}

const clearPreviewTable = () => {
  previewItems.value = []
}

const clearItemForm = () => {
  itemForm.value.codigo = ''
  itemForm.value.bulto_id = ''
  itemForm.value.cantidad_bultos = 1
  itemForm.value.piezas = 1
  itemForm.value.peso = 0
  itemForm.value.vencimiento = lastVencimiento.value
  productSearchInput.value = ''
  selectedProduct.value = null
  selectedBulto.value = null
}

const openInvoiceModal = () => {
  if (previewItems.value.length === 0) {
    showAlert('No hay artículos en el lote para cerrar.', 'error')
    return
  }
  invoiceNumber.value = ''
  showInvoiceModal.value = true
  setTimeout(() => {
    invoiceNumberInput.value?.focus()
  }, 100)
}

// Confirmar y subir todo el lote al backend
const submitBatch = async () => {
  if (!form.value.proveedor_id) {
    showAlert('Seleccione un proveedor.', 'error')
    return
  }
  if (!invoiceNumber.value.trim()) {
    showAlert('El número de factura es obligatorio.', 'error')
    return
  }

  submitting.value = true
  try {
    const body = {
      proveedor_id: form.value.proveedor_id,
      nro_factura: invoiceNumber.value.trim(),
      usuario: authStore.user?.nombre || 'Sistema',
      items: previewItems.value.map(item => ({
        codigo: item.codigo,
        tipo: item.tipo,
        bulto_id: item.bulto_id,
        cantidad_bultos: item.cantidad_bultos,
        piezas: item.piezas,
        peso: item.peso,
        vencimiento: item.vencimiento
      }))
    }

    const res = await fetch('/api/productos/ingresar-proveedor-lote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const responseData = await res.json()

    if (res.ok) {
      showAlert(responseData.mensaje || 'Ingreso de lote registrado exitosamente.', 'success')
      previewItems.value = []
      invoiceNumber.value = ''
      showInvoiceModal.value = false
      
      // Resetear formulario
      form.value.proveedor_id = ''
      lastVencimiento.value = ''
      
      // Refrescar historial
      await fetchIngresosHistory()
    } else {
      showAlert(responseData.error || 'Error al procesar el lote.', 'error')
    }
  } catch (error) {
    console.error('Error submitting batch:', error)
    showAlert('Error de red al procesar el lote.', 'error')
  } finally {
    submitting.value = false
  }
}

// Envío de Formulario para Sucursal (Manual)
const submitForm = async () => {
  const { tipoIngreso, codigo, piezas, vencimiento, peso, sucursal_id } = form.value

  if (tipoIngreso !== 'sucursal') {
    return // Lote Proveedor se maneja con submitBatch
  }

  if (!codigo || !vencimiento || piezas <= 0 || peso <= 0 || !sucursal_id) {
    showAlert('Complete todos los campos del producto con valores válidos.', 'error')
    return
  }

  submitting.value = true
  try {
    const body = {
      codigo_producto: codigo,
      piezas,
      peso,
      sucursal_id,
      vencimiento,
      usuario: authStore.user?.nombre || 'Sistema'
    }
    const res = await fetch('/api/ingreso-sucursales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const responseData = await res.json()

    if (res.ok) {
      const u = selectedProduct.value?.pesable !== false ? 'kg' : 'ud'
      showAlert(
        `Ingreso de sucursal registrado con éxito: se sumaron ${piezas} piezas (${parseFloat(peso).toFixed(3)} ${u}) de ${selectedProduct.value?.nombre || 'Producto'}.`,
        'success'
      )

      // Limpiar campos específicos
      form.value.codigo = ''
      form.value.piezas = 1
      form.value.peso = 0
      form.value.vencimiento = ''
      productSearchInput.value = ''
      selectedProduct.value = null

      // Refrescar historial
      await fetchIngresosHistory()
    } else {
      showAlert(responseData.error || 'Error al procesar el ingreso de sucursal.', 'error')
    }
  } catch (error) {
    console.error('Error submitting sucursal receipt:', error)
    showAlert('Error de red al procesar el ingreso.', 'error')
  } finally {
    submitting.value = false
  }
}

// Filtro de Bultos por Proveedor y Producto
const filteredBultosByProveedor = computed(() => {
  if (!form.value.proveedor_id) return []
  let list = bultos.value.filter(b => b.id_proveedor === parseInt(form.value.proveedor_id, 10))
  if (selectedProduct.value) {
    list = list.filter(b => b.codigo_producto === selectedProduct.value.codigo)
  }
  return list
})

// Auto-selección de bulto al elegir producto
watch(selectedProduct, (newVal) => {
  if (newVal && form.value.tipoIngreso === 'lote_proveedor' && itemForm.value.tipo === 'bulto') {
    const list = bultos.value.filter(b => b.id_proveedor === parseInt(form.value.proveedor_id, 10) && b.codigo_producto === newVal.codigo)
    if (list.length > 0) {
      itemForm.value.bulto_id = list[0].id
      handleItemBultoChange()
    } else {
      itemForm.value.bulto_id = ''
      selectedBulto.value = null
    }
  }
})

// Totales del lote previo
const totalCajasPreview = computed(() => {
  return previewItems.value.reduce((acc, curr) => {
    return acc + (curr.tipo === 'bulto' ? parseInt(curr.cantidad_bultos, 10) || 0 : 0)
  }, 0)
})

const totalPiezasPreview = computed(() => {
  return previewItems.value.reduce((acc, curr) => {
    return acc + (parseInt(curr.piezas, 10) || 0)
  }, 0)
})

const totalWeightPreview = computed(() => {
  return previewItems.value.reduce((acc, curr) => {
    return acc + (parseFloat(curr.peso_neto) || 0)
  }, 0)
})

// Reactivo: Peso calculado estimado (para modo sucursal)
const calculatedWeight = computed(() => {
  if (!selectedProduct.value) return 0
  const pesoPieza = parseFloat(selectedProduct.value.peso_x_pieza) || 0
  const cantidad = parseInt(form.value.piezas, 10) || 0
  return pesoPieza * cantidad
})

watch(calculatedWeight, (newVal) => {
  if (form.value.tipoIngreso === 'sucursal') {
    form.value.peso = parseFloat(newVal.toFixed(3))
  }
})

// Auto-cálculo de peso en carga de lote
watch(() => itemForm.value.piezas, (newQty) => {
  if (form.value.tipoIngreso === 'lote_proveedor' && itemForm.value.tipo === 'unidad' && selectedProduct.value) {
    const pesoPieza = parseFloat(selectedProduct.value.peso_x_pieza) || 0
    itemForm.value.peso = parseFloat((newQty * pesoPieza).toFixed(3))
  }
})

watch(() => itemForm.value.cantidad_bultos, (newQty) => {
  if (form.value.tipoIngreso === 'lote_proveedor' && itemForm.value.tipo === 'bulto' && selectedBulto.value) {
    const pesoCaja = parseFloat(selectedBulto.value.peso_caja) || 0
    itemForm.value.peso = parseFloat((newQty * pesoCaja).toFixed(3))
  }
})

// Carga Inicial
const fetchInitialData = async () => {
  loadingProducts.value = true
  loadingProveedores.value = true
  loadingSucursales.value = true
  loadingBultos.value = true
  try {
    // 1. Catálogo
    const resProd = await fetch('/api/productos')
    if (resProd.ok) {
      catalogProducts.value = await resProd.json()
    }

    // 2. Proveedores
    const resProv = await fetch('/api/proveedores')
    if (resProv.ok) {
      proveedores.value = await resProv.json()
    }

    // 3. Sucursales
    const resSuc = await fetch('/api/sucursales')
    if (resSuc.ok) {
      sucursales.value = await resSuc.json()
    }

    // 2.5. Bultos
    const resBultos = await fetch('/api/bultos')
    if (resBultos.ok) {
      bultos.value = await resBultos.json()
    }

    // 4. Historial
    await fetchIngresosHistory()
  } catch (error) {
    console.error('Error fetching initial data:', error)
    showAlert('Error de conexión al cargar datos iniciales', 'error')
  } finally {
    loadingProducts.value = false
    loadingProveedores.value = false
    loadingSucursales.value = false
    loadingBultos.value = false
  }
}

// Obtener Historial (Unifica ambos endpoints)
const fetchIngresosHistory = async () => {
  loadingIngresos.value = true
  try {
    const [resProv, resSuc] = await Promise.all([
      fetch('/api/productos/ingresos-proveedores'),
      fetch('/api/ingreso-sucursales')
    ])

    const dataProv = resProv.ok ? await resProv.json() : []
    const dataSuc = resSuc.ok ? await resSuc.json() : []

    // Mapear ingresos de proveedores
    const mappedProv = dataProv.map(item => ({
      ...item,
      globalId: `prov-${item.id}`,
      tipo: 'Proveedor',
      origen: item.Proveedor?.nombre || 'Proveedor Desconocido',
      peso: parseFloat(item.peso_calculado || 0)
    }))

    // Mapear ingresos de sucursales
    const mappedSuc = dataSuc.map(item => ({
      ...item,
      globalId: `suc-${item.id}`,
      tipo: 'Sucursal',
      origen: item.Sucursal ? `Sucursal ${item.Sucursal.numero} - ${item.Sucursal.sucursal}` : 'Sucursal Desconocida',
      peso: parseFloat(item.peso || 0)
    }))

    // Unificar
    ingresos.value = [...mappedProv, ...mappedSuc]
  } catch (error) {
    console.error('Error fetching history:', error)
    showAlert('Error al cargar el historial de ingresos.', 'error')
  } finally {
    loadingIngresos.value = false
  }
}

// Alertas
const showAlert = (message, type = 'success') => {
  alert.value = { show: true, message, type }
  if (type !== 'error') {
    setTimeout(() => {
      alert.value.show = false
    }, 4500)
  }
}

// Formateadores
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const getVencimientoClass = (vencimientoStr) => {
  if (!vencimientoStr) return ''
  const venc = new Date(vencimientoStr)
  const hoy = new Date()
  hoy.setHours(0,0,0,0)
  venc.setHours(0,0,0,0)
  
  const diffDays = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'critical'
  if (diffDays <= 30) return 'warning'
  return 'safe'
}

// Ordenamiento e Historial Filtrado
const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = -sortOrder.value
  } else {
    sortKey.value = key
    sortOrder.value = 1
  }
}

const filteredAndSortedIngresos = computed(() => {
  let list = [...ingresos.value]

  // Filtro de Pestaña/Tipo
  if (historyFilter.value === 'proveedor') {
    list = list.filter(item => item.tipo === 'Proveedor')
  } else if (historyFilter.value === 'sucursal') {
    list = list.filter(item => item.tipo === 'Sucursal')
  }

  // Filtro por Query
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(item => {
      const code = (item.codigo_producto || '').toLowerCase()
      const prodName = (item.Producto?.nombre || '').toLowerCase()
      const origin = (item.origen || '').toLowerCase()
      return code.includes(q) || prodName.includes(q) || origin.includes(q)
    })
  }

  // Ordenamiento
  list.sort((a, b) => {
    let valA = a[sortKey.value]
    let valB = b[sortKey.value]

    // Ajustar campos anidados si se ordenan
    if (sortKey.value === 'Proveedor.nombre') {
      valA = a.origen
      valB = b.origen
    }

    if (valA === undefined) return 1
    if (valB === undefined) return -1

    if (typeof valA === 'string') {
      return valA.localeCompare(valB) * sortOrder.value
    }
    return (valA - valB) * sortOrder.value
  })

  return list
})

onMounted(fetchInitialData)
</script>

<style scoped>
.vencimiento-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: bold;
}
.vencimiento-badge.expired {
  background-color: #fca5a5;
  color: #7f1d1d;
  border: 1px solid #f87171;
}
.vencimiento-badge.critical {
  background-color: #fed7aa;
  color: #7c2d12;
  border: 1px solid #fb923c;
}
.vencimiento-badge.warning {
  background-color: #fef08a;
  color: #713f12;
  border: 1px solid #facc15;
}
.vencimiento-badge.safe {
  background-color: #bbf7d0;
  color: #14532d;
  border: 1px solid #4ade80;
}
</style>
