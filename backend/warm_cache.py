# Download the demonstration series and print the slopes.
# Run from the backend folder:  python warm_cache.py
# Saved JSON files let the demos open when NASA POWER is slow.

from catalog import PLACES, VARIABLES
from nasa_power import get_raw, yearly_series
from trends import analyze

# Every preset place gets temperature and rainfall.
# Faisalabad also gets the other variables, since that is the local story.
JOBS = []
seen = set()


def add_job(place, variable_id):
    key = (place["id"], variable_id)
    if key in seen:
        return
    seen.add(key)
    JOBS.append((place, variable_id))


for place in PLACES:
    add_job(place, "T2M")
    add_job(place, "PRECTOTCORR")

faisalabad = PLACES[0]
for variable in VARIABLES:
    add_job(faisalabad, variable["id"])


def main():
    info_by_id = {item["id"]: item for item in VARIABLES}
    for place, variable_id in JOBS:
        info = info_by_id[variable_id]
        label = f"{place['name']:12} {info['name']:18}"
        try:
            payload, from_cache = get_raw(variable_id, place["lat"], place["lon"], 2001, 2024)
            series = yearly_series(payload, variable_id, info["kind"])
            trend = analyze(series, info, place["name"])
        except Exception as exc:
            print(f"{label} FAILED  {exc}")
            continue
        source = "cache" if from_cache else "live"
        print(
            f"{label} {trend['rate_text']:>28}  "
            f"p={trend['p_value_text']:>7}  mk={trend['mann_kendall_p_text']:>7}  "
            f"{trend['status']:16} {source}"
        )


if __name__ == "__main__":
    main()
