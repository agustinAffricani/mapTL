import { distanciaControl, map, datosGlobales } from './variables.js';
import { obtenerListaDescripciones } from './fetchs.js';
// Estilos
const ESTILO_DEFAULT = { color: "MediumBlue", weight: 1, fillOpacity: 0.06 };
const ESTILO_RESALTADO = { color: "red", weight: 3, fillOpacity: 0.3 };

export function estiloDefault() {
    return ESTILO_DEFAULT;
}

export function estiloResaltado() {
    return ESTILO_RESALTADO;
}

// Generar contenido del popup (reutilizable)
export function generarContenidoPopup(feature) {
    const props = feature.properties;
    const pda = props.PDA;
    const cca = props.CCA;
    
    // ✅ Clave para guardar: PDA si existe, sino CCA
    const claveGuardado = pda || cca;
 
    const descripcionExistente = datosGlobales.descripcionesData[claveGuardado] || "";
    const superficie = props.ARA1 ? (props.ARA1 / 10000).toFixed(2) : "N/A";
    
    const layerTemp = L.geoJSON(feature);
    const coords = layerTemp.getBounds().getCenter();
    const coordStr = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

    return `
        <b>Partida:</b> ${props.PDA || "N/A"} 
        ${pda ? `<button class="copy-btn" data-partida="${pda}">📋 Copiar</button>` : ''}
        <br>
        <hr>
        <b>Tipo:</b> ${props.TPA || "N/A"}<br>
        <b>Superficie (ha):</b> ${superficie}<br>
        <hr>
        <b>Coordenadas:</b> 
          <div class="coord-container">
            <span class="coord-box">${coordStr}</span>
            <button class="copy-coords-btn copy-btn" data-coords="${coordStr}">Copiar 📋</button>
          </div>
        <b>Descripción:</b> 
        <input type="text" class="descripcion-input" value="${descripcionExistente}">
        <button class="save-desc-btn" 
                data-clave="${claveGuardado}"
                data-es-pda="${!!pda}">💾</button>
    `;
}

// Crear popup y asignar comportamiento al hacer clic
export function crearPopupParcela(feature, layer) {
    // No usamos bindPopup aquí
    layer.on('click', function() {
        // Limpiar estado previo
        borrarResaltado();
        borrarRuta();

        // Resaltar esta parcela
        layer.setStyle(ESTILO_RESALTADO);
        datosGlobales.resaltadoLayer = layer;

        // Centrar en la parcela
        map.fitBounds(layer.getBounds());

        // Mostrar popup con contenido actualizado
        const contenido = generarContenidoPopup(feature);
        layer.bindPopup(contenido).openPopup();
    });
}

// Utilidades de mapa
export function resetearDistancia() {
    distanciaControl.update();
}

export function borrarResaltado() {
    if (datosGlobales.resaltadoLayer) {
        datosGlobales.resaltadoLayer.setStyle(ESTILO_DEFAULT);
        datosGlobales.resaltadoLayer = null;
    }
    map.closePopup();
    resetearDistancia();
}

export function borrarRuta() {
    if (datosGlobales.rutaLayer) {
        map.removeLayer(datosGlobales.rutaLayer);
        datosGlobales.rutaLayer = null;
    }
    resetearDistancia();
}

export function mostrarMensajeMapa(mensaje, duracion = 5000) {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
    }, duracion);
}

export function mostrarToast(mensaje) {
    const toast = document.getElementById("toastPartida");
    toast.textContent = mensaje;
    toast.className = "show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

export function obtenerUbicacionActual(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                callback([lat, lng]);
            },
            function(error) {
                mostrarMensajeMapa("❌ No se pudo obtener tu ubicación actual.");
                console.error(error);
            }
        );
    } else {
        mostrarMensajeMapa("❌ La geolocalización no está soportada en este navegador.");
    }
}

