# EarthMeridian

What is changing, where, and is it significant?

EarthMeridian is the NASA Space Apps Challenge 2026 project of **SCD Gladiators** (Muhammad Abrar and Raja Muhammad Usama), Faisalabad. The challenge is **Be An Earth System Trend Detective!**

Pick a measurement, an area, and a span of years. The app loads NASA POWER, keeps one value per year, draws the time series, and tests whether the trend is statistically significant.

Measurements: air temperature (`T2M`), rainfall (`PRECTOTCORR`), humidity (`RH2M`), wind speed (`WS2M`), and sunlight (`ALLSKY_SFC_SW_DWN`). Source: [NASA POWER](https://power.larc.nasa.gov/), largely MERRA-2. Saved copies of demonstration requests are in `backend/data/`.

**API**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn main:app --app-dir backend --reload --port 8000
```

**Website**

```powershell
cd frontend
npm install
npm run dev
```

## Team

SCD Gladiators — Muhammad Abrar and Raja Muhammad Usama. NASA Space Apps Challenge 2026, Faisalabad.
