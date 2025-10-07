navigator.geolocation.getCurrentPosition(pos => {
  const lat = pos.coords.latitude + 0.00005; // slightly north
  const lon = pos.coords.longitude;
  placeTestArrow(lat, lon);
});

function placeTestArrow(lat, lon) {
  const scene = document.querySelector('a-scene');
  const modelPath = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'assets/arrow.usdz' : 'assets/arrow.glb';
  const arrow = document.createElement('a-entity');
  arrow.setAttribute('gps-entity-place', `latitude: ${lat}; longitude: ${lon}`);
  arrow.setAttribute('gltf-model', `url(${modelPath})`);
  arrow.setAttribute('scale', '2 2 2');
  arrow.setAttribute('rotation', '0 0 0');
  arrow.setAttribute('crossorigin', 'anonymous');
  scene.appendChild(arrow);
}
