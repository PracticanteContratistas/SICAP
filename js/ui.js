/**
 * DASHLINO - Módulo de Interfaz de Usuario
 * Archivo: ui.js
 * Propósito: Actualizar elementos visuales del dashboard
 */

const UI = {
    /**
     * Muestra el overlay de carga
     */
    mostrarCargando() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    },

    /**
     * Oculta el overlay de carga
     */
    ocultarCargando() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * Actualiza el texto de un elemento
     * @param {string} id - ID del elemento
     * @param {string} valor - Nuevo valor
     */
    actualizarTexto(id, valor) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = valor;
        }
    },

    /**
     * Actualiza el HTML de un elemento
     * @param {string} id - ID del elemento
     * @param {string} html - Nuevo HTML
     */
    actualizarHTML(id, html) {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = html;
        }
    },

    /**
     * Genera los tabs de meses disponibles
     * @param {Array} meses - Lista de meses con datos
     * @param {string} mesActivo - Mes actualmente seleccionado
     */
    generarTabsMeses(meses, mesActivo) {
        const container = document.getElementById('mesSelector');
        if (!container) return;

        const tabs = meses.map(m => {
            const activo = m.mes === mesActivo ? 'active' : '';
            const porcentaje = (m.tasaCaptura * 100).toFixed(1);
            
            return `
                <div class="mes-tab ${activo}" onclick="App.cambiarMes('${m.mes}')">
                    <div class="mes-nombre">${m.nombreMes}</div>
                    <div class="mes-indicador">${porcentaje}%</div>
                </div>
            `;
        }).join('');

        container.innerHTML = tabs;
    },

    /**
     * Actualiza el KPI Hero principal
     * @param {Object} datos - Datos del mes
     * @param {Object} comparacion - Comparación con mes anterior
     * @param {Object} proyeccion - Datos de proyección
     * @param {Object} primerMes - Datos del primer mes (para mejora total)
     */
    actualizarKPIHero(datos, comparacion, proyeccion, primerMes) {
        const porcentaje = (datos.tasaCaptura * 100).toFixed(1);
        
        // Valor principal
        this.actualizarTexto('capturaGlobal', porcentaje + '%');
        
        // Barra de progreso
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = porcentaje + '%';
        }

        // Stats adicionales
        const statsContainer = document.getElementById('heroStats');
        if (statsContainer) {
            let statsHTML = '';

            // Mejora total (vs primer mes)
            if (primerMes && primerMes.mes !== datos.mes) {
                const mejoraTrimestral = ((datos.tasaCaptura - primerMes.tasaCaptura) * 100).toFixed(1);
                statsHTML += `<div class="hero-stat">📈 +${mejoraTrimestral}pp vs ${primerMes.mes}</div>`;
            }

            // Mejora mensual
            if (comparacion && comparacion.deltaTasaCaptura !== 0) {
                const delta = (comparacion.deltaTasaCaptura * 100).toFixed(1);
                const signo = comparacion.deltaTasaCaptura > 0 ? '+' : '';
                statsHTML += `<div class="hero-stat">⬆️ ${signo}${delta}pp este mes</div>`;
            }

            // Proyección
            if (proyeccion && proyeccion.proyeccionSiguiente) {
                const proy = (proyeccion.proyeccionSiguiente * 100).toFixed(0);
                statsHTML += `<div class="hero-stat proyeccion">🎯 Proyección: <strong>${proy}%</strong></div>`;
            }

            // Aceleración
            if (proyeccion && proyeccion.aceleracion && proyeccion.aceleracion > 0) {
                statsHTML += `<div class="hero-stat aceleracion">⚡ Aceleración: <strong>+${proyeccion.aceleracion.toFixed(0)}%</strong></div>`;
            }

            statsContainer.innerHTML = statsHTML;
        }
    },

    /**
     * Actualiza el panorama general
     * @param {Object} datos - Datos del mes
     * @param {Object} comparacion - Comparación con mes anterior
     * @param {Object} primerMes - Primer mes para calcular mejora total
     */
    actualizarPanorama(datos, comparacion, primerMes) {
        // Mes actual
        this.actualizarTexto('panoramaMes', datos.nombreMes + ' 2025');
        
        // Faltantes
        this.actualizarTexto('panoramaFaltantes', datos.totalFaltantes);
        
        // Unidades al 100%
        this.actualizarTexto('panoramaUnidades100', datos.cantidadUnidades100);
        
        // Mejora
        if (primerMes) {
            const mejora = ((datos.tasaCaptura - primerMes.tasaCaptura) * 100).toFixed(1);
            this.actualizarTexto('panoramaMejora', '+' + mejora + 'pp');
        }
        
        // Velocidad (incorporados)
        this.actualizarTexto('panoramaVelocidad', comparacion?.incorporados || 0);
        
        // Duplicados
        this.actualizarTexto('panoramaDuplicados', datos.duplicadosEliminados);
        
        // PADRÓN
        this.actualizarTexto('panoramaPadron', datos.totalPadron);
    },

    /**
     * Actualiza las tarjetas de estado de unidades
     * @param {Object} datos - Datos del mes
     * @param {Object} comparacion - Comparación con mes anterior
     */
    actualizarEstadoUnidades(datos, comparacion) {
        // Unidades al 100%
        this.actualizarTexto('unidades100', datos.cantidadUnidades100);
        
        // En proceso
        this.actualizarTexto('unidadesEnProceso', datos.cantidadEnProceso);
        
        // Críticas
        this.actualizarTexto('unidadesCriticas', datos.cantidadCriticas);
        
        // Faltantes totales
        this.actualizarTexto('faltantesTotales', datos.totalFaltantes);
        
        // Incorporados
        this.actualizarTexto('incorporados', comparacion?.incorporados || 0);
        
        // Delta de incorporados
        const detalleIncorporados = document.getElementById('detalleIncorporados');
        if (detalleIncorporados && comparacion) {
            // Calcular porcentaje de mejora
            detalleIncorporados.textContent = comparacion.incorporados > 0 ? 
                `+${comparacion.incorporados} este mes` : 'Sin cambios';
        }
    },

    /**
     * Actualiza la sección de concentración 80/20
     * @param {Object} concentracion - Datos de concentración
     * @param {number} totalFaltantes - Total de faltantes
     */
    actualizarConcentracion(concentracion, totalFaltantes) {
        // Barra de concentración
        const fillEl = document.getElementById('concentracionFill');
        if (fillEl) {
            const porcentaje = concentracion.porcentajeConcentracion.toFixed(0);
            fillEl.style.width = porcentaje + '%';
            fillEl.textContent = `${porcentaje}% EN ${concentracion.topUnidades.length} CRÍTICAS (${concentracion.faltantesEnTop}/${totalFaltantes})`;
        }

        // Grid de top unidades
        const gridEl = document.getElementById('top4Grid');
        if (gridEl && concentracion.topUnidades.length > 0) {
            const items = concentracion.topUnidades.map((u, i) => `
                <div class="top4-item" onclick="Modales.mostrarContratosUnidad('${u.unidad}', window.DashboardData.faltantesPorUnidad)">
                    <div class="top4-nombre">${i + 1}. ${u.unidad}</div>
                    <div class="top4-numero">${u.faltan}</div>
                </div>
            `).join('');
            
            gridEl.innerHTML = items;
        }

        // Footer de concentración
        const footerEl = document.getElementById('concentracionFooter');
        if (footerEl) {
            footerEl.textContent = `💡 Resolver estas ${concentracion.topUnidades.length} críticas = Resolver el ${concentracion.porcentajeConcentracion.toFixed(0)}% del problema total`;
        }
    },

    /**
     * Actualiza la sección de evolución (mejoras y deterioros)
     * @param {Object} evolucion - Mejoras y deterioros
     * @param {Object} datos - Datos del mes actual
     */
    actualizarEvolucion(evolucion, datos) {
        // Mejoras
        const mejorasContainer = document.getElementById('evolucionMejoras');
        if (mejorasContainer) {
            if (evolucion.mejoras.length === 0) {
                mejorasContainer.innerHTML = '<div class="evolucion-item"><span class="evolucion-nombre">Sin mejoras significativas este período</span></div>';
            } else {
                const items = evolucion.mejoras.map((m, i) => {
                    const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐';
                    return `
                        <div class="evolucion-item">
                            <span class="evolucion-nombre">${medalla} ${m.unidad}</span>
                            <span class="delta-badge delta-positivo">${(m.antes * 100).toFixed(0)}% → ${(m.despues * 100).toFixed(0)}% (${m.deltaFormateado})</span>
                        </div>
                    `;
                }).join('');
                mejorasContainer.innerHTML = items;
            }
        }

        // Deterioros
        const deteriorosContainer = document.getElementById('evolucionDeterioros');
        if (deteriorosContainer) {
            if (evolucion.deterioros.length === 0) {
                deteriorosContainer.innerHTML = `
                    <div style="padding: 16px; background: #f0fdf4; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 8px;">🎉</div>
                        <div style="font-size: 14px; font-weight: 600; color: #166534;">¡Sin deterioros!</div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Todas las unidades mantienen o mejoran</div>
                    </div>
                `;
            } else {
                const items = evolucion.deterioros.map(d => `
                    <div class="evolucion-item deterioro-alerta">
                        <span class="evolucion-nombre">🚨 ${d.unidad}</span>
                        <span class="delta-badge delta-negativo">${(d.antes * 100).toFixed(0)}% → ${(d.despues * 100).toFixed(0)}%</span>
                    </div>
                    <div style="margin: 8px 0; padding: 10px; background: #fef2f2; border-radius: 6px; font-size: 11px; color: #991b1b;">
                        <strong>${d.faltantes} contratos pendientes</strong><br>
                        Tendencia negativa (${d.deltaFormateado})
                    </div>
                    <button class="btn-accion" onclick="Modales.mostrarContratosUnidad('${d.unidad}', window.DashboardData.faltantesPorUnidad)">
                        📋 Ver ${d.faltantes} contratos
                    </button>
                `).join('');
                deteriorosContainer.innerHTML = items;
            }
        }
    },

    /**
     * Actualiza el header con información del mes
     * @param {Object} datos - Datos del mes
     */
    actualizarHeader(datos) {
        this.actualizarTexto('mesActual', datos.nombreMes.toUpperCase() + ' 2025');
        
        // Fecha de actualización
        const hoy = new Date();
        const fechaFormateada = hoy.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
        this.actualizarTexto('fechaActualizacion', 'Actualizado ' + fechaFormateada);
    },

    /**
     * Actualiza el footer
     * @param {number} duplicados - Cantidad de duplicados
     */
    actualizarFooter(duplicados) {
        const diasAhorrados = Math.ceil(duplicados / 180);
        this.actualizarTexto('footerDuplicados', `💎 ${duplicados} duplicados detectados (~${diasAhorrados} días ahorrados)`);
    },

    /**
     * Muestra mensaje de error
     * @param {string} mensaje - Mensaje de error
     */
    mostrarError(mensaje) {
        const container = document.getElementById('dashboardBody');
        if (container) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                    <div style="font-size: 18px; font-weight: 700; color: #dc2626; margin-bottom: 8px;">Error al cargar datos</div>
                    <div style="font-size: 14px; color: #6b7280;">${mensaje}</div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #111827; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
};

// Hacer disponible globalmente
window.UI = UI;
