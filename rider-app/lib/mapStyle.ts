/** Google Maps night style used when the resolved scheme is dark. */
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2536' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a3adbf' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#151b2a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c3650' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a4766' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0f1a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
export const lightMapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
