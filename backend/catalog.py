# Places, variables, and the three stories we show first.
# Coordinates are the city center, rounded to 0.01 degree.
# NASA POWER then uses the grid cell around that point.

MIN_YEAR = 1981
MAX_YEAR = 2024
MIN_YEARS = 10

VARIABLES = [
    {
        "id": "T2M",
        "name": "Air temperature",
        "unit": "°C",
        "rate_unit": "°C per year",
        "kind": "mean",
        "value_label": "Yearly mean",
        "definition": (
            "Air temperature about 2 meters above the ground, in degrees Celsius. "
            "This is the usual everyday temperature. Each point is NASA's annual mean for that year."
        ),
    },
    {
        "id": "PRECTOTCORR",
        "name": "Rainfall",
        "unit": "mm",
        "rate_unit": "mm per year",
        "kind": "rain",
        "value_label": "Yearly total",
        "definition": (
            "Precipitation from NASA POWER, corrected by NASA. "
            "It arrives as millimeters per day. Meridian multiplies by the days in the year "
            "so the chart shows a yearly total in millimeters."
        ),
    },
    {
        "id": "RH2M",
        "name": "Humidity",
        "unit": "%",
        "rate_unit": "% per year",
        "kind": "mean",
        "value_label": "Yearly mean",
        "definition": (
            "Relative humidity about 2 meters above the ground. "
            "At 100% the air is holding as much water vapor as it can at that temperature. "
            "Each point is the yearly mean."
        ),
    },
    {
        "id": "WS2M",
        "name": "Wind speed",
        "unit": "m/s",
        "rate_unit": "m/s per year",
        "kind": "mean",
        "value_label": "Yearly mean",
        "definition": (
            "Wind speed about 2 meters above the ground, in meters per second. "
            "Each point is the yearly mean. This is slower than the wind reported higher up, "
            "where aircraft and some forecasts measure it."
        ),
    },
    {
        "id": "ALLSKY_SFC_SW_DWN",
        "name": "Sunlight",
        "unit": "kWh/m²/day",
        "rate_unit": "kWh/m²/day per year",
        "kind": "mean",
        "value_label": "Yearly mean",
        "definition": (
            "Sunlight that reaches the ground, clouds included. "
            "The unit is kilowatt-hours per square meter per day. "
            "Each point is the average for that year."
        ),
    },
]

VARIABLES_BY_ID = {item["id"]: item for item in VARIABLES}

PLACES = [
    {
        "id": "faisalabad",
        "name": "Faisalabad",
        "region": "Pakistan",
        "lat": 31.42,
        "lon": 73.09,
        "blurb": "Inland city on the Punjab plain. This is our local event.",
    },
    {
        "id": "lahore",
        "name": "Lahore",
        "region": "Pakistan",
        "lat": 31.55,
        "lon": 74.34,
        "blurb": "A large city east of Faisalabad.",
    },
    {
        "id": "karachi",
        "name": "Karachi",
        "region": "Pakistan",
        "lat": 24.86,
        "lon": 67.01,
        "blurb": "Coastal city on the Arabian Sea.",
    },
    {
        "id": "gilgit",
        "name": "Gilgit",
        "region": "Pakistan",
        "lat": 35.92,
        "lon": 74.31,
        "blurb": "Mountain city in the far north.",
    },
    {
        "id": "manaus",
        "name": "Manaus",
        "region": "Brazil",
        "lat": -3.12,
        "lon": -60.02,
        "blurb": "A city in the Amazon rainforest.",
    },
    {
        "id": "utqiagvik",
        "name": "Utqiagvik",
        "region": "Alaska, USA",
        "lat": 71.29,
        "lon": -156.79,
        "blurb": "An Arctic town, formerly called Barrow.",
    },
]

# place_id_2 is only used when mode is "compare".
# The header examples ask a question and let the tests answer it.
# Faisalabad and Lahore temperature in this record is a fall, not a rise.
DEMOS = [
    {
        "id": "faisalabad-heat",
        "label": "Is Faisalabad getting hotter?",
        "mode": "one",
        "variable": "T2M",
        "place_id": "faisalabad",
        "start": 2001,
        "end": 2024,
    },
    {
        "id": "opposite-directions",
        "label": "Faisalabad vs the Arctic",
        "mode": "compare",
        "variable": "T2M",
        "place_id": "faisalabad",
        "place_id_2": "utqiagvik",
        "start": 2001,
        "end": 2024,
    },
    {
        "id": "faisalabad-rain",
        "label": "Is Faisalabad getting wetter?",
        "mode": "one",
        "variable": "PRECTOTCORR",
        "place_id": "faisalabad",
        "start": 2001,
        "end": 2024,
    },
    {
        "id": "lahore-heat",
        "label": "Is Lahore getting hotter?",
        "mode": "one",
        "variable": "T2M",
        "place_id": "lahore",
        "start": 2001,
        "end": 2024,
    },
    {
        "id": "inside-pakistan",
        "label": "Inside Pakistan",
        "mode": "compare",
        "variable": "T2M",
        "place_id": "lahore",
        "place_id_2": "karachi",
        "start": 2001,
        "end": 2024,
    },
]
