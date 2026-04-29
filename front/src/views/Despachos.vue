<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h2 class="page-title">Historial Despachos</h2>
        <p class="page-description">Administra los pedidos de clientes y organiza las rutas de distribución.</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary">
          <i class="ph-plus"></i>
          Nuevo Pedido
        </button>
      </div>
    </div>

    <div class="status-tabs">
      <button class="tab active">Todos (45)</button>
      <button class="tab">Pendientes (14)</button>
      <button class="tab">En Preparación (8)</button>
      <button class="tab">En Camino (12)</button>
      <button class="tab">Entregados (11)</button>
    </div>

    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Cliente</th>
              <th>Fecha de Entrega</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="fw-medium">#PED-1024</td>
              <td>
                <div class="fw-medium">Minimercado Los Pinos</div>
                <div class="text-sm text-muted">Zona Norte</div>
              </td>
              <td>23/04/2026 - Mañana</td>
              <td class="fw-medium">$85.400</td>
              <td><span class="badge badge-warning">Pendiente</span></td>
              <td>
                <button class="btn btn-outline btn-sm">Ver Detalle</button>
              </td>
            </tr>
            <tr>
              <td class="fw-medium">#PED-1023</td>
              <td>
                <div class="fw-medium">Supermercado El Sol</div>
                <div class="text-sm text-muted">Centro</div>
              </td>
              <td>23/04/2026 - Tarde</td>
              <td class="fw-medium">$45.000</td>
              <td><span class="badge badge-primary">Preparando</span></td>
              <td>
                <button class="btn btn-outline btn-sm">Ver Detalle</button>
              </td>
            </tr>
            <tr>
              <td class="fw-medium">#PED-1022</td>
              <td>
                <div class="fw-medium">Almacén Don Pepe</div>
                <div class="text-sm text-muted">Zona Sur</div>
              </td>
              <td>22/04/2026 - Mañana</td>
              <td class="fw-medium">$12.500</td>
              <td><span class="badge badge-success">Entregado</span></td>
              <td>
                <button class="btn btn-outline btn-sm">Ver Detalle</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.page-description {
  color: var(--text-secondary);
}

.status-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--glass-border);
  padding-bottom: 1rem;
  overflow-x: auto;
}

.tab {
  padding: 0.5rem 1rem;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--border-radius-md);
  transition: all 0.2s;
  white-space: nowrap;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.tab.active {
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-primary);
}

.fw-medium { font-weight: 500; }
.text-sm { font-size: 0.75rem; }
.text-muted { color: var(--text-muted); }

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}
</style>
