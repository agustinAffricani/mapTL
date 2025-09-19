var map = L.map('map').setView([-35.98, -62.73], 12);

// --- crear pane para labels (encima de los tiles) ---
map.createPane('labels');                   // crea la pane
map.getPane('labels').style.zIndex = 650;   // mayor que tilePane (200) y overlayPane
map.getPane('labels').style.pointerEvents = 'none'; // que no interfiera con clicks

// Capa callejera (OSM)
var callejero = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Capa satelital (ESRI World Imagery)
var satelitalConCalles = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri'
  }
);

// Capa de nombres de calles (usa la pane 'labels' que creamos)
var labelsCalles = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Labels &copy; Esri',
    pane: 'labels'
  }
);

// Grupo satélite + labels (labels quedarán arriba por la pane)
var satelitalHibrido = L.layerGroup([satelitalConCalles, labelsCalles]);

// Control de capas
var baseMaps = {
    "Callejero": callejero,
    "Satelital": satelitalHibrido
};
L.control.layers(baseMaps).addTo(map);

var geojsonLayerData; 
var parcelasLayer; 
var resaltadoLayer = null; 
var rutaLayer = null; // capa de la ruta

function estiloDefault(feature) {
  return { color: "MediumBlue", weight: 1, fillOpacity: 0.06 };
}

function estiloResaltado(feature) {
  return { color: "red", weight: 3, fillOpacity: 0.3 };
}

  function resetearDistancia() {
    distanciaControl.update(); // si no pasás parámetro, mostrará "Traza una ruta para ver la distancia"
}

function borrarResaltado() {
  if (resaltadoLayer) {
    map.removeLayer(resaltadoLayer);
    resaltadoLayer = null;
  }
   resetearDistancia();
}

function borrarRuta() {
  if (rutaLayer) {
    map.removeLayer(rutaLayer);
    rutaLayer = null;
  }
  resetearDistancia();
}

// --- Cargar descripciones y parcelas ---
let descripcionesData = {}; // objeto donde guardamos descripciones

// 1) Cargar descripciones primero
fetch("/static/descripciones.json")
  .then(res => res.json())
  .then(data => {
    descripcionesData = data; // guardamos en variable global
  })
  .catch(err => {
    console.warn("No se pudo cargar descripciones.json:", err);
    descripcionesData = {}; // seguimos con objeto vacío
  })
  .finally(() => {
    // 2) Cargar GeoJSON de parcelas
    fetch("/static/geojson/parcelas.geojson")
      .then(res => res.json())
      .then(data => {
        geojsonLayerData = data;

        parcelasLayer = L.geoJSON(data, {
          style: estiloDefault,
          onEachFeature: function(feature, layer) {
            // si hay descripción en el JSON, la agregamos
            let descripcionExistente = descripcionesData[feature.properties.PDA] || "";

            layer.bindPopup(
              `<b>Partida:</b> ${feature.properties.PDA || "N/A"} 
              <button class="copy-btn" data-partida="${feature.properties.PDA}">📋 Copiar</button><br>
              <hr>
              <b>Tipo:</b> ${feature.properties.TPA || "N/A"}<br>
              <b>Superficie (ha):</b> ${feature.properties.ARA1 ? (feature.properties.ARA1/10000).toFixed(2) : "N/A"}<br>
              <hr>
              <b>Descripción:</b> 
              <input type="text" class="descripcion-input" id="desc-${feature.properties.PDA}" placeholder="Agregar descripción" value="${descripcionExistente}">
              <button class="save-desc-btn" data-pda="${feature.properties.PDA}">💾</button>`
            );

            // Evento click en parcela
            layer.on("click", function () {
              borrarResaltado();
              resaltadoLayer = L.geoJSON(feature, { style: estiloResaltado }).addTo(map);
              // Ajustar zoom antes de abrir popup
              map.fitBounds(resaltadoLayer.getBounds());
              let descripcionExistente = descripcionesData[feature.properties.PDA] || "";
              resaltadoLayer.eachLayer(function(subLayer) {
                subLayer.bindPopup(
                  `<b>Partida:</b> ${feature.properties.PDA || "N/A"} 
                  <button class="copy-btn" data-partida="${feature.properties.PDA}">📋 Copiar</button><br>
                  <hr>
                  <b>Tipo:</b> ${feature.properties.TPA || "N/A"}<br>
                  <b>Superficie (ha):</b> ${feature.properties.ARA1 ? (feature.properties.ARA1/10000).toFixed(2) : "N/A"}<br>
                  <hr>
                  <b>Descripción:</b> 
                  <input type="text" class="descripcion-input" id="desc-${feature.properties.PDA}" placeholder="Agregar descripción" value="${descripcionExistente}">
                  <button class="save-desc-btn" data-pda="${feature.properties.PDA}">💾</button>`
                ).openPopup();
              });

              map.fitBounds(resaltadoLayer.getBounds());
            });
          }
        }).addTo(map);
      })
      .catch(err => console.error("Error cargando parcelas:", err));
  });

