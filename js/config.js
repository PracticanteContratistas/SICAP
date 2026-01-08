/**
 * DASHLINO - Configuración Global
 * Archivo: config.js
 * Propósito: Centralizar todas las configuraciones del dashboard
 */

const CONFIG = {
    // Información del proyecto
    proyecto: {
        nombre: 'DASHLINO',
        subtitulo: 'Sistema de Análisis y Control de Contratistas',
        empresa: 'GRUPO MÉXICO',
        version: '2.0.0'
    },

    // Configuración de archivos Excel
    excel: {
        // Carpeta donde están los archivos
        carpetaData: 'data/',
        
        // Patrón de nombres de archivo (el dashboard buscará estos)
        archivos: [
            { mes: 'SEP', nombre: 'SEPTIEMBRE', archivo: 'SEPTIEMBRE_2025.xlsx', orden: 1 },
            { mes: 'OCT', nombre: 'OCTUBRE', archivo: 'OCTUBRE_2025.xlsx', orden: 2 },
            { mes: 'NOV', nombre: 'NOVIEMBRE', archivo: 'NOVIEMBRE_2025.xlsx', orden: 3 },
            { mes: 'DIC', nombre: 'DICIEMBRE', archivo: 'DICIEMBRE_2025.xlsx', orden: 4 },
            { mes: 'ENE', nombre: 'ENERO', archivo: 'ENERO_2026.xlsx', orden: 5 },
            { mes: 'FEB', nombre: 'FEBRERO', archivo: 'FEBRERO_2026.xlsx', orden: 6 }
        ],
        
        // Nombres de las hojas a leer
        hojas: {
            indicadores: 'Indicadores',
            indicadoresPrime: 'Indicadores PRIME',
            faltan: 'FALTAN',
            capturados: 'Capturados',
            duplicados: 'Duplicados_Detectados',
            detalleDuplicados: 'Detalle_Duplicados',
            comparacion: 'Comparación_Métodos'
        },
        
        // Columnas esperadas en Indicadores PRIME
        columnasIndicadores: {
            unidad: 'Unidad',
            contratosPadron: 'Total Contratos Padrón',
            contratosEstado: 'Total Contratos Estado',
            capturados: 'Capturados',
            faltan: 'Faltan',
            porcentaje: '% Captura'
        },
        
        // Columnas de la hoja FALTAN
        columnasFaltan: {
            consecutivo: 'Consecutivo',
            mes: 'Mes',
            empresa: 'Empresa',
            unidad: 'Unidad Estandarizada',
            contratista: 'Contratista',
            rfc: 'RFC',
            numeroContrato: 'Número de contrato',
            plantilla: 'Plantilla total',
            fechaInicio: 'Fecha inicio',
            fechaFin: 'Fecha final'
        }
    },

    // Umbrales para clasificación de unidades
    umbrales: {
        excelente: 1.0,      // 100%
        bueno: 0.90,         // 90%+
        enProceso: 0.70,     // 70-89%
        critico: 0.70        // <70%
    },

    // Meta objetivo
    meta: {
        porcentaje: 90,
        etiqueta: 'Meta: 90%'
    },

    // Colores del tema
    colores: {
        primario: '#111827',
        exito: '#22c55e',
        exitoClaro: '#dcfce7',
        advertencia: '#f59e0b',
        advertenciaClaro: '#fef3c7',
        peligro: '#dc2626',
        peligroClaro: '#fee2e2',
        info: '#0891b2',
        infoClaro: '#e0f2fe',
        gris: '#6b7280',
        grisClaro: '#f3f4f6',
        fondo: '#f8f9fa'
    },

    // Configuración de gráficas
    graficas: {
        tension: 0.3,
        puntosRadio: 5,
        puntosHoverRadio: 8
    },

    // Textos y etiquetas
    textos: {
        cargando: 'Cargando datos...',
        errorCarga: 'Error al cargar el archivo',
        sinDatos: 'Sin datos disponibles',
        unidades100: 'Unidades al 100%',
        enProceso: 'En Proceso',
        criticas: 'Requieren Atención',
        faltantes: 'Contratos Pendientes',
        incorporados: 'Incorporados'
    }
};

// Hacer disponible globalmente
window.CONFIG = CONFIG;
