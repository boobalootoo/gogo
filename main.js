const map = L.map('map').setView([51.3, -0.7], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    marker: false,
    circle: false,
    circlemarker: false,
    polyline: false
  },
  edit: { featureGroup: drawnItems }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, async function (event) {
  drawnItems.clearLayers();
  const layer = event.layer;
  drawnItems.addLayer(layer);

  const bounds = layer.getBounds();
  const [south, west] = [bounds.getSouth(), bounds.getWest()];
  const [north, east] = [bounds.getNorth(), bounds.getEast()];

  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"footway|path|track|bridleway"](${south},${west},${north},${east});
    );
    out body;
    >;
    out skel qt;
  `.trim();

  const url = "https://overpass-api.de/api/interpreter";
  const response = await fetch(url, {
    method: "POST",
    body: query,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  const data = await response.json();
  const geojson = osmtogeojson(data);

  L.geoJSON(geojson, {
    style: { color: 'green', weight: 2 }
  }).addTo(map);
});

// include osmtogeojson
const script = document.createElement("script");
script.src = "https://unpkg.com/osmtogeojson@3.0.0/osmtogeojson.js";
document.body.appendChild(script);
