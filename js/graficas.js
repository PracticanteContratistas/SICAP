/**
 * DASHLINO - Módulo de Gráficas
 * Archivo: graficas.js
 * Propósito: Crear y actualizar gráficas con Chart.js
 */

const Graficas = {
    // Instancia de la gráfica principal
    chartEvolucion: null,

    /**
     * Inicializa la gráfica de evolución
     * @param {string} canvasId - ID del elemento canvas
     * @param {Array} datosMeses - Datos de los meses
     * @param {Object} proyeccion - Datos de proyección (opcional)
     */
    inicializarGraficaEvolucion(canvasId, datosMeses, proyeccion = null) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas no encontrado: ${canvasId}`);
            return;
        }

        // Destruir gráfica anterior si existe
        if (this.chartEvolucion) {
            this.chartEvolucion.destroy();
        }

        const ctx = canvas.getContext('2d');
        const colores = window.CONFIG.colores;

        // Preparar datos
        const labels = datosMeses.map(m => m.mes);
        const tasasCaptura = datosMeses.map(m => (m.tasaCaptura * 100).toFixed(1));
        const faltantes = datosMeses.map(m => m.totalFaltantes);

        // Agregar proyección si existe
        if (proyeccion && datosMeses.length >= 2) {
            // Agregar 2 meses de proyección
            const ultimoMes = datosMeses[datosMeses.length - 1];
            const proyMes1 = Math.min(100, parseFloat(tasasCaptura[tasasCaptura.length - 1]) + (proyeccion.velocidadMensual * 100));
            const proyMes2 = Math.min(100, proyMes1 + (proyeccion.velocidadMensual * 100));
            
            labels.push('DIC', 'ENE');
            tasasCaptura.push(proyMes1.toFixed(1), proyMes2.toFixed(1));
            
            // Proyectar faltantes (reducción proporcional)
            const reduccionPorMes = ultimoMes.totalFaltantes * proyeccion.velocidadMensual;
            faltantes.push(
                Math.max(0, Math.round(ultimoMes.totalFaltantes - reduccionPorMes)),
                Math.max(0, Math.round(ultimoMes.totalFaltantes - reduccionPorMes * 2))
            );
        }

        const numReales = datosMeses.length;

        this.chartEvolucion = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '% Captura',
                        data: tasasCaptura,
                        borderColor: colores.exito,
                        backgroundColor: this.crearGradiente(ctx, colores.exito, 0.15),
                        borderWidth: 2.5,
                        fill: true,
                        tension: window.CONFIG.graficas.tension,
                        pointRadius: (ctx) => ctx.dataIndex < numReales ? 
                            window.CONFIG.graficas.puntosRadio : 3,
                        pointHoverRadius: window.CONFIG.graficas.puntosHoverRadio,
                        pointBackgroundColor: colores.exito,
                        segment: {
                            borderDash: ctx => ctx.p0DataIndex >= numReales - 1 ? [6, 3] : undefined
                        }
                    },
                    {
                        label: 'Pendientes',
                        data: faltantes,
                        borderColor: colores.peligro,
                        backgroundColor: this.crearGradiente(ctx, colores.peligro, 0.08),
                        borderWidth: 2,
                        fill: true,
                        tension: window.CONFIG.graficas.tension,
                        yAxisID: 'y1',
                        pointRadius: (ctx) => ctx.dataIndex < numReales ? 4 : 2,
                        pointHoverRadius: 7,
                        pointBackgroundColor: colores.peligro,
                        segment: {
                            borderDash: ctx => ctx.p0DataIndex >= numReales - 1 ? [6, 3] : undefined
                        }
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: { size: 12, weight: '600' },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        padding: 14,
                        titleFont: { size: 14, weight: '700' },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label;
                                const value = context.parsed.y;
                                const isProyeccion = context.dataIndex >= numReales;
                                const sufijo = isProyeccion ? ' (proyección)' : '';
                                
                                if (label === '% Captura') {
                                    return `${label}: ${value}%${sufijo}`;
                                }
                                return `${label}: ${value}${sufijo}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 110,
                        ticks: {
                            font: { size: 11 },
                            color: colores.gris,
                            callback: value => value + '%'
                        },
                        title: {
                            display: true,
                            text: '% Captura',
                            font: { size: 12, weight: '700' }
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            font: { size: 11 },
                            color: colores.gris
                        },
                        title: {
                            display: true,
                            text: 'Pendientes',
                            font: { size: 12, weight: '700' }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        ticks: {
                            font: { size: 11, weight: '700' }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        console.log('📊 Gráfica de evolución inicializada');
    },

    /**
     * Crea un gradiente para el fondo de las líneas
     */
    crearGradiente(ctx, color, opacidad) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 280);
        gradient.addColorStop(0, this.hexToRgba(color, opacidad));
        gradient.addColorStop(1, this.hexToRgba(color, 0.01));
        return gradient;
    },

    /**
     * Convierte hex a rgba
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    /**
     * Actualiza los datos de la gráfica
     */
    actualizarGrafica(datosMeses, proyeccion) {
        if (this.chartEvolucion) {
            this.chartEvolucion.destroy();
        }
        this.inicializarGraficaEvolucion('chartEvolucion', datosMeses, proyeccion);
    },

    /**
     * Destruye todas las gráficas
     */
    destruir() {
        if (this.chartEvolucion) {
            this.chartEvolucion.destroy();
            this.chartEvolucion = null;
        }
    }
};

// Hacer disponible globalmente
window.Graficas = Graficas;