export function trazarRuta(latDestino, lonDestino) {
    if (datosGlobales.rutaLayer) {
        map.removeLayer(datosGlobales.rutaLayer);
        datosGlobales.rutaLayer = null;
    }

    obtenerUbicacionActual(async function (origen) {
        const [latOrigen, lonOrigen] = origen;

        try {
            const bodyORS = { coordinates: [[lonOrigen, latOrigen], [lonDestino, latDestino]] };
            const responseORS = await fetch("/ruta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyORS)
            });
            if (!responseORS.ok) throw new Error("Error ORS");

            const dataORS = await responseORS.json();
            if (!dataORS.features || dataORS.features.length === 0) throw new Error("Sin rutas ORS");

            datosGlobales.rutaLayer = L.geoJSON(dataORS, {
                style: { color: "lime", weight: 5, opacity: 1, dashArray: "20 8" }
            }).addTo(map);

            map.fitBounds(datosGlobales.rutaLayer.getBounds());
            mostrarMensajeMapa("📍 Ruta trazada (Línea verde punteada).");

            const distanciaKm = (dataORS.features[0].properties.summary.distance / 1000).toFixed(2);
            distanciaControl.update(distanciaKm);
            return;
        } catch (err) {
            console.warn("Fallo ORS, probamos con OSRM:", err.message);
        }

        try {
            const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${lonOrigen},${latOrigen};${lonDestino},${latDestino}?overview=full&geometries=geojson`;
            const responseOSRM = await fetch(urlOSRM);
            if (!responseOSRM.ok) throw new Error("Error OSRM");

            const dataOSRM = await responseOSRM.json();
            if (!dataOSRM.routes || dataOSRM.routes.length === 0) {
                mostrarMensajeMapa("❌ No se pudo encontrar una ruta.");
                return;
            }

            const ruta = dataOSRM.routes[0].geometry;
            datosGlobales.rutaLayer = L.geoJSON(ruta, {
                style: { color: "lime", weight: 5, opacity: 1, dashArray: "20 8" }
            }).addTo(map);

            map.fitBounds(datosGlobales.rutaLayer.getBounds());
            mostrarMensajeMapa("📍 Ruta trazada (Línea verde punteada).");

            const distanciaKm = (dataOSRM.routes[0].distance / 1000).toFixed(2);
            distanciaControl.update(distanciaKm);

        } catch (err) {
            console.error("Error OSRM:", err);
            mostrarMensajeMapa("❌ No se pudo calcular la ruta.");
        }
    });
}

export function buscarPartida() {
    const partidaInput = document.getElementById("partidaInput");
    const partidaBuscada = partidaInput?.value.trim();
    if (!partidaBuscada) return;

    borrarResaltado();
    borrarRuta();

    let encontrada = false;
    datosGlobales.parcelasLayer.eachLayer(layer => {
        if (layer.feature.properties.PDA === partidaBuscada) {
            encontrada = true;
            // Simular clic para reutilizar toda la lógica
            layer.fire('click');
            const centro = layer.getBounds().getCenter();
            trazarRuta(centro.lat, centro.lng);
            return;
        }
    });

    if (!encontrada) {
        mostrarMensajeMapa("❌ No se encontró la partida " + partidaBuscada);
    }
}

// Modal
export function abrirModal() {
    document.getElementById("modalDesc").style.display = "block";
}

export function cerrarModal() {
    document.getElementById("modalDesc").style.display = "none";
}

 // Tabla buscar por Descripción
export function buscarDesc() {
    obtenerListaDescripciones()
            .then(descripciones => {
                let tbody = document.querySelector("#tablaDescripciones tbody");
                tbody.innerHTML = "";

                Object.entries(descripciones).forEach(([clave, descripcion]) => {
                    let tr = document.createElement("tr");
                    if (/^\d+$/.test(clave)) {
                            tr.innerHTML = `<td>${clave}</td><td>${descripcion}</td>`;
                        } else {
                            tr.innerHTML = `<td>Sin Nro de Partida</td><td>${descripcion}</td>`;
                        }
                    tr.addEventListener("click", () => {
                        // Si la clave es un número (PDA), usar centrarEnParcela
                        // Si no, asumir que es CCA y usar centrarEnParcelaPorCCA
                        if (/^\d+$/.test(clave)) {
                            centrarEnParcela(clave);
                        } else {
                            centrarEnParcelaPorCCA(clave);
                        }
                        cerrarModal();
                    });
                    tbody.appendChild(tr);
                });
                abrirModal();
            })
            .catch(err => console.error("Error:", err));
}


// Centrar en parcela (reutiliza el evento de clic)
export function centrarEnParcela(partida) {
    datosGlobales.parcelasLayer.eachLayer(layer => {
        if (layer.feature.properties.PDA == partida) {
            layer.fire('click'); // 👈 dispara el mismo comportamiento que al hacer clic
            return;
        }
    });
}

export function centrarEnParcelaPorCCA(cca) {
    borrarResaltado();
    borrarRuta();

    datosGlobales.parcelasLayer.eachLayer(layer => {
        if (layer.feature.properties.CCA === cca) {
            layer.fire('click');
            return;
        }
    });
}

// Colores por superficie
export function applySurfaceColor() {
    const min = parseFloat(document.getElementById("minArea").value);
    const max = parseFloat(document.getElementById("maxArea").value);
    const color = document.getElementById("surfaceColor").value;

    if (isNaN(min) || isNaN(max)) {
        alert("Por favor ingresa valores válidos de superficie.");
        return;
    }

    datosGlobales.parcelasLayer.eachLayer(layer => {
        if (layer.feature?.properties?.ARA1 !== undefined) {
            const areaHa = layer.feature.properties.ARA1 / 10000;
            if (areaHa >= min && areaHa <= max) {
                layer.setStyle({ fillColor: color, color: color, fillOpacity: 0.3 });
            }
        }
    });
}

export function resetSurfaceColor() {
    datosGlobales.parcelasLayer.eachLayer(layer => {
        if (layer.feature?.properties) {
            layer.setStyle(ESTILO_DEFAULT);
        }
    });
}