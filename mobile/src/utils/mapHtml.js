// Shared route data is serialized into a fixed Leaflet document; no API key needed.
export function createMapHtml(halts, waypoints, region) {
  const data = JSON.stringify({ halts, waypoints, region }).replace(/</g, '\\u003c');
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;width:100%;margin:0}body{font-family:system-ui;background:#e8ecf2}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="window.ReactNativeWebView.postMessage('error')"></script>
<script>
try {
  const data = ${data};
  const point = p => [p.latitude,p.longitude];
  const map = L.map('map').setView(point(data.region),12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19, attribution:'&copy; OpenStreetMap contributors'
  }).addTo(map);
  L.polyline(data.waypoints.map(point),{color:'#1E6BFF',weight:5}).addTo(map);
  const markers = {};
  data.halts.forEach(h => {
    markers[h.id] = L.circleMarker(point(h),{radius:7,color:'#fff',weight:2,fillColor:'#34C759',fillOpacity:1})
      .addTo(map).bindTooltip(h.name);
  });
  let bus;
  window.updateTransit = value => {
    Object.keys(markers).forEach(id => markers[id].setStyle({
      fillColor:id===value.nextHaltId?'#FF9500':'#34C759',
      radius:id===value.nextHaltId?10:7
    }));
    const p=value.position;
    if(p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)){
      if(!bus) bus=L.circleMarker(point(p),{radius:12,color:'#fff',weight:3,fillColor:'#E5322D',fillOpacity:1})
        .addTo(map).bindTooltip('BUS-01',{permanent:true,direction:'top'});
      else bus.setLatLng(point(p));
      map.panTo(point(p));
    } else if(bus) {map.removeLayer(bus);bus=null;}
  };
  window.addEventListener('resize',()=>map.invalidateSize());
  window.ReactNativeWebView.postMessage('ready');
} catch(error) { window.ReactNativeWebView.postMessage('error'); }
</script></body></html>`;
}

