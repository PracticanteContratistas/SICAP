/**
 * DASHLINO - Procesador de Datos
 * Archivo: procesador.js
 * Propósito: Calcular indicadores, clasificar unidades, generar estadísticas
 */

const Procesador = {
    /**
     * Procesa los datos de un mes completo
     * @param {Object} workbook - Workbook parseado
     * @param {Object} infoArchivo - Información del archivo (mes, nombre, etc.)
     * @returns {Object} - Datos procesados del mes
     */
    procesarMes(workbook, infoArchivo) {
        const indicadores = LectorExcel.extraerIndicadoresPrime(workbook);
        const faltantes = LectorExcel.extraerFaltantes(workbook);
        const duplicados = LectorExcel.extraerDuplicados(workbook);

        // Agrupar faltantes por unidad
        const faltantesPorUnidad = this.agruparFaltantesPorUnidad(faltantes);

        // Si existe Nuevos Proyectos, agregarlo a unidades con datos de hoja FALTAN
        if (indicadores.nuevosProyectos) {
            const nombreNuevosProyectos = indicadores.nuevosProyectos.unidad;
            // Buscar en faltantesPorUnidad el conteo real
            let faltantesNP = 0;
            for (const [unidad, contratos] of Object.entries(faltantesPorUnidad)) {
                if (unidad.toUpperCase().includes('NUEVOS PROYECTOS')) {
                    faltantesNP = contratos.length;
                    break;
                }
            }
            
            // Actualizar el registro de Nuevos Proyectos con datos de FALTAN
            indicadores.nuevosProyectos.faltan = faltantesNP;
            indicadores.nuevosProyectos.contratosEstado = faltantesNP;
            indicadores.nuevosProyectos.porcentaje = 0;
            
            // Agregar a la lista de unidades
            indicadores.unidades.push(indicadores.nuevosProyectos);
        }

        // Clasificar unidades (ahora incluye Nuevos Proyectos si existe)
        const clasificacion = this.clasificarUnidades(indicadores.unidades);

        // Calcular concentración (80/20) - usar faltantes del TOTAL, no recalcular
        const totalFaltantesParaConcentracion = indicadores.totales?.faltan || 0;
        const concentracion = this.calcularConcentracion(clasificacion.criticas, totalFaltantesParaConcentracion);

        return {
            mes: infoArchivo.mes,
            nombreMes: infoArchivo.nombre,
            archivo: infoArchivo.archivo,
            
            // Indicadores principales (del TOTAL GENERAL, no recalculados)
            tasaCaptura: indicadores.totales?.porcentaje || 0,
            totalPadron: indicadores.totales?.contratosPadron || 0,
            totalEstado: indicadores.totales?.contratosEstado || 0,
            totalCapturados: indicadores.totales?.capturados || 0,
            totalFaltantes: indicadores.totales?.faltan || 0,
            
            // Clasificación de unidades
            unidades100: clasificacion.al100,
            unidadesEnProceso: clasificacion.enProceso,
            unidadesCriticas: clasificacion.criticas,
            totalUnidades: indicadores.unidades.length,
            
            // Conteos
            cantidadUnidades100: clasificacion.al100.length,
            cantidadEnProceso: clasificacion.enProceso.length,
            cantidadCriticas: clasificacion.criticas.length,
            
            // Faltantes detallados
            faltantes: faltantes,
            faltantesPorUnidad: faltantesPorUnidad,
            
            // Duplicados
            duplicadosEliminados: duplicados.total,
            
            // Concentración
            concentracion: concentracion,
            
            // Todas las unidades
            todasUnidades: indicadores.unidades,
            
            // Nuevos Proyectos (referencia separada si se necesita)
            nuevosProyectos: indicadores.nuevosProyectos
        };
    },

    /**
     * Clasifica las unidades según su porcentaje de captura
     * @param {Array} unidades - Lista de unidades
     * @returns {Object} - Unidades clasificadas
     */
    clasificarUnidades(unidades) {
        const umbrales = window.CONFIG.umbrales;
        
        const al100 = [];
        const enProceso = [];
        const criticas = [];

        for (const u of unidades) {
            const clasificada = {
                ...u,
                porcentajeFormateado: (u.porcentaje * 100).toFixed(1) + '%'
            };

            if (u.porcentaje >= umbrales.excelente - 0.0001) {
                al100.push(clasificada);
            } else if (u.porcentaje >= umbrales.enProceso) {
                enProceso.push(clasificada);
            } else {
                criticas.push(clasificada);
            }
        }

        // Ordenar críticas por faltantes (mayor primero)
        criticas.sort((a, b) => b.faltan - a.faltan);
        enProceso.sort((a, b) => b.faltan - a.faltan);
        al100.sort((a, b) => a.unidad.localeCompare(b.unidad));

        return { al100, enProceso, criticas };
    },

    /**
     * Agrupa los contratos faltantes por unidad
     * @param {Array} faltantes - Lista de contratos faltantes
     * @returns {Object} - Faltantes agrupados por unidad
     */
    agruparFaltantesPorUnidad(faltantes) {
        const agrupados = {};

        for (const contrato of faltantes) {
            const unidad = contrato.unidad || 'SIN UNIDAD';
            
            if (!agrupados[unidad]) {
                agrupados[unidad] = [];
            }
            agrupados[unidad].push(contrato);
        }

        return agrupados;
    },

    /**
     * Calcula la concentración de problemas (principio 80/20)
     * @param {Array} criticas - Unidades críticas
     * @param {number} totalFaltantes - Total de contratos faltantes
     * @returns {Object} - Datos de concentración
     */
    calcularConcentracion(criticas, totalFaltantes) {
        if (totalFaltantes === 0) {
            return {
                topUnidades: [],
                faltantesEnTop: 0,
                porcentajeConcentracion: 0
            };
        }

        // Tomar las top 4 unidades con más faltantes
        const top = criticas.slice(0, 4);
        const faltantesEnTop = top.reduce((sum, u) => sum + u.faltan, 0);
        const porcentaje = (faltantesEnTop / totalFaltantes) * 100;

        return {
            topUnidades: top,
            faltantesEnTop: faltantesEnTop,
            porcentajeConcentracion: porcentaje
        };
    },

    /**
     * Compara dos meses y calcula deltas
     * @param {Object} mesActual - Datos del mes actual
     * @param {Object} mesAnterior - Datos del mes anterior
     * @returns {Object} - Comparación con deltas
     */
    compararMeses(mesActual, mesAnterior) {
        if (!mesAnterior) {
            return {
                deltaTasaCaptura: 0,
                deltaFaltantes: 0,
                deltaPadron: 0,
                deltaUnidades100: 0,
                incorporados: 0
            };
        }

        return {
            deltaTasaCaptura: mesActual.tasaCaptura - mesAnterior.tasaCaptura,
            deltaFaltantes: mesActual.totalFaltantes - mesAnterior.totalFaltantes,
            deltaPadron: mesActual.totalPadron - mesAnterior.totalPadron,
            deltaUnidades100: mesActual.cantidadUnidades100 - mesAnterior.cantidadUnidades100,
            incorporados: mesAnterior.totalFaltantes - mesActual.totalFaltantes + 
                         (mesActual.totalEstado - mesAnterior.totalEstado)
        };
    },

    /**
     * Genera datos para la gráfica de evolución
     * @param {Array} meses - Array de datos de meses
     * @returns {Object} - Datos formateados para Chart.js
     */
    generarDatosGrafica(meses) {
        const labels = meses.map(m => m.mes);
        const tasasCaptura = meses.map(m => (m.tasaCaptura * 100).toFixed(1));
        const faltantes = meses.map(m => m.totalFaltantes);

        return {
            labels,
            datasets: [
                {
                    label: '% Captura',
                    data: tasasCaptura,
                    borderColor: window.CONFIG.colores.exito,
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: 'Pendientes',
                    data: faltantes,
                    borderColor: window.CONFIG.colores.peligro,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        };
    },

    /**
     * Encuentra mejoras y deterioros entre meses
     * @param {Object} mesActual - Datos del mes actual
     * @param {Object} mesAnterior - Datos del mes anterior (o primero para comparar)
     * @returns {Object} - Mejoras y deterioros
     */
    analizarEvolucion(mesActual, mesAnterior) {
        if (!mesAnterior) {
            return { mejoras: [], deterioros: [] };
        }

        const mejoras = [];
        const deterioros = [];

        // Crear mapa del mes anterior
        const mapaAnterior = {};
        for (const u of mesAnterior.todasUnidades) {
            mapaAnterior[u.unidad] = u;
        }

        // Comparar cada unidad
        for (const uActual of mesActual.todasUnidades) {
            const uAnterior = mapaAnterior[uActual.unidad];
            
            if (uAnterior) {
                const delta = uActual.porcentaje - uAnterior.porcentaje;
                
                if (delta > 0.01) { // Mejora significativa (>1%)
                    mejoras.push({
                        unidad: uActual.unidad,
                        antes: uAnterior.porcentaje,
                        despues: uActual.porcentaje,
                        delta: delta,
                        deltaFormateado: '+' + (delta * 100).toFixed(0) + 'pp'
                    });
                } else if (delta < -0.01) { // Deterioro significativo
                    deterioros.push({
                        unidad: uActual.unidad,
                        antes: uAnterior.porcentaje,
                        despues: uActual.porcentaje,
                        delta: delta,
                        deltaFormateado: (delta * 100).toFixed(0) + 'pp',
                        faltantes: uActual.faltan
                    });
                }
            }
        }

        // Ordenar por delta
        mejoras.sort((a, b) => b.delta - a.delta);
        deterioros.sort((a, b) => a.delta - b.delta);

        return {
            mejoras: mejoras.slice(0, 5), // Top 5 mejoras
            deterioros: deterioros
        };
    },

    /**
     * Calcula proyección simple basada en tendencia
     * @param {Array} meses - Datos históricos
     * @returns {Object} - Proyección
     */
    calcularProyeccion(meses) {
        if (meses.length < 2) {
            return null;
        }

        // Tomar últimos 2 meses para calcular velocidad
        const ultimo = meses[meses.length - 1];
        const penultimo = meses[meses.length - 2];
        
        const velocidad = ultimo.tasaCaptura - penultimo.tasaCaptura;
        const proyeccionSiguiente = Math.min(1, ultimo.tasaCaptura + velocidad);

        // Calcular aceleración si hay 3+ meses
        let aceleracion = 0;
        if (meses.length >= 3) {
            const antepenultimo = meses[meses.length - 3];
            const velocidadAnterior = penultimo.tasaCaptura - antepenultimo.tasaCaptura;
            aceleracion = ((velocidad - velocidadAnterior) / velocidadAnterior) * 100;
        }

        return {
            proyeccionSiguiente: proyeccionSiguiente,
            velocidadMensual: velocidad,
            aceleracion: aceleracion,
            mesesParaMeta: velocidad > 0 ? 
                Math.ceil((0.90 - ultimo.tasaCaptura) / velocidad) : 
                null
        };
    }
};

// Hacer disponible globalmente
window.Procesador = Procesador;
