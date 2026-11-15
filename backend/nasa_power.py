# Download monthly/annual data from NASA POWER, with a saved copy as backup.
# POWER's feed includes month "13", which is the value for the whole year.
# We use that annual number so the seasonal cycle does not hide the long-term line.

import calendar
import json
from pathlib import Path

import requests

DATA_DIR = Path(__file__).resolve().parent / "data"
POWER_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"


def _cache_path(variable, lat, lon, start, end):
    lat_text = f"{lat:.2f}".replace("-", "m")
    lon_text = f"{lon:.2f}".replace("-", "m")
    return DATA_DIR / f"{variable}_{lat_text}_{lon_text}_{start}_{end}.json"


def _is_fill(value, fill):
    try:
        return abs(float(value) - float(fill)) < 1e-6
    except (TypeError, ValueError):
        return True


def fetch_raw(variable, lat, lon, start, end):
    params = {
        "parameters": variable,
        "community": "RE",
        "longitude": f"{lon:.2f}",
        "latitude": f"{lat:.2f}",
        "start": int(start),
        "end": int(end),
        "format": "JSON",
    }
    headers = {"User-Agent": "Meridian-SpaceApps/1.0 (educational project)"}
    response = requests.get(POWER_URL, params=params, headers=headers, timeout=45)
    response.raise_for_status()
    payload = response.json()
    if "properties" not in payload or variable not in payload["properties"].get("parameter", {}):
        message = "NASA POWER did not return this variable."
        if payload.get("messages"):
            message = str(payload["messages"])
        raise RuntimeError(message)
    return payload


def get_raw(variable, lat, lon, start, end):
    """Return (payload, from_cache). Live data is saved for the next time."""
    path = _cache_path(variable, lat, lon, start, end)
    try:
        payload = fetch_raw(variable, lat, lon, start, end)
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload), encoding="utf-8")
        return payload, False
    except Exception as exc:
        if path.exists():
            print(f"NASA POWER failed ({exc}). Using saved file {path.name}.")
            return json.loads(path.read_text(encoding="utf-8")), True
        raise RuntimeError(
            "Could not reach NASA POWER, and there is no saved copy for this place. "
            "Check the connection, or try one of the demonstration buttons."
        ) from exc


def yearly_series(payload, variable, kind):
    """Pull the annual value (month 13) out of a POWER response."""
    series = payload["properties"]["parameter"][variable]
    fill = payload.get("header", {}).get("fill_value", -999)
    rows = []

    for key, value in series.items():
        if len(str(key)) != 6:
            continue
        year = int(str(key)[:4])
        month = int(str(key)[4:])
        if month != 13 or _is_fill(value, fill):
            continue

        number = float(value)
        if kind == "rain":
            # Annual rain from POWER is an average mm/day.
            # Turn it into a yearly total so the chart reads in millimeters.
            days = 366 if calendar.isleap(year) else 365
            number = number * days

        rows.append({"year": year, "value": number})

    rows.sort(key=lambda row: row["year"])
    return rows