// Buscar partida
function buscarPartida() {
  var partidaBuscada = document.getElementById("partidaInput").value.trim();
  if (!partidaBuscada) return;

  borrarResaltado();
  borrarRuta();

  var encontrado = geojsonLayerData.features.find(f => f.properties.PDA === partidaBuscada);

  if (encontrado) {
    resaltadoLayer = L.geoJSON(encontrado, {
      style: estiloResaltado
    }).addTo(map);

    let bounds = resaltadoLayer.getBounds();
    let centroide = bounds.getCenter();
      // 🔑 Ahora tomamos la descripción del JSON cargado
    let descripcionExistente = descripcionesData[encontrado.properties.PDA] || "";
    resaltadoLayer.eachLayer(function(layer) {
      layer.bindPopup(
          `<b>Partida:</b> ${encontrado.properties.PDA || "N/A"} 
          <button class="copy-btn" data-partida="${encontrado.properties.PDA}">📋 Copiar</button><br>
          <hr>
          <b>Tipo:</b> ${encontrado.properties.TPA || "N/A"}<br>
          <b>Superficie (ha):</b> ${
            encontrado.properties.ARA1 ? (encontrado.properties.ARA1 / 10000).toFixed(2) : "N/A"
          }<br>
          <hr>
          <b>Descripción:</b> 
          <input type="text" class="descripcion-input" id="desc-${encontrado.properties.PDA}" placeholder="Agregar descripción" value="${descripcionExistente}">
          <button class="save-desc-btn" data-pda="${encontrado.properties.PDA}">💾</button>`
        ).openPopup();
    });
 map.fitBounds(resaltadoLayer.getBounds());

  // Usamos el centro calculado por Leaflet (bounds.getCenter())
  trazarRuta(centroide.lat, centroide.lng);

  } else {
    mostrarMensajeMapa("❌ No se encontró la partida " + partidaBuscada);
  }
}

// Coordenadas del centro de Trenque Lauquen
const centroTL = [-62.7314, -35.9703]; 
function obtenerUbicacionActual(callback) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        callback([lat, lng]); // devolvemos el array [lat, lng]
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

