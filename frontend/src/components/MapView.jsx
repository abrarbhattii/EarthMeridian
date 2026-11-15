import { useEffect } from "react";
import { CircleMarker, GeoJSON, MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import FieldLayer from "./FieldLayer";
import { featureBounds, toCollection } from "../lib/geo";
import { colorFor, fillOpacity, intensity, legendFor } from "../lib/intensity";
import "./MapView.css";

const LIGHT_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
const DARK_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";

function paintFor(value, variable) {
  return colorFor(variable, intensity(value, variable));
}

function Fit({ items }) {
  const map = useMap();
  const key = items.map((item) => item.id).join("|");

  if (!map.getPane("context")) {
    const pane = map.createPane("context");
    pane.style.zIndex = "350";
    pane.style.pointerEvents = "none";
  }

  useEffect(() => {
    if (!items.length) return undefined;
    try {
      const box = featureBounds(items);
      if (!box) map.setView([items[0].lat, items[0].lon], 4, { animate: false });
      else map.fitBounds(box, { padding: [28, 28], maxZoom: 7, animate: false });
    } catch (err) {
      // The map can unmount while Leaflet is still moving.
    }
    return () => {
      try {
        map.stop();
      } catch (err) {
        // Already removed.
      }
    };
  }, [key, map]);

  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function MapView({
  theme,
  level,
  countries,
  areas,
  cities,
  selected,
  readings,
  summary,
  onPick,
}) {
  const dark = theme === "dark";
  const selectedIds = new Set(selected.map((item) => item.id));
  const focus = selected.length ? selected : level === "province" || level === "district" ? areas : [];
  const layerKey = `${level}-${areas.length}-${selected.map((item) => item.id).join(",")}-${Object.keys(readings).length}`;
  const shown = selected.map((item) => readings[item.name]).find((reading) => reading && reading.variable);
  const legend = legendFor(shown ? shown.variable : "T2M");

  function styleFeature(feature) {
    const id = feature.properties.id;
    const name = feature.properties.name;
    const on = selectedIds.has(id);
    const reading = readings[name];
    const colored = on && reading && reading.value != null;
    return {
      color: dark ? "#f3f3f3" : "#1a1a1a",
      weight: on ? 2.2 : 0.7,
      fillColor: colored ? paintFor(reading.value, reading.variable) : "#b04b5c",
      fillOpacity: colored ? fillOpacity(reading.variable) : on ? 0.35 : 0.05,
    };
  }

  function bindFeature(feature, layer) {
    const name = feature.properties.name;
    const reading = readings[name];
    const valueText = reading && reading.value != null ? `${reading.value} ${reading.unit}` : "Click, then Run";
    layer.bindTooltip(`${name} · ${valueText}`, { sticky: true });
    layer.on("click", () => {
      const item = areas.find((entry) => entry.id === feature.properties.id);
      if (item) onPick(item);
    });
  }

  return (
    <div className="map-pane">
      <MapContainer center={[30.4, 69.4]} zoom={5} className="map-canvas" scrollWheelZoom zoomControl={false}>
        <ZoomControl position="topright" />
        <TileLayer key={theme} attribution="Tiles &copy; Esri" url={dark ? DARK_TILES : LIGHT_TILES} />
        <Fit items={focus} />
        {level !== "country" && countries.length > 0 && (
          <GeoJSON
            pane="context"
            data={toCollection(countries)}
            style={{ color: dark ? "#888" : "#9a9a9a", weight: 0.6, fillOpacity: 0 }}
          />
        )}
        {level !== "city" && areas.length > 0 && (
          <GeoJSON key={layerKey} data={toCollection(areas)} style={styleFeature} onEachFeature={bindFeature} />
        )}
        {level === "city" &&
          cities.map((city) => {
            const on = selectedIds.has(city.id);
            const reading = readings[city.name];
            return (
              <CircleMarker
                key={city.id}
                center={[city.lat, city.lon]}
                radius={on ? 9 : 5}
                pathOptions={{
                  color: dark ? "#f3f3f3" : "#1a1a1a",
                  weight: 1,
                  fillColor: reading && reading.value != null ? paintFor(reading.value, reading.variable) : "#b04b5c",
                  fillOpacity: reading && reading.value != null ? fillOpacity(reading.variable) : on ? 0.9 : 0.45,
                }}
                eventHandlers={{ click: () => onPick(city) }}
              >
              </CircleMarker>
            );
          })}
        <FieldLayer areas={selected} readings={readings} />
      </MapContainer>
      <div className="legend">
        <i className="swatch" style={{ background: legend.low }} />
        <span>{legend.lowLabel}</span>
        <i className="swatch" style={{ background: legend.high }} />
        <span>{legend.highLabel}</span>
      </div>
      {summary && <p className="map-summary">{summary}</p>}
    </div>
  );
}
