const MAPBOX_TOKEN = 'pk.eyJ1IjoianNlbnRoaWxrdW0iLCJhIjoiY21nZ3ZjeWg5MG5reDJqb3FqY3dsMWwyNCJ9.Eat-LbMG3vf52Pe40kBswQ'; // Replace with your Mapbox token

// Engineering Building GPS coordinates
const TARGET = {
  name: "Engineering Building",
  latitude: 31.7714,
  longitude: -106.5059
};

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.longitude, pos.coords.latitude]),
      reject,
      { enableHighAccuracy: true }
    );
  });
}

async function getRoute(start, end) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes[0].geometry.coordinates;
}

function placeArrows(coords) {
  const scene = document.querySelector('a-scene');
  const modelPath = isIOS() ? 'assets/arrow.usdz' : 'assets/arrow.glb';

  scene.addEventListener('loaded', () => {
    coords.forEach(([lon, lat], i) => {
      let next = coords[i + 1] || [lon, lat];
      const bearing = getBearing(lat, lon, next[1], next[0]);

      const arrow = document.createElement('a-entity');
      arrow.setAttribute('gps-entity-place', `latitude:${lat}; longitude:${lon}`);
      arrow.setAttribute('gltf-model', `url(${modelPath})`);
      arrow.setAttribute('scale', '2 2 2');
      arrow.setAttribute('rotation', `0 ${bearing} 0`);
      arrow.setAttribute('crossorigin', 'anonymous');

      arrow.addEventListener('model-error', e => console.error('Model load error', e));
      scene.appendChild(arrow);
    });
  });
}

// Calculate bearing between two GPS points
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

// Track arrival within 10 meters
function distance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function trackArrival(destLat, destLon) {
  if (!navigator.geolocation) return;
  navigator.geolocation.watchPosition(pos => {
    const d = distance(pos.coords.latitude, pos.coords.longitude, destLat, destLon);
    if (d < 10) alert(`🎯 You’ve reached ${TARGET.name}!`);
  });
}

// Main function
window.onload = async () => {
  try {
    const start = await getUserLocation();
    const coords = await getRoute(start, [TARGET.longitude, TARGET.latitude]);
    placeArrows(coords);
    trackArrival(TARGET.latitude, TARGET.longitude);
  } catch (err) {
    console.error('Error initializing AR:', err);
  }
};
