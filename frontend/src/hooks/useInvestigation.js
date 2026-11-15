import { useEffect, useRef, useState } from "react";
import { compare, friendlyError, getCatalog, investigate } from "../api";
import { checkForm, formFromDemo } from "../lib/form";

export function useInvestigation() {
  const [catalog, setCatalog] = useState(null);
  const [form, setForm] = useState(null);
  const [activeExample, setActiveExample] = useState("");
  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    let ignore = false;
    getCatalog()
      .then((data) => {
        if (ignore) return;
        setCatalog(data);
        const demo = data.demos[0];
        setForm(formFromDemo(demo, data));
        setLoading(false);
      })
      .catch((err) => {
        if (!ignore) {
          setError(friendlyError(err));
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  async function run(nextForm) {
    const problem = checkForm(nextForm);
    if (problem) {
      setError(problem);
      setLoading(false);
      return;
    }

    const myRequest = requestId.current + 1;
    requestId.current = myRequest;
    setLoading(true);
    setError("");
    try {
      if (nextForm.mode === "compare") {
        const data = await compare({
          variable: nextForm.variable,
          lat: nextForm.lat,
          lon: nextForm.lon,
          place: nextForm.placeName || "First place",
          lat2: nextForm.lat2,
          lon2: nextForm.lon2,
          place2: nextForm.placeName2 || "Second place",
          start: nextForm.start,
          end: nextForm.end,
        });
        if (myRequest !== requestId.current) return;
        setComparison(data);
        setResult(null);
      } else {
        const data = await investigate({
          variable: nextForm.variable,
          lat: nextForm.lat,
          lon: nextForm.lon,
          start: nextForm.start,
          end: nextForm.end,
          place: nextForm.placeName || "Selected place",
        });
        if (myRequest !== requestId.current) return;
        setResult(data);
        setComparison(null);
      }
    } catch (err) {
      if (myRequest !== requestId.current) return;
      setError(friendlyError(err));
    } finally {
      if (myRequest === requestId.current) setLoading(false);
    }
  }

  function updateForm(patch) {
    setActiveExample("");
    setForm((current) => ({ ...current, ...patch }));
  }

  function setMode(mode) {
    updateForm({ mode });
  }

  function applyExample(demo) {
    const next = formFromDemo(demo, catalog);
    setForm(next);
    setActiveExample(demo.id);
    run(next);
  }

  function runPlaces(places) {
    if (!form) return;
    if (form.mode === "compare" && places.length < 2) {
      setError("Click two areas on the map. Both stay at the same level.");
      return;
    }
    if (places.length < 1) {
      setError("Click an area on the map first.");
      return;
    }
    const next = {
      ...form,
      placeId: "custom",
      placeName: places[0].name,
      lat: String(places[0].lat),
      lon: String(places[0].lon),
    };
    if (places[1]) {
      next.placeId2 = "custom";
      next.placeName2 = places[1].name;
      next.lat2 = String(places[1].lat);
      next.lon2 = String(places[1].lon);
    }
    setActiveExample("");
    setForm(next);
    run(next);
  }

  return {
    catalog,
    form,
    activeExample,
    result,
    comparison,
    loading,
    error,
    updateForm,
    setMode,
    applyExample,
    runPlaces,
  };
}
