/**
 * DASHLINO - Módulo Principal
 * Archivo: main.js
 * Propósito: Inicialización y coordinación de todos los módulos
 */

const App = {
    // Estado de la aplicación
    estado: {
        archivosDisponibles: [],
        datosPorMes: {},
        mesActivo: null,
        cargaInicial: false
    },

    /**
     * Inicializa la aplicación
     */
    async inicializar() {
        console.log('🚀 Iniciando DASHLINO v2.0...');
        
        UI.mostrarCargando();
        Modales.inicializarEventos();

        try {
            // Detectar archivos disponibles
            await this.detectarArchivos();

            if (this.estado.archivosDisponibles.length === 0) {
                throw new Error('No se encontraron archivos Excel en la carpeta data/');
            }

            // Cargar todos los archivos
            await this.cargarTodosLosMeses();

            // Mostrar el último mes por defecto
            const ultimoMes = this.estado.archivosDisponibles[this.estado.archivosDisponibles.length - 1];
            await this.mostrarMes(ultimoMes.mes);

            this.estado.cargaInicial = true;
            console.log('✅ DASHLINO inicializado correctamente');

        } catch (error) {
            console.error('❌ Error inicializando:', error);
            UI.mostrarError(error.message);
        } finally {
            UI.ocultarCargando();
        }
    },

    /**
     * Detecta qué archivos Excel están disponibles
     */
    async detectarArchivos() {
        console.log('🔍 Detectando archivos disponibles...');
        this.estado.archivosDisponibles = await LectorExcel.detectarArchivosDisponibles();
        console.log(`📁 Encontrados: ${this.estado.archivosDisponibles.length} archivos`);
    },

    /**
     * Carga y procesa todos los meses disponibles
     */
    async cargarTodosLosMeses() {
        console.log('📥 Cargando datos de todos los meses...');

        for (const archivo of this.estado.archivosDisponibles) {
            try {
                const workbook = await LectorExcel.cargarArchivo(archivo.url);
                const datosProcesados = Procesador.procesarMes(workbook, archivo);
                this.estado.datosPorMes[archivo.mes] = datosProcesados;
                console.log(`✅ ${archivo.mes}: ${(datosProcesados.tasaCaptura * 100).toFixed(1)}% captura`);
            } catch (error) {
                console.error(`❌ Error cargando ${archivo.mes}:`, error);
            }
        }
    },

    /**
     * Muestra los datos de un mes específico
     * @param {string} mes - Código del mes (SEP, OCT, NOV, etc.)
     */
    async mostrarMes(mes) {
        const datos = this.estado.datosPorMes[mes];
        
        if (!datos) {
            console.error(`❌ No hay datos para el mes: ${mes}`);
            return;
        }

        this.estado.mesActivo = mes;
        console.log(`📊 Mostrando datos de: ${mes}`);

        // Guardar datos globalmente para los modales
        window.DashboardData = {
            datosActuales: datos,
            faltantesPorUnidad: datos.faltantesPorUnidad,
            todasUnidades: datos.todasUnidades
        };

        // Obtener meses ordenados
        const mesesOrdenados = this.obtenerMesesOrdenados();
        const indiceMes = mesesOrdenados.findIndex(m => m.mes === mes);
        
        // Mes anterior para comparación
        const mesAnterior = indiceMes > 0 ? mesesOrdenados[indiceMes - 1] : null;
        const primerMes = mesesOrdenados[0];

        // Calcular comparación
        const comparacion = mesAnterior ? 
            Procesador.compararMeses(datos, mesAnterior) : 
            { deltaTasaCaptura: 0, incorporados: 0 };

        // Calcular proyección
        const proyeccion = Procesador.calcularProyeccion(mesesOrdenados.slice(0, indiceMes + 1));

        // Calcular evolución (mejoras/deterioros)
        const evolucion = Procesador.analizarEvolucion(datos, primerMes);

        // Actualizar UI
        UI.generarTabsMeses(mesesOrdenados, mes);
        UI.actualizarHeader(datos);
        UI.actualizarKPIHero(datos, comparacion, proyeccion, primerMes);
        UI.actualizarPanorama(datos, comparacion, primerMes);
        UI.actualizarEstadoUnidades(datos, comparacion);
        UI.actualizarConcentracion(datos.concentracion, datos.totalFaltantes);
        UI.actualizarEvolucion(evolucion, datos);
        UI.actualizarFooter(datos.duplicadosEliminados);

        // Actualizar gráfica
        Graficas.inicializarGraficaEvolucion('chartEvolucion', mesesOrdenados, proyeccion);
    },

    /**
     * Cambia al mes seleccionado
     * @param {string} mes - Código del mes
     */
    async cambiarMes(mes) {
        if (mes === this.estado.mesActivo) return;

        UI.mostrarCargando();
        
        // Pequeño delay para feedback visual
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await this.mostrarMes(mes);
        
        UI.ocultarCargando();
    },

    /**
     * Obtiene los meses ordenados cronológicamente
     * @returns {Array} - Meses ordenados
     */
    obtenerMesesOrdenados() {
        return this.estado.archivosDisponibles
            .map(a => this.estado.datosPorMes[a.mes])
            .filter(m => m !== undefined);
    },

    /**
     * Recarga los datos
     */
    async recargar() {
        LectorExcel.limpiarCache();
        this.estado.datosPorMes = {};
        await this.inicializar();
    }
};

// Funciones globales para onclick en HTML
window.App = App;

// Funciones de acceso rápido para modales (usadas en onclick)
window.mostrarUnidades100 = () => {
    const datos = window.DashboardData.datosActuales;
    Modales.mostrarUnidades100(datos.unidades100);
};

window.mostrarUnidadesEnProceso = () => {
    const datos = window.DashboardData.datosActuales;
    Modales.mostrarUnidadesEnProceso(datos.unidadesEnProceso, datos.faltantesPorUnidad);
};

window.mostrarUnidadesCriticas = () => {
    const datos = window.DashboardData.datosActuales;
    Modales.mostrarUnidadesCriticas(datos.unidadesCriticas);
};

window.mostrarFaltantesTotales = () => {
    const datos = window.DashboardData.datosActuales;
    Modales.mostrarFaltantesTotales(datos.totalFaltantes, datos.unidadesCriticas, datos.unidadesEnProceso);
};

window.mostrarTodasUnidades = () => {
    const datos = window.DashboardData.datosActuales;
    Modales.mostrarTodasUnidades(datos.todasUnidades);
};

window.mostrarExplicacionVelocidad = () => {
    const datos = window.DashboardData.datosActuales;
    const meses = App.obtenerMesesOrdenados();
    const idx = meses.findIndex(m => m.mes === datos.mes);
    const anterior = idx > 0 ? meses[idx - 1] : null;
    const comparacion = anterior ? Procesador.compararMeses(datos, anterior) : { incorporados: 0 };
    Modales.mostrarExplicacionVelocidad(datos, comparacion);
};

window.mostrarExplicacionDuplicados = () => {
    const datos = window.DashboardData.datosActuales;
    Modales.mostrarExplicacionDuplicados(datos.duplicadosEliminados);
};

window.mostrarExplicacionMejora = () => {
    Modales.mostrarExplicacionMejora(App.obtenerMesesOrdenados());
};

window.mostrarExplicacionPadron = () => {
    Modales.mostrarExplicacionPadron(App.obtenerMesesOrdenados());
};

window.cerrarModal = () => {
    Modales.cerrar();
};

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    App.inicializar();
});
