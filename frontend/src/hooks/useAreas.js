import { useEffect, useState } from "react";
import { CITIES } from "../data/cities";
import { loadAdmin, loadCountries } from "../lib/boundaries";

export function useAreas(mode) {
  const [level, setLevel] = useState("country");
  const [countryIso, setCountryIso] = useState("PAK");
  const [countries, setCountries] = useState([]);
  const [areas, setAreas] = useState([]);
  const [slots, setSlots] = useState([null, null]);
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
      setSlots((current) => [current[0], null]);
    }
  }, [mode]);

  function chooseLevel(next) {
    setLevel(next);
    setSlots([null, null]);
    setMapError("");
  }

  function chooseCountry(iso) {
    setCountryIso(iso);
    setSlots([null, null]);
  }

  function pickAt(index, item) {
    setSlots((current) => {
      const next = [current[0], current[1]];
      const slot = mode === "one" ? 0 : index;
      const same = next[slot] && next[slot].id === item.id;
      next[slot] = same ? null : item;
      if (mode === "one") next[1] = null;
      return next;
    });
  }

  function selectDemo(demo) {
    setLevel("city");
    const ids = [demo.place_id, demo.place_id_2].filter(Boolean);
    const chosen = ids.map((id) => CITIES.find((city) => city.id === id)).filter(Boolean);
    setSlots([chosen[0] || null, chosen[1] || null]);
  }

  return {
    level,
    countryIso,
    countries,
    areas,
    cities: CITIES,
    slots,
    selected: slots.filter(Boolean),
    loadingMap,
    mapError,
    chooseLevel,
    chooseCountry,
    pickAt,
    selectDemo,
  };
}
