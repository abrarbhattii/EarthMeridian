import { centroid } from "./geo";

let countriesCache = null;
const adminCache = new Map();

function countryFromFeature(feature) {
  const props = feature.properties || {};
  const [lon, lat] = centroid(feature.geometry);
  return {
    id: props.id,
    name: props.name,
    iso: props.iso || "",
    lat,
    lon,
    geometry: feature.geometry,
  };
}

export function loadCountries() {
  if (!countriesCache) {
    countriesCache = fetch("/geo/countries.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("Country boundaries did not load.");
        return response.json();
      })
      .then((data) => data.features.map(countryFromFeature));
  }
  return countriesCache;
}

function adminFromFeature(feature) {
  const props = feature.properties || {};
  const name = props.shapeName || props.name || "Area";
  const id = props.shapeID || name;
  const [lon, lat] = centroid(feature.geometry);
  return { id, name, lat, lon, geometry: feature.geometry };
}

function browserFile(url) {
  return String(url)
    .replace(
      /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/([^/]+)\//,
      "https://media.githubusercontent.com/media/$1/$2/$3/"
    )
    .replace(
      /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\//,
      "https://media.githubusercontent.com/media/$1/$2/$3/"
    );
}

export function loadAdmin(iso, level) {
  const adm = level === "province" ? "ADM1" : "ADM2";
  const key = `${iso}-${adm}`;
  if (!adminCache.has(key)) {
    const job = fetch(`https://www.geoboundaries.org/api/current/gbOpen/${iso}/${adm}/`)
      .then((response) => {
        if (!response.ok) throw new Error("This country has no open file at that level.");
        return response.json();
      })
      .then((meta) => {
        const url = browserFile(meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL || "");
        if (!url) throw new Error("This country has no open file at that level.");
        return fetch(url);
      })
      .then((response) => {
        if (!response.ok) throw new Error("The boundary file did not download.");
        return response.json();
      })
      .then((geo) => (geo.features || []).map(adminFromFeature));
    adminCache.set(key, job);
    job.catch(() => {
      if (adminCache.get(key) === job) adminCache.delete(key);
    });
  }
  return adminCache.get(key);
}
