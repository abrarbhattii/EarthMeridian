function walkCoords(coords, visit) {
  if (typeof coords[0] === "number") {
    visit(coords[0], coords[1]);
    return;
  }
  coords.forEach((part) => walkCoords(part, visit));
}

export function centroid(geometry) {
  const ring = largestRing(geometry);
  if (!ring.length) return [0, 0];
  let lon = 0;
  let lat = 0;
  ring.forEach((pair) => {
    lon += pair[0];
    lat += pair[1];
  });
  return [lon / ring.length, lat / ring.length];
}

function largestRing(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates[0] || [];
  if (geometry.type === "MultiPolygon") {
    let best = [];
    geometry.coordinates.forEach((polygon) => {
      const ring = polygon[0] || [];
      if (ring.length > best.length) best = ring;
    });
    return best;
  }
  return [];
}

export function featureBounds(items) {
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  let count = 0;
  items.forEach((item) => {
    if (!item.geometry) {
      minLat = Math.min(minLat, item.lat);
      maxLat = Math.max(maxLat, item.lat);
      minLon = Math.min(minLon, item.lon);
      maxLon = Math.max(maxLon, item.lon);
      count += 1;
      return;
    }
    walkCoords(item.geometry.coordinates, (lon, lat) => {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      count += 1;
    });
  });
  if (!count) return null;
  if (maxLon - minLon > 180) return null;
  return [
    [minLat, minLon],
    [maxLat, maxLon],
  ];
}

export function toCollection(items) {
  return {
    type: "FeatureCollection",
    features: items
      .filter((item) => item.geometry)
      .map((item) => ({
        type: "Feature",
        properties: { id: item.id, name: item.name },
        geometry: item.geometry,
      })),
  };
}
