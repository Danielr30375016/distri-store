// Información del negocio. Editá estos datos con los tuyos reales.
export const site = {
  name: 'DistriStore',

  // Contacto
  phoneDisplay: '+57 312 4488144',
  phoneWhatsapp: '573124488144', // solo números, con código de país (57 = Colombia)
  email: 'contacto@distristore.com',

  // Dirección / sede
  address: 'Cll 17 # 103A - 33',
  city: 'Bogotá, Colombia',
  hours: 'Lun a Sáb: 8:00 a.m. – 6:00 p.m.',

  // Coordenadas de la sede (para el mapa de OpenStreetMap)
  // Reemplazá lat/lng por las de tu local. Podés obtenerlas en https://www.openstreetmap.org
  map: {
    lat: 4.6787,
    lng: -74.1412,
    zoom: 17,
  },
}

// Genera el src del iframe de OpenStreetMap centrado en la sede
export function osmEmbedUrl({ lat, lng }: { lat: number; lng: number }): string {
  const d = 0.005
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function osmLink({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`
}
