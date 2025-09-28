// Mapa
export let map = L.map('map').setView([-35.98, -62.73], 12);

// Pane para labels
map.createPane('labels');
map.getPane('labels').style.zIndex = 650;
map.getPane('labels').style.pointerEvents = 'none';

// Capas base
export const callejero = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
});

export const satelitalConCalles = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
  }
);

export const labelsCalles = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Labels &copy; Esri',
    pane: 'labels'
  }
);

export const satelitalHibrido = L.layerGroup([satelitalConCalles, labelsCalles]);

// Control de capas
const baseMaps = {
    "Callejero": callejero,
    "Satelital": satelitalHibrido
};
L.control.layers(baseMaps).addTo(map);

// ✅ Estado global (todo lo mutable aquí)
export const datosGlobales = {
    geojsonLayerData: null,
    descripcionesData: {},
    parcelasLayer: null,
    resaltadoLayer: null,
    rutaLayer: null
};

// Widget de distancia
export let distanciaControl = L.control({ position: 'bottomleft' });
distanciaControl.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'distancia-widget');
    this.update();
    return this._div;
};
distanciaControl.update = function(distancia) {
    this._div.innerHTML = distancia
        ? `<b>📍 Distancia del recorrido: </b>${distancia} km`
        : '📌 Busca partida para trazar ruta';
};
distanciaControl.addTo(map);

// Coordenadas del centro de Trenque Lauquen
export const centroTL = [-62.7314, -35.9703];