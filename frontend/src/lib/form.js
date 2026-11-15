export const STATUS_TEXT = {
  significant: "Significant",
  not_significant: "Not significant",
  weak: "Weak signal",
};

export function formatCoord(lat, lon) {
  const ns = Number(lat) >= 0 ? "N" : "S";
  const ew = Number(lon) >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`;
}

export function placeById(catalog, id) {
  if (!catalog) return null;
  return catalog.places.find((place) => place.id === id) || null;
}

export function formFromDemo(demo, catalog) {
  const first = placeById(catalog, demo.place_id);
  const second = placeById(catalog, demo.place_id_2) || catalog.places[1];
  return {
    mode: demo.mode,
    variable: demo.variable,
    placeId: first.id,
    placeName: first.name,
    lat: String(first.lat),
    lon: String(first.lon),
    placeId2: second.id,
    placeName2: second.name,
    lat2: String(second.lat),
    lon2: String(second.lon),
    start: String(demo.start),
    end: String(demo.end),
  };
}

export function pointsFromForm(form) {
  if (!form) return [];
  const first = {
    id: "a",
    name: form.placeName || "First place",
    lat: Number(form.lat),
    lon: Number(form.lon),
  };
  const points = [first];
  if (form.mode === "compare") {
    points.push({
      id: "b",
      name: form.placeName2 || "Second place",
      lat: Number(form.lat2),
      lon: Number(form.lon2),
    });
  }
  return points.filter((point) => !Number.isNaN(point.lat) && !Number.isNaN(point.lon));
}

export function checkForm(form) {
  const lat = Number(form.lat);
  const lon = Number(form.lon);
  const start = Number(form.start);
  const end = Number(form.end);
  if ([lat, lon, start, end].some((value) => Number.isNaN(value))) {
    return "Enter the coordinates and years as numbers.";
  }
  if (form.mode === "compare") {
    const lat2 = Number(form.lat2);
    const lon2 = Number(form.lon2);
    if (Number.isNaN(lat2) || Number.isNaN(lon2)) {
      return "Enter both places as decimal degrees.";
    }
    if (lat === lat2 && lon === lon2) {
      return "Pick two different places to compare.";
    }
  }
  return "";
}
