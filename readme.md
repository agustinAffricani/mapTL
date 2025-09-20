# mapTL

Aplicación web interactiva para visualizar, buscar y gestionar parcelas en un mapa.  
Permite buscar partidas, ver sus descripciones, trazar rutas, agregar notas y más.  

## 🚀 Funcionalidades

- Visualización de parcelas en el mapa (GeoJSON).  
- Búsqueda por número de partida.  
- Búsqueda por descripción con ventana modal y tabla.  
- Popup con detalles de la parcela (partida, tipo, superficie, descripción).  
- Resaltado de parcelas seleccionadas.  
- Trazado de rutas entre puntos.  
- Toasts informativos al copiar, guardar descripciones o trazar rutas.  
- Botón de **borrar búsqueda** que limpia resaltados, rutas y popups.  
- Adaptado para uso en dispositivos móviles.  

## 🛠️ Tecnologías utilizadas

- [Flask](https://flask.palletsprojects.com/) (Python) – Backend.  
- [Leaflet](https://leafletjs.com/) – Librería de mapas interactivos.  
- JavaScript, HTML, CSS.  
- GeoJSON para datos de parcelas.  
- [Render](https://render.com/) – Deploy.  

## 📂 Estructura básica del proyecto

# mapTL

Aplicación web interactiva para visualizar, buscar y gestionar parcelas en un mapa.  
Permite buscar partidas, agregar y ver sus descripciones, trazar rutas y más.  

## 🚀 Funcionalidades

- Visualización de parcelas en el mapa (GeoJSON).  
- Búsqueda por número de partida.  
- Búsqueda por descripción con ventana modal y tabla.  
- Popup con detalles de la parcela (partida, tipo, superficie, descripción).  
- Resaltado de parcelas seleccionadas.  
- Trazado de rutas entre puntos.  
- Toasts informativos al copiar, guardar descripciones o trazar rutas.  
- Botón de **borrar búsqueda** que limpia resaltados, rutas y popups.  
- Adaptado para uso en dispositivos móviles.  

## 🛠️ Tecnologías utilizadas

- [Flask](https://flask.palletsprojects.com/) (Python) – Backend.  
- [Leaflet](https://leafletjs.com/) – Librería de mapas interactivos.  
- JavaScript, HTML, CSS.  
- GeoJSON para datos de parcelas (capa de las parcelas).  
- [Render](https://render.com/) – Deploy.  

## 📂 Estructura básica del proyecto

'''mapTL/
├── app.py
├── requirements.txt
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── mapa.js
│   ├── geojson/
│   │   └── parcelas.geojson
│   └── descripciones.json
├── templates/
│   └── index.html
└── README.md'''

##✍️ Desarrollado por Agustín Affricani
