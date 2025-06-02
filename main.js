const map = L.map('map').setView([51.3, 0.7], 9);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18
}).addTo(map);

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  draw: {
    marker: false,
    polyline: false,
    polygon: false,
    circle: false,
    circlemarker: false,
    rectangle: true
  },
  edit: { featureGroup: drawnItems, edit: false, remove: false }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (event) {
  drawnItems.clearLayers();
  drawnItems.addLayer(event.layer);
  const bounds = event.layer.getBounds();
  loadPaths(bounds);
});

function loadPaths(bounds) {
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"footway|path|track|bridleway"]
      (${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
    );
    out body;
    >;
    out skel qt;
  `;

  fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query
  })
  .then(res => res.json())
  .then(data => {
    const nodes = {};
    data.elements.filter(el => el.type === 'node').forEach(el => {
      nodes[el.id] = [el.lat, el.lon];
    });

    const paths = data.elements.filter(el => el.type === 'way');
    paths.forEach(path => {
      const latlngs = path.nodes.map(nodeId => nodes[nodeId]);
      L.polyline(latlngs, { color: 'green' }).addTo(map);
    });
  });
}
