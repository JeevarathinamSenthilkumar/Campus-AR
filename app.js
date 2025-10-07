const MAPBOX_TOKEN = 'pk.eyJ1IjoianNlbnRoaWxrdW0iLCJhIjoiY21nZ3ZjeWg5MG5reDJqb3FqY3dsMWwyNCJ9.Eat-LbMG3vf52Pe40kBswQ'; // 🔑 Replace with your Mapbox token

// STEP 1: Load buildings from JSON
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

// STEP 2: Get user position
function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve([pos.coords.longitude, pos.coords.latitude]);
    }, reject, { enableHighAccuracy: true });
  });
}

// STEP 3: Get route from Mapbox (walking)
async function getRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes[0].geometry.coordinates;
}

// STEP 4: Place AR arrows
function placeArrows(coords) {
  const scene = document.querySelector('a-scene');

  coords.forEach(([lon, lat], index) => {
    const arrow = document.createElement('a-entity');
    arrow.setAttribute('gps-entity-place', `latitude: ${lat}; longitude: ${lon}`);
    arrow.setAttribute('gltf-model', 'assets/arrow.glb');
    arrow.setAttribute('scale', '2 2 2');
    arrow.setAttribute('rotation', '0 0 0');
    scene.appendChild(arrow);
  });
}

// STEP 5: Distance check (optional voice guidance)
function trackArrival(destLat, destLon) {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(pos => {
    const d = distance(pos.coords.latitude, pos.coords.longitude, destLat, destLon);
    if (d < 10) alert("🎯 You’ve reached the building!");
  });
}

// Haversine distance in meters
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// MAIN
window.onload = async () => {
  await loadBuildings();

  document.getElementById('startNav').addEventListener('click', async () => {
    const value = document.getElementById('buildingSelect').value;
    if (!value) return alert("Select a building first.");

    const [endLon, endLat] = value.split(',').map(Number);
    const start = await getUserLocation();
    const coords = await getRoute(start, [endLon, endLat]);
    placeArrows(coords);
    trackArrival(endLat, endLon);
  });
};
