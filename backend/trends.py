# Straight-line trend, confidence interval, and Mann-Kendall test.
# A trend is called significant only when both tests land under p = 0.05.

import math

import numpy as np
import pandas as pd
from scipy import stats

ALPHA = 0.05


def format_number(value):
    size = abs(value)
    if size == 0:
        return "0"
    if size >= 100:
        return f"{value:.1f}"
    if size >= 10:
        return f"{value:.2f}"
    if size >= 1:
        return f"{value:.2f}"
    if size >= 0.01:
        return f"{value:.3f}"
    return f"{value:.4f}"


def format_p(p_value):
    if p_value < 0.001:
        return "< 0.001"
    return f"{p_value:.3f}"


def mann_kendall(values):
    """Rank test for a steady rise or fall.

    Compare every later year with every earlier year.
    S goes up when the later year is higher, and down when it is lower.
    A large positive S means a rising series.
    """
    values = [float(item) for item in values]
    n = len(values)
    s = 0
    for i in range(n - 1):
        for j in range(i + 1, n):
            diff = values[j] - values[i]
            if diff > 0:
                s += 1
            elif diff < 0:
                s -= 1

    # Tied values carry less information, so they reduce the variance.
    counts = {}
    for item in values:
        counts[item] = counts.get(item, 0) + 1
    tie_term = 0
    for count in counts.values():
        if count > 1:
            tie_term += count * (count - 1) * (2 * count + 5)

    var_s = (n * (n - 1) * (2 * n + 5) - tie_term) / 18.0
    if var_s <= 0 or s == 0:
        return {"s": s, "z": 0.0, "p": 1.0}

    # Continuity correction: step 1 unit toward zero before dividing.
    if s > 0:
        z = (s - 1) / math.sqrt(var_s)
    else:
        z = (s + 1) / math.sqrt(var_s)

    # Two-sided p-value from the normal curve.
    p_value = math.erfc(abs(z) / math.sqrt(2.0))
    return {"s": s, "z": float(z), "p": float(p_value)}


def _direction(slope):
    if slope > 0:
        return "rising"
    if slope < 0:
        return "falling"
    return "flat"


def _verdict(info, place, first_year, last_year, slope, change, status):
    name = info["name"]
    rate = f"{format_number(abs(slope))} {info['rate_unit']}"
    total = f"{format_number(abs(change))} {info['unit']}"
    span = f"from {first_year} to {last_year}"

    if _direction(slope) == "flat":
        opening = f"{name} in {place} shows no linear change {span}."
    elif status == "significant":
        verb = "rose" if slope > 0 else "fell"
        opening = (
            f"{name} in {place} {verb} by about {rate} {span} "
            f"(about {total} over the full period)."
        )
    else:
        noun = "rise" if slope > 0 else "fall"
        opening = (
            f"{name} in {place} shows a {noun} of about {rate} {span} "
            f"(about {total} over the full period)."
        )

    if status == "significant":
        ending = "This trend is statistically significant."
    elif status == "weak":
        ending = (
            "The straight-line test and the Mann-Kendall test do not agree, "
            "so treat this as a weak signal."
        )
    else:
        ending = (
            "This trend is not statistically significant. "
            "A longer record can turn a real change into a significant one."
        )
    return f"{opening} {ending}"