async function trazarRuta(latDestino, lonDestino) {
  if (rutaLayer) {
    map.removeLayer(rutaLayer);
  }

  obtenerUbicacionActual(async function (origen) {
    const [latOrigen, lonOrigen] = origen;

    try {
      // ----- ORS -----
      const bodyORS = { coordinates: [[lonOrigen, latOrigen], [lonDestino, latDestino]] };
      const responseORS = await fetch("/ruta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyORS)
      });
      if (!responseORS.ok) throw new Error("Error ORS");

      const dataORS = await responseORS.json();
      if (!dataORS.features || dataORS.features.length === 0) throw new Error("Sin rutas ORS");

      rutaLayer = L.geoJSON(dataORS, {
        style: { color: "lime", weight: 5, opacity: 1, dashArray: "20 8" }
      }).addTo(map);

      map.fitBounds(rutaLayer.getBounds());
      mostrarMensajeMapa("📍 Ruta trazada (Línea verde punteada).")

      // ✅ Actualizar widget
      const distanciaKm = (dataORS.features[0].properties.summary.distance / 1000).toFixed(2);
      distanciaControl.update(distanciaKm);

      return;
    } catch (err) {
      console.warn("Fallo ORS, probamos con OSRM:", err.message);
    }

    try {
      // ----- OSRM -----
      const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${lonOrigen},${latOrigen};${lonDestino},${latDestino}?overview=full&geometries=geojson`;
      const responseOSRM = await fetch(urlOSRM);
      if (!responseOSRM.ok) throw new Error("Error OSRM");

      const dataOSRM = await responseOSRM.json();
      if (!dataOSRM.routes || dataOSRM.routes.length === 0) {
        mostrarMensajeMapa("❌ No se pudo encontrar una ruta.");
        return;
      }

      const ruta = dataOSRM.routes[0].geometry;
      rutaLayer = L.geoJSON(ruta, {
        style: { color: "lime", weight: 5, opacity: 1, dashArray: "20 8" }
      }).addTo(map);

      map.fitBounds(rutaLayer.getBounds());
      mostrarMensajeMapa("📍 Ruta trazada (Línea verde punteada).")

      // ✅ Actualizar widget
      const distanciaKm = (dataOSRM.routes[0].distance / 1000).toFixed(2);
      distanciaControl.update(distanciaKm);

    } catch (err) {
      console.error("Error OSRM:", err);
      mostrarMensajeMapa("❌ No se pudo calcular la ruta.");
    }
  });
}

function mostrarMensajeMapa(mensaje, duracion = 5000) {
    const toast = document.getElementById("toast");
    toast.textContent = mensaje;
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
    }, duracion);
}

const partidaInput = document.getElementById("partidaInput");
const toast = document.getElementById("toastPartida");

// Función para mostrar el cartel
function mostrarToast(mensaje) {
  toast.textContent = mensaje;
  toast.className = "show";
  setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}

// Filtro en tiempo real
partidaInput.addEventListener("input", function () {
  const valorAnterior = this.value;
  this.value = this.value.replace(/\D/g, ""); // elimina todo lo que no sea número

  if (this.value !== valorAnterior) {
    mostrarToast("⚠️ Solo ingreso de números");
  }
});

// Detectar click en botones de copiar dentro de popups
document.addEventListener("click", function(e) {
  if (e.target && e.target.classList.contains("copy-btn")) {
    const partida = e.target.getAttribute("data-partida");
    if (partida) {
      navigator.clipboard.writeText(partida).then(() => {
        mostrarToast("✅ Partida copiada: " + partida);
      }).catch(err => {
        console.error("Error al copiar:", err);
        mostrarToast("❌ No se pudo copiar");
      });
    }
  }
});

// Crear el control del widget de distancia
let distanciaControl = L.control({ position: 'bottomleft' });

distanciaControl.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'distancia-widget'); 
    this.update();
    return this._div;
};

distanciaControl.update = function(distancia) {
    this._div.innerHTML = distancia 
        ? `<b>Distancia del recorrido:</b><br>${distancia} km` 
        : '📌 Traza una ruta para ver la distancia';
};

distanciaControl.addTo(map);

    // Guardar descripción
document.addEventListener("click", function (e) {
  if (e.target && e.target.classList.contains("save-desc-btn")) {
    const pda = e.target.getAttribute("data-pda");
    const input = document.getElementById(`desc-${pda}`);
    if (input) {
      const descripcion = input.value.trim();

      // Actualizamos en el feature
      const parcela = geojsonLayerData.features.find(f => f.properties.PDA === pda);
      if (parcela) {
        parcela.properties.descripcion = descripcion;

        // Enviar al backend para persistir
        fetch("/guardar_descripcion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ partida: pda, descripcion: descripcion })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              mostrarToast("✅ Descripción guardada");

              // Actualizar feature en memoria
              const feature = geojsonLayerData.features.find(f => f.properties.PDA === pda);
              if (feature) feature.properties.descripcion = descripcion;

              // 🔑 Actualizar el JSON en memoria
              descripcionesData[pda] = descripcion;

              // Actualizar el popup abierto
              map.eachLayer(layer => {
                if (layer.feature && layer.feature.properties.PDA === pda && layer.getPopup()) {
                  const nuevoPopup = `<b>Partida:</b> ${pda} 
              <button class="copy-btn" data-partida="${pda}">📋 Copiar</button><br>
              <hr>
              <b>Tipo:</b> ${layer.feature.properties.TPA || "N/A"}<br>
              <b>Superficie (ha):</b> ${layer.feature.properties.ARA1 ? (layer.feature.properties.ARA1 / 10000).toFixed(2) : "N/A"
                    }<br>
                    <hr>
              <b>Descripción:</b> 
              <input type="text" class="descripcion-input" id="desc-${pda}" placeholder="Agregar descripción" value="${descripcion}">
              <button class="save-desc-btn" data-pda="${pda}">💾</button>`;

                  layer.setPopupContent(nuevoPopup).openPopup();
                }
              });
            }
            else {
              mostrarToast("❌ Error al guardar");
            }
          })
          .catch(err => {
            console.error(err);
            mostrarToast("❌ Error al guardar");
          });
      }
    }
  }
});
