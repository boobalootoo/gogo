let map = L.map('map').setView([51.505, -0.09], 14); // Center somewhere typical

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let geojsonData;
let pathLayer;
let start = null, end = null;

fetch('paths.geojson')
  .then(res => res.json())
  .then(data => {
    geojsonData = data;
    pathLayer = L.geoJSON(data, {
      style: { color: '#888' }
    }).addTo(map);
  });

map.on('click', function (e) {
  if (!geojsonData) return;

  const nearest = findNearestPoint(e.latlng, geojsonData);
  if (!nearest) return;

  L.circleMarker(nearest, { radius: 6, color: 'blue' }).addTo(map);

  if (!start) {
    start = nearest;
  } else if (!end) {
    end = nearest;
    const route = findRoute(start, end, geojsonData);
    if (route) {
      L.geoJSON(route, { style: { color: 'red', weight: 4 } }).addTo(map);
    }
  } else {
    start = nearest;
    end = null;
    map.eachLayer(layer => {
      if (layer instanceof L.CircleMarker || layer.options?.style?.color === 'red') map.removeLayer(layer);
    });
  }
});

function findNearestPoint(latlng, geojson) {
  let minDist = Infinity, closestPoint = null;

  geojson.features.forEach(f => {
    f.geometry.coordinates.forEach(coord => {
      const point = L.latLng(coord[1], coord[0]);
      const dist = latlng.distanceTo(point);
      if (dist < minDist) {
        minDist = dist;
        closestPoint = point;
      }
    });
  });

  return closestPoint;
}

// Extremely simple routing: returns all lines containing start and end
function findRoute(start, end, geojson) {
  return {
    type: 'FeatureCollection',
    features: geojson.features.filter(f => {
      const coords = f.geometry.coordinates;
      const containsStart = coords.some(c => L.latLng(c[1], c[0]).distanceTo(start) < 5);
      const containsEnd = coords.some(c => L.latLng(c[1], c[0]).distanceTo(end) < 5);
      return containsStart || containsEnd;
    })
  };
}
