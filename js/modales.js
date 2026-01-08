/**
 * DASHLINO - Módulo de Modales
 * Archivo: modales.js
 * Propósito: Gestionar la apertura, cierre y contenido de modales
 */

const Modales = {
    /**
     * Abre un modal con título y contenido HTML
     * @param {string} titulo - Título del modal
     * @param {string} contenidoHTML - Contenido HTML del modal
     */
    abrir(titulo, contenidoHTML) {
        const overlay = document.getElementById('modalOverlay');
        const tituloEl = document.getElementById('modalTitle');
        const bodyEl = document.getElementById('modalBody');

        if (!overlay || !tituloEl || !bodyEl) {
            console.error('❌ Elementos del modal no encontrados');
            return;
        }

        tituloEl.textContent = titulo;
        bodyEl.innerHTML = contenidoHTML;
        overlay.classList.add('active');
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    },

    /**
     * Cierra el modal
     */
    cerrar() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },

    /**
     * Muestra las unidades al 100%
     * @param {Array} unidades - Lista de unidades al 100%
     */
    mostrarUnidades100(unidades) {
        const lista = unidades.map(u => `
            <div class="modal-list-item sin-faltantes">
                <span class="modal-list-item-nombre">${u.unidad}</span>
                <span class="modal-list-item-badge">100%</span>
            </div>
        `).join('');

        this.abrir(
            `✅ Unidades al 100% (${unidades.length})`,
            `<div class="modal-list">${lista}</div>`
        );
    },

    /**
     * Muestra unidades en proceso (70-99%)
     * @param {Array} unidades - Lista de unidades en proceso
     * @param {Object} faltantesPorUnidad - Contratos faltantes agrupados
     */
    mostrarUnidadesEnProceso(unidades, faltantesPorUnidad) {
        const lista = unidades.map(u => `
            <div class="modal-list-item" onclick="Modales.mostrarContratosUnidad('${u.unidad}', window.DashboardData.faltantesPorUnidad)">
                <span class="modal-list-item-nombre">${u.unidad}</span>
                <span class="modal-list-item-badge badge-warning">${u.porcentajeFormateado} (${u.faltan} falt.)</span>
            </div>
        `).join('');

        this.abrir(
            `⚠️ Unidades en Proceso (${unidades.length})`,
            `
            <div class="explicacion-box">
                <div class="explicacion-text">
                    Unidades con captura entre 70% y 99%. Click en cualquier unidad para ver sus contratos faltantes.
                </div>
            </div>
            <div class="modal-list">${lista}</div>
            `
        );
    },

    /**
     * Muestra unidades críticas (<70%)
     * @param {Array} unidades - Lista de unidades críticas
     */
    mostrarUnidadesCriticas(unidades) {
        const lista = unidades.map(u => `
            <div class="modal-list-item" onclick="Modales.mostrarContratosUnidad('${u.unidad}', window.DashboardData.faltantesPorUnidad)">
                <span class="modal-list-item-nombre">🚨 ${u.unidad}</span>
                <span class="modal-list-item-badge badge-danger">${u.porcentajeFormateado} (${u.faltan} falt.)</span>
            </div>
        `).join('');

        this.abrir(
            `🚨 Unidades Críticas (${unidades.length})`,
            `
            <div class="explicacion-box" style="background: #fef2f2; border-color: #fecaca;">
                <div class="explicacion-text" style="color: #991b1b;">
                    Unidades con captura menor al 70%. Requieren atención prioritaria.
                    Click en cualquier unidad para ver el detalle de contratos faltantes.
                </div>
            </div>
            <div class="modal-list">${lista}</div>
            `
        );
    },

    /**
     * Muestra los contratos faltantes de una unidad específica
     * @param {string} unidad - Nombre de la unidad
     * @param {Object} faltantesPorUnidad - Contratos agrupados por unidad
     */
    mostrarContratosUnidad(unidad, faltantesPorUnidad) {
        const contratos = faltantesPorUnidad[unidad] || [];

        if (contratos.length === 0) {
            this.abrir(
                `✅ ${unidad}`,
                `
                <div style="padding: 24px; text-align: center; color: #6b7280;">
                    <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                    <div style="font-size: 18px; font-weight: 700; color: #16a34a;">Sin contratos faltantes</div>
                </div>
                `
            );
            return;
        }

        const tabla = `
            <div style="margin-bottom: 16px; text-align: center;">
                <div style="font-size: 24px; font-weight: 800; color: #dc2626;">${unidad}</div>
                <div style="margin-top: 8px; font-size: 32px; font-weight: 900; color: #dc2626;">${contratos.length} contratos</div>
            </div>
            <div style="overflow-x: auto;">
                <table class="contratos-tabla">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Número de Contrato</th>
                            <th>Contratista</th>
                            <th>Inicio</th>
                            <th>Fin</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${contratos.map((c, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td class="contrato-numero">${c.numeroContrato || 'N/A'}</td>
                                <td>${c.contratista || 'N/A'}</td>
                                <td>${c.fechaInicio || 'N/A'}</td>
                                <td>${c.fechaFin || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.abrir(`📋 Contratos Faltantes - ${unidad}`, tabla);
    },

    /**
     * Muestra todos los contratos faltantes
     * @param {number} totalFaltantes - Total de faltantes
     * @param {Array} criticas - Unidades críticas
     * @param {Array} enProceso - Unidades en proceso
     */
    mostrarFaltantesTotales(totalFaltantes, criticas, enProceso) {
        const faltantesCriticas = criticas.reduce((sum, u) => sum + u.faltan, 0);
        const faltantesEnProceso = enProceso.reduce((sum, u) => sum + u.faltan, 0);

        const contenido = `
            <div class="explicacion-box">
                <div class="explicacion-title">📊 Contratos Pendientes Totales</div>
                <div class="explicacion-text">
                    🔴 <strong>Críticas (&lt;70%):</strong> ${faltantesCriticas} contratos<br>
                    🟡 <strong>En Proceso (70-99%):</strong> ${faltantesEnProceso} contratos<br>
                    <br>
                    <strong>Total: ${totalFaltantes} contratos pendientes</strong>
                </div>
            </div>
            <div class="modal-list">
                ${criticas.map(u => `
                    <div class="modal-list-item" onclick="Modales.mostrarContratosUnidad('${u.unidad}', window.DashboardData.faltantesPorUnidad)">
                        <span class="modal-list-item-nombre">🔴 ${u.unidad}</span>
                        <span class="modal-list-item-badge badge-danger">${u.faltan} falt.</span>
                    </div>
                `).join('')}
                ${enProceso.map(u => `
                    <div class="modal-list-item" onclick="Modales.mostrarContratosUnidad('${u.unidad}', window.DashboardData.faltantesPorUnidad)">
                        <span class="modal-list-item-nombre">🟡 ${u.unidad}</span>
                        <span class="modal-list-item-badge badge-warning">${u.faltan} falt.</span>
                    </div>
                `).join('')}
            </div>
        `;

        this.abrir(`📊 Contratos Pendientes: ${totalFaltantes}`, contenido);
    },

    /**
     * Muestra todas las unidades con su estado
     * @param {Array} todasUnidades - Todas las unidades
     */
    mostrarTodasUnidades(todasUnidades) {
        const lista = todasUnidades.map(u => {
            const es100 = u.porcentaje >= 0.9999;
            let badgeClass = 'badge-success';
            let badgeText = '100%';
            let clickable = false;

            if (!es100) {
                clickable = true;
                badgeText = `${(u.porcentaje * 100).toFixed(1)}% (${u.faltan} falt.)`;
                badgeClass = u.porcentaje >= 0.70 ? 'badge-warning' : 'badge-danger';
            }

            return `
                <div class="modal-list-item ${es100 ? 'sin-faltantes' : ''}" 
                     ${clickable ? `onclick="Modales.mostrarContratosUnidad('${u.unidad}', window.DashboardData.faltantesPorUnidad)"` : ''}>
                    <span class="modal-list-item-nombre">${u.unidad}</span>
                    <span class="modal-list-item-badge ${badgeClass}">${badgeText}</span>
                </div>
            `;
        }).join('');

        this.abrir(
            `📍 Todas las Unidades (${todasUnidades.length})`,
            `
            <div style="margin-bottom: 16px; padding: 12px; background: #f0f9ff; border-radius: 8px; font-size: 13px; color: #075985;">
                💡 <strong>Click en cualquier unidad con faltantes</strong> para ver el detalle
            </div>
            <div class="modal-list">${lista}</div>
            `
        );
    },

    /**
     * Muestra explicación de velocidad/incorporados
     * @param {Object} datos - Datos del mes actual
     * @param {Object} comparacion - Comparación con mes anterior
     */
    mostrarExplicacionVelocidad(datos, comparacion) {
        const contenido = `
            <div class="explicacion-box">
                <div class="explicacion-title">⚡ ¿Qué es la Velocidad?</div>
                <div class="explicacion-text">
                    La <strong>velocidad</strong> mide cuántos contratos se incorporaron al sistema PADRÓN este mes.
                    <br><br>
                    <strong>${comparacion.incorporados > 0 ? comparacion.incorporados : 'N/A'} contratos</strong> fueron registrados en ${datos.nombreMes}.
                    <br><br>
                    📈 <strong>¿Por qué es importante?</strong><br>
                    Un número alto de contratos incorporados significa que estamos reduciendo la brecha entre lo que existe en campo (Estado de Fuerza) y lo que está registrado oficialmente (PADRÓN).
                </div>
            </div>
            <div style="margin-top: 16px; padding: 14px; background: #f3f4f6; border-radius: 8px;">
                <strong>📊 Estadísticas del mes:</strong><br>
                • Total en PADRÓN: ${datos.totalPadron} contratos<br>
                • Total en Estado de Fuerza: ${datos.totalEstado} contratos<br>
                • Capturados correctamente: ${datos.totalCapturados}
            </div>
        `;

        this.abrir('⚡ Velocidad de Incorporación', contenido);
    },

    /**
     * Muestra explicación de duplicados
     * @param {number} duplicados - Cantidad de duplicados eliminados
     */
    mostrarExplicacionDuplicados(duplicados) {
        const contenido = `
            <div class="explicacion-box">
                <div class="explicacion-title">🔄 ¿Qué son los Duplicados?</div>
                <div class="explicacion-text">
                    Los <strong>duplicados</strong> son registros repetidos del mismo contrato que aparecen múltiples veces por errores de captura.
                    <br><br>
                    <strong>${duplicados} duplicados detectados</strong> en este mes.
                    <br><br>
                    📊 <strong>¿Cómo funciona?</strong><br>
                    SICAP compara cada contrato usando su número único y el nombre de la unidad. Si encuentra el mismo contrato 2+ veces, lo identifica como duplicado.
                    <br><br>
                    ⏱️ <strong>Valor del Sistema:</strong><br>
                    Identificar ${duplicados} duplicados manualmente tomaría aproximadamente <strong>${Math.ceil(duplicados / 180)} días de trabajo</strong>. SICAP lo hace en segundos.
                </div>
            </div>
        `;

        this.abrir('🔄 Duplicados Detectados', contenido);
    },

    /**
     * Muestra explicación de mejora trimestral
     * @param {Array} meses - Datos de todos los meses
     */
    mostrarExplicacionMejora(meses) {
        if (meses.length < 2) {
            this.abrir('📈 Mejora', '<div class="explicacion-box">Se necesitan al menos 2 meses de datos para calcular la mejora.</div>');
            return;
        }

        const primero = meses[0];
        const ultimo = meses[meses.length - 1];
        const mejora = ((ultimo.tasaCaptura - primero.tasaCaptura) * 100).toFixed(1);

        let desglose = meses.map((m, i) => {
            if (i === 0) return `• ${m.mes}: ${(m.tasaCaptura * 100).toFixed(1)}% (inicio)`;
            const delta = ((m.tasaCaptura - meses[i-1].tasaCaptura) * 100).toFixed(1);
            return `• ${m.mes}: ${(m.tasaCaptura * 100).toFixed(1)}% (+${delta}pp)`;
        }).join('<br>');

        const contenido = `
            <div class="explicacion-box">
                <div class="explicacion-title">📈 Mejora Acumulada</div>
                <div class="explicacion-text">
                    La mejora mide cuánto aumentó la Tasa de Captura desde ${primero.mes} hasta ${ultimo.mes}.
                    <br><br>
                    <strong>+${mejora} puntos porcentuales</strong>
                    <br><br>
                    📊 <strong>Desglose:</strong><br>
                    ${desglose}
                </div>
            </div>
        `;

        this.abrir('📈 Mejora Acumulada', contenido);
    },

    /**
     * Muestra explicación del crecimiento del PADRÓN
     * @param {Array} meses - Datos de todos los meses
     */
    mostrarExplicacionPadron(meses) {
        const ultimo = meses[meses.length - 1];
        
        let desglose = '';
        if (meses.length > 1) {
            const primero = meses[0];
            const crecimiento = ultimo.totalPadron - primero.totalPadron;
            const porcentaje = ((crecimiento / primero.totalPadron) * 100).toFixed(1);
            
            desglose = `
                📈 <strong>Crecimiento:</strong><br>
                • ${primero.mes}: ${primero.totalPadron} contratos<br>
                • ${ultimo.mes}: ${ultimo.totalPadron} contratos<br>
                • <strong>Total: +${crecimiento} contratos (+${porcentaje}%)</strong>
            `;
        }

        const contenido = `
            <div class="explicacion-box">
                <div class="explicacion-title">📋 ¿Qué es el PADRÓN?</div>
                <div class="explicacion-text">
                    El <strong>PADRÓN</strong> es la base de datos oficial donde se registran todos los contratos y contratistas para generar credenciales de acceso a las operaciones.
                    <br><br>
                    <strong>${ultimo.totalPadron} contratos</strong> registrados actualmente.
                    <br><br>
                    ${desglose}
                    <br><br>
                    💡 El crecimiento del PADRÓN indica que se está cerrando la brecha entre lo que existe en campo y lo registrado oficialmente.
                </div>
            </div>
        `;

        this.abrir('📋 PADRÓN', contenido);
    },

    /**
     * Inicializa eventos del modal
     */
    inicializarEventos() {
        // Cerrar modal al hacer click fuera
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.cerrar();
                }
            });
        }

        // Cerrar con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrar();
            }
        });
    }
};

// Hacer disponible globalmente
window.Modales = Modales;
