const MAPBOX_TOKEN = 'pk.eyJ1IjoianNlbnRoaWxrdW0iLCJhIjoiY21nZ3ZjeWg5MG5reDJqb3FqY3dsMWwyNCJ9.Eat-LbMG3vf52Pe40kBswQ'; // 🔑 Replace with your Mapbox token

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Load buildings from JSON
async function loadBuildings() {
  const res = await fetch('buildings.json');
  const buildings = await res.json();
  const select = document.getElementById('buildingSelect');
  buildings.forEach(b => {
    const opt = document.createElement('option');
    opt.value = `${b.longitude},${b.latitude}`;
    opt.textContent = b.name;
    select.appendChild(opt);
  });
}

// Get user GPS
function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve([pos.coords.longitude, pos.coords.latitude]);
    }, reject, { enableHighAccuracy: true });
  });
}

// Mapbox walking route
async function getRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes[0].geometry.coordinates;
}

// Place arrows along route
function placeArrows(coords) {
  const scene = document.querySelector('a-scene');
  const modelPath = isIOS() ? 'assets/arrow.usdz' : 'assets/arrow.glb';

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    const bearing = getBearing(lat1, lon1, lat2, lon2);

    const arrow = document.createElement('a-entity');
    arrow.setAttribute('gps-entity-place', `latitude: ${lat1}; longitude: ${lon1}`);
    arrow.setAttribute('gltf-model', `url(${modelPath})`);
    arrow.setAttribute('scale', '2 2 2');
    arrow.setAttribute('rotation', `0 ${bearing} 0`);
    arrow.setAttribute('crossorigin', 'anonymous');

    // Debugging
    arrow.addEventListener('model-error', e => console.error('Model failed to load', e));
    arrow.addEventListener('model-loaded', e => console.log('Model loaded', e));

    scene.appendChild(arrow);
  }
}

// Calculate bearing between two points
function getBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const toDeg = rad => rad * 180 / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1)*Math.sin(φ2) - Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

// Distance in meters
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Track arrival
function trackArrival(destLat, destLon) {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(pos => {
    const d = distance(pos.coords.latitude, pos.coords.longitude, destLat, destLon);
    if (d < 10) alert("🎯 You’ve reached the building!");
  });
}

// MAIN
window.onload = async () => {
  await loadBuildings();

  document.getElementById('startNav').addEventListener('click', async () => {
    const value = document.getElementById('buildingSelect').value;
    if (!value) return alert("Select a building first.");

    const [endLon, endLat] = value.split(',').map(Number);
    const start = await getUserLocation();
    console.log("User start:", start);
    const coords = await getRoute(start, [endLon, endLat]);
    console.log("Route coords:", coords);
    placeArrows(coords);
    trackArrival(endLat, endLon);
  });
};
