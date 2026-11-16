import { useRef, useState } from "react";
import { compare, friendlyError, investigate } from "../api";
import { CATALOG } from "../data/catalog";
import { checkForm, formFromDemo } from "../lib/form";

export function useInvestigation() {
  const [catalog] = useState(CATALOG);
  const [form, setForm] = useState(() => formFromDemo(CATALOG.demos[0], CATALOG));
  const [activeExample, setActiveExample] = useState("");
  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

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

  function runPlaces(slots) {
    if (!form) return;
    const left = slots && slots[0];
    const right = slots && slots[1];
    if (form.mode === "compare" && (!left || !right)) {
      setError("Click a boundary on each map. Both stay at the same level.");
      return;
    }
    if (!left) {
      setError("Click an area on the map first.");
      return;
    }
    const next = {
      ...form,
      placeId: "custom",
      placeName: left.name,
      lat: String(left.lat),
      lon: String(left.lon),
    };
    if (form.mode === "compare") {
      next.placeId2 = "custom";
      next.placeName2 = right.name;
      next.lat2 = String(right.lat);
      next.lon2 = String(right.lon);
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
