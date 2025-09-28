import { map, datosGlobales } from './variables.js';
import { estiloDefault, crearPopupParcela } from './funciones.js';

// Cargar descripciones y parcelas
export function cargarDatosIniciales() {
    fetch("/static/descripciones.json")
        .then(res => res.json())
        .then(data => {
            datosGlobales.descripcionesData = data;
        })
        .catch(err => {
            console.warn("No se pudo cargar descripciones.json:", err);
            datosGlobales.descripcionesData = {};
        })
        .finally(() => {
            fetch("/static/geojson/parcelas.geojson")
                .then(res => res.json())
                .then(data => {
                    datosGlobales.geojsonLayerData = data;
                    datosGlobales.parcelasLayer = L.geoJSON(data, {
                        style: estiloDefault,
                        onEachFeature: crearPopupParcela
                    }).addTo(map);
                })
                .catch(err => console.error("Error cargando parcelas:", err));
        });
}

// Guardar descripción
export function guardarDescripcion(pda, descripcion) {
    return fetch("/guardar_descripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partida: pda, descripcion: descripcion })
    });
}

// Obtener lista de descripciones
export function obtenerListaDescripciones() {
    return fetch("/list_descripciones").then(res => res.json());
}