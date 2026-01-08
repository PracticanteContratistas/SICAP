/**
 * DASHLINO - Lector de Archivos Excel
 * Archivo: lectorExcel.js
 * Propósito: Cargar y parsear archivos Excel usando SheetJS
 */

const LectorExcel = {
    // Cache de archivos ya cargados
    cache: {},

    /**
     * Carga un archivo Excel desde una URL
     * @param {string} url - Ruta al archivo Excel
     * @returns {Promise<Object>} - Objeto con las hojas parseadas
     */
    async cargarArchivo(url) {
        // Verificar cache
        if (this.cache[url]) {
            console.log(`📦 Usando cache para: ${url}`);
            return this.cache[url];
        }

        console.log(`📥 Cargando archivo: ${url}`);

        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`No se pudo cargar: ${url} (${response.status})`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const resultado = {
                hojas: {},
                nombresHojas: workbook.SheetNames
            };

            // Parsear cada hoja
            for (const nombreHoja of workbook.SheetNames) {
                const worksheet = workbook.Sheets[nombreHoja];
                resultado.hojas[nombreHoja] = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    defval: null
                });
            }

            // Guardar en cache
            this.cache[url] = resultado;
            
            console.log(`✅ Archivo cargado: ${url} (${workbook.SheetNames.length} hojas)`);
            return resultado;

        } catch (error) {
            console.error(`❌ Error cargando ${url}:`, error);
            throw error;
        }
    },

    /**
     * Verifica qué archivos existen de la lista configurada
     * @returns {Promise<Array>} - Lista de archivos disponibles
     */
    async detectarArchivosDisponibles() {
        const archivosDisponibles = [];
        const config = window.CONFIG.excel;

        for (const archivo of config.archivos) {
            const url = config.carpetaData + archivo.archivo;
            
            try {
                const response = await fetch(url, { method: 'HEAD' });
                if (response.ok) {
                    archivosDisponibles.push({
                        ...archivo,
                        url: url
                    });
                    console.log(`✅ Encontrado: ${archivo.archivo}`);
                }
            } catch (e) {
                console.log(`⚪ No encontrado: ${archivo.archivo}`);
            }
        }

        // Ordenar por el campo 'orden'
        archivosDisponibles.sort((a, b) => a.orden - b.orden);
        
        return archivosDisponibles;
    },

    /**
     * Extrae una hoja específica como array de objetos
     * @param {Object} workbook - Workbook parseado
     * @param {string} nombreHoja - Nombre de la hoja
     * @param {number} filaEncabezado - Fila donde están los encabezados (0-indexed)
     * @returns {Array} - Array de objetos con los datos
     */
    extraerHojaComoObjetos(workbook, nombreHoja, filaEncabezado = 0) {
        const datos = workbook.hojas[nombreHoja];
        
        if (!datos || datos.length === 0) {
            console.warn(`⚠️ Hoja vacía o no encontrada: ${nombreHoja}`);
            return [];
        }

        const encabezados = datos[filaEncabezado];
        const resultado = [];

        for (let i = filaEncabezado + 1; i < datos.length; i++) {
            const fila = datos[i];
            if (!fila || fila.every(celda => celda === null || celda === '')) continue;

            const objeto = {};
            for (let j = 0; j < encabezados.length; j++) {
                const nombreColumna = encabezados[j];
                if (nombreColumna) {
                    objeto[nombreColumna] = fila[j] !== undefined ? fila[j] : null;
                }
            }
            resultado.push(objeto);
        }

        return resultado;
    },

    /**
     * Extrae los Indicadores PRIME de un workbook
     * @param {Object} workbook - Workbook parseado
     * @returns {Object} - Indicadores procesados
     */
    extraerIndicadoresPrime(workbook) {
        const nombreHoja = window.CONFIG.excel.hojas.indicadoresPrime;
        const datos = this.extraerHojaComoObjetos(workbook, nombreHoja, 1); // Header en fila 1
        
        const cols = window.CONFIG.excel.columnasIndicadores;
        const unidades = [];
        let totales = null;

        for (const fila of datos) {
            const unidad = fila[cols.unidad];
            
            if (!unidad) continue;

            const registro = {
                unidad: unidad,
                contratosPadron: this.parseNumero(fila[cols.contratosPadron]),
                contratosEstado: this.parseNumero(fila[cols.contratosEstado]),
                capturados: this.parseNumero(fila[cols.capturados]),
                faltan: this.parseNumero(fila[cols.faltan]),
                porcentaje: this.parsePorcentaje(fila[cols.porcentaje])
            };

            if (unidad.toUpperCase().includes('TOTAL')) {
                totales = registro;
            } else {
                unidades.push(registro);
            }
        }

        return { unidades, totales };
    },

    /**
     * Extrae los contratos faltantes
     * @param {Object} workbook - Workbook parseado
     * @returns {Array} - Lista de contratos faltantes
     */
    extraerFaltantes(workbook) {
        const nombreHoja = window.CONFIG.excel.hojas.faltan;
        const datos = this.extraerHojaComoObjetos(workbook, nombreHoja, 1);
        
        const cols = window.CONFIG.excel.columnasFaltan;
        const contratos = [];

        for (const fila of datos) {
            if (!fila[cols.contratista]) continue;

            contratos.push({
                consecutivo: fila[cols.consecutivo],
                mes: fila[cols.mes],
                empresa: fila[cols.empresa],
                unidad: fila[cols.unidad],
                contratista: fila[cols.contratista],
                rfc: fila[cols.rfc],
                numeroContrato: fila[cols.numeroContrato],
                plantilla: this.parseNumero(fila[cols.plantilla]),
                fechaInicio: this.formatearFecha(fila[cols.fechaInicio]),
                fechaFin: this.formatearFecha(fila[cols.fechaFin])
            });
        }

        return contratos;
    },

    /**
     * Extrae información de duplicados
     * @param {Object} workbook - Workbook parseado
     * @returns {Object} - Estadísticas de duplicados
     */
    extraerDuplicados(workbook) {
        const nombreHoja = window.CONFIG.excel.hojas.detalleDuplicados;
        const datos = workbook.hojas[nombreHoja];
        
        // Contar registros (restar encabezados)
        const totalDuplicados = datos ? Math.max(0, datos.length - 2) : 0;
        
        return {
            total: totalDuplicados
        };
    },

    /**
     * Utilidades de parseo
     */
    parseNumero(valor) {
        if (valor === null || valor === undefined || valor === '') return 0;
        const num = parseFloat(valor);
        return isNaN(num) ? 0 : num;
    },

    parsePorcentaje(valor) {
        if (valor === null || valor === undefined || valor === '') return 0;
        let num = parseFloat(valor);
        if (isNaN(num)) return 0;
        // Si es menor a 1, asumir que es decimal (0.86 = 86%)
        return num <= 1 ? num : num / 100;
    },

    formatearFecha(valor) {
        if (!valor) return null;
        
        // Si es número de Excel (días desde 1900)
        if (typeof valor === 'number') {
            const fecha = new Date((valor - 25569) * 86400 * 1000);
            return fecha.toLocaleDateString('es-MX');
        }
        
        return valor.toString();
    },

    /**
     * Limpia el cache
     */
    limpiarCache() {
        this.cache = {};
        console.log('🗑️ Cache limpiado');
    }
};

// Hacer disponible globalmente
window.LectorExcel = LectorExcel;
