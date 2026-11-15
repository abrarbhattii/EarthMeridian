# Meridian API: catalog, one-place investigation, and a two-place comparison.

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from catalog import DEMOS, MAX_YEAR, MIN_YEAR, MIN_YEARS, PLACES, VARIABLES, VARIABLES_BY_ID
from nasa_power import get_raw, yearly_series
from trends import analyze, compare_sentence

app = FastAPI(
    title="Meridian",
    description="Earth trend detective for the NASA Space Apps Challenge.",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"


def clean_name(name, fallback):
    text = " ".join(str(name or "").split())
    if not text:
        return fallback
    return text[:80]


def check_request(variable, lat, lon, start, end):
    if variable not in VARIABLES_BY_ID:
        raise ValueError("Choose a variable from the list.")
    if lat < -90 or lat > 90 or lon < -180 or lon > 180:
        raise ValueError("Latitude must be between -90 and 90, and longitude between -180 and 180.")
    if start < MIN_YEAR or end > MAX_YEAR or end < start:
        raise ValueError(f"Use years between {MIN_YEAR} and {MAX_YEAR}.")
    if (end - start + 1) < MIN_YEARS:
        raise ValueError(f"Pick at least {MIN_YEARS} years so the test has enough points.")


def run_investigation(variable, lat, lon, start, end, place):
    lat = round(float(lat), 2)
    lon = round(float(lon), 2)
    start = int(start)
    end = int(end)
    check_request(variable, lat, lon, start, end)

    info = VARIABLES_BY_ID[variable]
    place = clean_name(place, "Selected place")
    payload, from_cache = get_raw(variable, lat, lon, start, end)
    series = yearly_series(payload, variable, info["kind"])
    if len(series) < MIN_YEARS:
        raise ValueError(
            "NASA POWER did not return enough years for this point. Try another place or a longer period."
        )

    trend = analyze(series, info, place)
    sources = payload.get("header", {}).get("sources", [])
    wind_direction = None
    if variable == "WS2M":
        # Speed has no arrow by itself. Direction is a second NASA field.
        try:
            wind_payload, _ = get_raw("WD2M", lat, lon, start, end)
            wind_series = yearly_series(wind_payload, "WD2M", "mean")
            if wind_series:
                wind_direction = wind_series[-1]["value"]
        except Exception:
            wind_direction = None
    return {
        "place": place,
        "latitude": lat,
        "longitude": lon,
        "variable": variable,
        "variable_name": info["name"],
        "unit": info["unit"],
        "rate_unit": info["rate_unit"],
        "value_label": info["value_label"],
        "definition": info["definition"],
        "start": start,
        "end": end,
        "sources": sources,
        "from_cache": from_cache,
        "series": trend.pop("series"),
        "trend": trend,
        "wind_direction": wind_direction,
    }


def _http_error(exc):
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=502, detail=str(exc))


@app.get("/api/health")
def health():
    return {"ok": True, "name": "Meridian"}


@app.get("/api/catalog")
def catalog():
    return {
        "variables": VARIABLES,
        "places": PLACES,
        "demos": DEMOS,
        "min_year": MIN_YEAR,
        "max_year": MAX_YEAR,
    }


@app.get("/api/investigate")
def investigate(variable: str, lat: float, lon: float, start: int = 2001, end: int = 2024, place: str = "Selected place"):
    try:
        return run_investigation(variable, lat, lon, start, end, place)
    except (ValueError, RuntimeError) as exc:
        raise _http_error(exc) from exc


@app.get("/api/compare")
def compare(
    variable: str,
    lat: float,
    lon: float,
    lat2: float,
    lon2: float,
    start: int = 2001,
    end: int = 2024,
    place: str = "First place",
    place2: str = "Second place",
):
    try:
        left = run_investigation(variable, lat, lon, start, end, place)
        right = run_investigation(variable, lat2, lon2, start, end, place2)
    except (ValueError, RuntimeError) as exc:
        raise _http_error(exc) from exc

    return {
        "summary": compare_sentence(left, right),
        "left": left,
        "right": right,
    }


@app.get("/")
def home():
    index = DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return {
        "name": "Meridian",
        "message": "API is running. For the full page, start the frontend with npm run dev.",
    }


@app.get("/{full_path:path}")
def frontend_files(full_path: str):
    if full_path == "api" or full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="No such API path.")
    if not DIST.exists():
        raise HTTPException(status_code=404, detail="Frontend is not built yet.")

    candidate = (DIST / full_path).resolve()
    if not str(candidate).startswith(str(DIST.resolve())):
        raise HTTPException(status_code=404, detail="Not found.")
    if candidate.is_file():
        return FileResponse(candidate)

    index = DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    raise HTTPException(status_code=404, detail="Not found.")
