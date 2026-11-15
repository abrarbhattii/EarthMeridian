import { useEffect, useState } from "react";
import { CITIES } from "../data/cities";
import { loadAdmin, loadCountries } from "../lib/boundaries";

export function useAreas(mode) {
  const [level, setLevel] = useState("country");
  const [countryIso, setCountryIso] = useState("PAK");
  const [countries, setCountries] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let ignore = false;
    setLoadingMap(true);
    setMapError("");

    const job =
      level === "province" || level === "district"
        ? loadCountries().then(async (list) => {
            const admin = await loadAdmin(countryIso, level);
            return { list, active: admin };
          })
        : loadCountries().then((list) => ({ list, active: list }));

    job
      .then((result) => {
        if (ignore) return;
        setCountries(result.list);
        setAreas(level === "city" ? [] : result.active);
        setLoadingMap(false);
      })
      .catch((err) => {
        if (ignore) return;
        setAreas([]);
        setMapError(err.message || "Boundaries did not load.");
        setLoadingMap(false);
      });

    return () => {
      ignore = true;
    };
  }, [level, countryIso]);

  useEffect(() => {
    if (mode === "one") {
      setSelected((current) => current.slice(0, 1));
    }
  }, [mode]);

  function chooseLevel(next) {
    setLevel(next);
    setSelected([]);
    setMapError("");
  }

  function chooseCountry(iso) {
    setCountryIso(iso);
    setSelected([]);
  }

  function pick(item) {
    setSelected((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      if (exists) return current.filter((entry) => entry.id !== item.id);
      if (mode === "one") return [item];
      return [...current, item].slice(-2);
    });
  }

  function selectDemo(demo) {
    setLevel("city");
    const ids = [demo.place_id, demo.place_id_2].filter(Boolean);
    const chosen = ids.map((id) => CITIES.find((city) => city.id === id)).filter(Boolean);
    setSelected(chosen);
  }

  return {
    level,
    countryIso,
    countries,
    areas,
    cities: CITIES,
    selected,
    loadingMap,
    mapError,
    chooseLevel,
    chooseCountry,
    pick,
    selectDemo,
  };
}
