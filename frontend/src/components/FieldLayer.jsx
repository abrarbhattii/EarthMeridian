import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { intensity, symbolCount } from "../lib/intensity";

function ringContains(ring, lon, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const crosses = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function contains(item, lon, lat) {
  if (!item.geometry) {
    const dLat = lat - item.lat;
    const dLon = (lon - item.lon) * Math.cos((item.lat * Math.PI) / 180);
    return dLat * dLat + dLon * dLon <= 0.12;
  }
  const geometry = item.geometry;
  if (geometry.type === "Polygon") return ringContains(geometry.coordinates[0] || [], lon, lat);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => ringContains(polygon[0] || [], lon, lat));
  }
  return false;
}

function boundsOf(item) {
  if (!item.geometry) {
    return { minLon: item.lon - 0.35, maxLon: item.lon + 0.35, minLat: item.lat - 0.35, maxLat: item.lat + 0.35 };
  }
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;
  const visit = (lon, lat) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  };
  const geometry = item.geometry;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates || [];
  polygons.forEach((polygon) => {
    (polygon[0] || []).forEach((pair) => visit(pair[0], pair[1]));
  });
  return { minLon, maxLon, minLat, maxLat };
}

function randomInside(item) {
  const box = boundsOf(item);
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const lon = box.minLon + Math.random() * (box.maxLon - box.minLon || 0.2);
    const lat = box.minLat + Math.random() * (box.maxLat - box.minLat || 0.2);
    if (contains(item, lon, lat)) return { lon, lat };
  }
  return { lon: item.lon, lat: item.lat };
}

function buildParticles(areas, readings) {
  const particles = [];
  areas.forEach((item) => {
    const reading = readings[item.name];
    if (!reading || reading.value == null) return;
    const kind =
      reading.variable === "WS2M" ? "wind" : reading.variable === "PRECTOTCORR" ? "rain" : reading.variable === "RH2M" ? "humidity" : "";
    if (!kind) return;
    const total = symbolCount(reading.variable, reading.value);
    const level = intensity(reading.value, reading.variable);
    const pool = [];
    const poolSize = Math.min(total, 80);
    const box = boundsOf(item);
    for (let index = 0; index < poolSize; index += 1) pool.push(randomInside(item));
    for (let index = 0; index < total; index += 1) {
      const point = pool[index % pool.length];
      particles.push({
        lon: point.lon + (Math.random() - 0.5) * 0.08,
        lat: point.lat + (Math.random() - 0.5) * 0.08,
        item,
        box,
        kind,
        level,
        direction: reading.direction,
        phase: Math.random() * Math.PI * 2,
        tick: index,
      });
    }
  });
  return particles;
}

function drawDrop(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.quadraticCurveTo(4, 0, 0, 5);
  ctx.quadraticCurveTo(-4, 0, 0, -5);
  ctx.fill();
  ctx.restore();
}

function drawArrow(ctx, x, y, motionDegrees, level) {
  const length = 8 + level * 8;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((motionDegrees * Math.PI) / 180);
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, length * 0.45);
  ctx.lineTo(0, -length * 0.55);
  ctx.moveTo(0, -length * 0.55);
  ctx.lineTo(-3.5, -length * 0.15);
  ctx.moveTo(0, -length * 0.55);
  ctx.lineTo(3.5, -length * 0.15);
  ctx.stroke();
  ctx.strokeStyle = "#0b5cab";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

export default function FieldLayer({ areas, readings }) {
  const map = useMap();
  const areasRef = useRef(areas);
  const readingsRef = useRef(readings);
  areasRef.current = areas;
  readingsRef.current = readings;
  const stamp = areas
    .map((item) => {
      const reading = readings[item.name];
      return reading ? `${item.id}:${reading.variable}:${reading.value}:${reading.direction}` : item.id;
    })
    .join("|");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.className = "field-canvas";
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.zIndex = "450";
    canvas.style.pointerEvents = "none";
    map.getContainer().appendChild(canvas);

    let particles = buildParticles(areasRef.current, readingsRef.current);
    let frame = 0;
    let alive = true;

    function step(particle) {
      if (particle.kind === "wind") {
        const motion = ((Number(particle.direction) || 90) + 180) % 360;
        const radians = (motion * Math.PI) / 180;
        const distance = 0.0022 * (0.45 + particle.level);
        particle.lat += Math.cos(radians) * distance;
        particle.lon += (Math.sin(radians) * distance) / Math.max(0.25, Math.cos((particle.lat * Math.PI) / 180));
      } else {
        particle.lat -= 0.0032 * (0.45 + particle.level);
        particle.lon += Math.sin(particle.phase + particle.lat) * 0.0006;
      }
      particle.tick += 1;
      const box = particle.box;
      const outsideBox =
        particle.lon < box.minLon || particle.lon > box.maxLon || particle.lat < box.minLat || particle.lat > box.maxLat;
      if (outsideBox || (particle.tick % 12 === 0 && !contains(particle.item, particle.lon, particle.lat))) {
        const next = randomInside(particle.item);
        particle.lon = next.lon;
        particle.lat = next.lat;
      }
    }

    function paint() {
      if (!alive) return;
      const size = map.getSize();
      const ratio = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(size.x * ratio) || canvas.height !== Math.round(size.y * ratio)) {
        canvas.width = Math.round(size.x * ratio);
        canvas.height = Math.round(size.y * ratio);
        canvas.style.width = `${size.x}px`;
        canvas.style.height = `${size.y}px`;
      }
      const context = canvas.getContext("2d");
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, size.x, size.y);
      particles.forEach((particle) => {
        step(particle);
        const point = map.latLngToContainerPoint([particle.lat, particle.lon]);
        if (particle.kind === "wind") {
          const motion = ((Number(particle.direction) || 90) + 180) % 360;
          drawArrow(context, point.x, point.y, motion, particle.level);
        } else {
          drawDrop(context, point.x, point.y, particle.kind === "rain" ? "#1578a8" : "#7a3e9d");
        }
      });
      frame = requestAnimationFrame(paint);
    }

    paint();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      canvas.remove();
    };
  }, [map, stamp]);

  return null;
}