def analyze(series, info, place):
    table = pd.DataFrame(series)
    table = table.replace([np.inf, -np.inf], np.nan).dropna()
    table = table.drop_duplicates(subset="year").sort_values("year")
    if len(table) < 10:
        raise ValueError(
            "Fewer than 10 years came back. Pick a longer period and try again."
        )

    xs = np.array(table["year"], dtype=float)
    ys = np.array(table["value"], dtype=float)
    slope, intercept, r_value, p_value, stderr = stats.linregress(xs, ys)

    # t critical value, not 1.96, because a few dozen years is a small sample.
    degrees = len(xs) - 2
    t_critical = stats.t.ppf(1 - ALPHA / 2, degrees)
    if stderr is None or math.isnan(stderr):
        stderr = 0.0
    half_width = float(t_critical) * float(stderr)

    slope = float(slope)
    intercept = float(intercept)
    if math.isnan(p_value):
        p_value = 1.0
    p_value = float(p_value)
    if math.isnan(r_value):
        r_value = 0.0
    ci_low = slope - half_width
    ci_high = slope + half_width

    mk = mann_kendall(ys)
    line_significant = p_value < ALPHA
    mk_significant = mk["p"] < ALPHA
    if line_significant and mk_significant:
        status = "significant"
    elif line_significant or mk_significant:
        status = "weak"
    else:
        status = "not_significant"

    first_year = int(xs[0])
    last_year = int(xs[-1])
    change = slope * (last_year - first_year)
    direction = _direction(slope)
    rate_text = f"{format_number(slope)} {info['rate_unit']}"

    trend_line = []
    points = []
    for year, value in zip(xs, ys):
        year = int(year)
        points.append({"year": year, "value": round(float(value), 2)})
        fitted = intercept + slope * year
        trend_line.append({"year": year, "value": round(fitted, 2)})

    return {
        "slope_per_year": slope,
        "change_over_period": change,
        "p_value": p_value,
        "p_value_text": format_p(p_value),
        "ci_low": ci_low,
        "ci_high": ci_high,
        "ci_text": (
            f"{format_number(ci_low)} to {format_number(ci_high)} {info['rate_unit']}"
        ),
        "r_squared": float(r_value ** 2),
        "r_squared_text": f"{r_value ** 2:.2f}",
        "mann_kendall_s": int(mk["s"]),
        "mann_kendall_z": round(float(mk["z"]), 2),
        "mann_kendall_p": float(mk["p"]),
        "mann_kendall_p_text": format_p(mk["p"]),
        "direction": direction,
        "status": status,
        "rate_text": rate_text,
        "change_text": f"{format_number(change)} {info['unit']}",
        "verdict": _verdict(info, place, first_year, last_year, slope, change, status),
        "trend_line": trend_line,
        "series": points,
        "n_years": len(points),
        "first_year": first_year,
        "last_year": last_year,
    }


def _status_phrase(result):
    status = result["trend"]["status"]
    place = result["place"]
    if status == "significant":
        return f"The {place} trend is significant."
    if status == "weak":
        return f"The {place} trend is only a weak signal."
    return f"The {place} trend is not significant."


def compare_sentence(left, right):
    name = left["variable_name"]
    left_dir = left["trend"]["direction"]
    right_dir = right["trend"]["direction"]

    if left_dir == "flat" and right_dir == "flat":
        opening = f"{name} shows no real slope in either place."
    elif left_dir == "flat" or right_dir == "flat":
        moving = left if left_dir != "flat" else right
        still = right if moving is left else left
        opening = (
            f"{name} is {moving['trend']['direction']} in {moving['place']} "
            f"and nearly flat in {still['place']}."
        )
    elif left_dir != right_dir:
        opening = (
            f"{name} is {left_dir} in {left['place']} and {right_dir} in {right['place']}. "
            "Same measurement, different direction."
        )
    else:
        left_rate = abs(left["trend"]["slope_per_year"])
        right_rate = abs(right["trend"]["slope_per_year"])
        faster = left if left_rate >= right_rate else right
        slower = right if faster is left else left
        opening = (
            f"{name} is {left_dir} in both places. "
            f"{faster['place']} is changing faster ({faster['trend']['rate_text']}) "
            f"than {slower['place']} ({slower['trend']['rate_text']})."
        )

    return f"{opening} {_status_phrase(left)} {_status_phrase(right)}"


if __name__ == "__main__":
    # A rising line should be an obvious significant trend.
    rising = [{"year": 2000 + i, "value": float(i)} for i in range(1, 21)]
    info = {
        "name": "Test series",
        "unit": "units",
        "rate_unit": "units per year",
    }
    result = analyze(rising, info, "Testville")
    assert result["status"] == "significant", result
    assert abs(result["slope_per_year"] - 1) < 1e-9

    flat = [{"year": 2000 + i, "value": 5.0} for i in range(1, 21)]
    flat_result = analyze(flat, info, "Testville")
    assert flat_result["status"] == "not_significant"

    print(result["verdict"])
    print("self-check ok")
