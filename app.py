from flask import Flask, render_template, jsonify, request
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
ORS_API_KEY = os.getenv("ORS_API_KEY")

# --- Página principal ---
@app.route("/")
def index():
    return render_template("index.html")

# --- Endpoint para obtener parcelas ---
@app.route("/get_parcelas")
def get_parcelas():
    geojson_path = os.path.join(app.root_path, "static", "geojson", "parcelas.geojson")
    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data)

# --- Endpoint para calcular ruta (API Key oculta) ---
@app.route("/ruta", methods=["POST"])
def ruta():
    data = request.json
    coordinates = data.get("coordinates")
    if not coordinates:
        return jsonify({"error": "Faltan coordenadas"}), 400

    url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {"coordinates": coordinates}

    try:
        response = requests.post(url, headers=headers, json=body)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
