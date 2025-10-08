// main.js
import { map, callejero, controlCapas } from './variables.js';
import { cargarDatosIniciales } from './fetchs.js';
import { 
    borrarResaltado, 
    borrarRuta, 
    buscarPartida,
    applySurfaceColor,
    resetSurfaceColor
} from './funciones.js';
import { inicializarEventosPopups, crearMenuControl } from './eventos.js';

// Inicializar mapa
callejero.addTo(map);
cargarDatosIniciales();

// Exponer funciones globales para onclick en HTML
window.borrarResaltado = borrarResaltado;
window.borrarRuta = borrarRuta;
window.buscarPartida = buscarPartida;
window.applySurfaceColor = applySurfaceColor;
window.resetSurfaceColor = resetSurfaceColor;

// Inicializar eventos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    inicializarEventosPopups(); // ← esto registra el 'popupopen'
    

    // ✅ Izquierda: hamburguesa (se agrega solo al crear el control)
    map.addControl(crearMenuControl(map));
    
    // ✅ Derecha: primero capas, luego zoom
    controlCapas.addTo(map);
});

