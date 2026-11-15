const RANGES = {
  T2M: [-10, 35],
  PRECTOTCORR: [0, 1500],
  RH2M: [15, 90],
  WS2M: [0, 8],
  ALLSKY_SFC_SW_DWN: [2, 7],
};

export function intensity(value, variable) {
  const range = RANGES[variable] || [0, 1];
  const span = range[1] - range[0] || 1;
  return Math.min(1, Math.max(0, (Number(value) - range[0]) / span));
}

function mix(from, to, t) {
  const hex = (color) => [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];
  const a = hex(from);
  const b = hex(to);
  const channel = (index) => Math.round(a[index] + (b[index] - a[index]) * t);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

export function colorFor(variable, t) {
  if (variable === "ALLSKY_SFC_SW_DWN") {
    return t < 0.5 ? mix("#fff3bf", "#f4a261", t * 2) : mix("#f4a261", "#9b2226", (t - 0.5) * 2);
  }
  if (variable === "PRECTOTCORR") return mix("#d6ebf5", "#0b4f78", t);
  if (variable === "RH2M") return mix("#eadcf5", "#5e2a86", t);
  if (variable === "WS2M") return mix("#e7eef6", "#1d4e89", t);
  return t < 0.5 ? mix("#2f6fad", "#f2c14e", t * 2) : mix("#f2c14e", "#b42318", (t - 0.5) * 2);
}

export function fillOpacity(variable) {
  if (variable === "PRECTOTCORR" || variable === "RH2M") return 0.38;
  if (variable === "WS2M") return 0.2;
  return 0.7;
}

export function symbolCount(variable, value) {
  const t = intensity(value, variable);
  if (variable === "WS2M") return Math.round(100 + t * 900);
  if (variable === "PRECTOTCORR" || variable === "RH2M") return Math.round(16 + t * 90);
  return 0;
}

export function legendFor(variable) {
  if (variable === "PRECTOTCORR") {
    return { low: "#7eb6d6", high: "#0b4f78", lowLabel: "Less rain", highLabel: "More rain" };
  }
  if (variable === "RH2M") {
    return { low: "#d7b8ea", high: "#5e2a86", lowLabel: "Drier", highLabel: "More humid" };
  }
  if (variable === "WS2M") {
    return { low: "#b9cbe0", high: "#1d4e89", lowLabel: "Slower", highLabel: "Faster" };
  }
  if (variable === "ALLSKY_SFC_SW_DWN") {
    return { low: "#fff3bf", high: "#9b2226", lowLabel: "Dimmer", highLabel: "Stronger sun" };
  }
  return { low: "#2f6fad", high: "#b42318", lowLabel: "Cooler", highLabel: "Hotter" };
}
