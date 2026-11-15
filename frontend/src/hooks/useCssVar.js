import { useEffect, useState } from "react";

export function useCssVar(name) {
  const [value, setValue] = useState("");

  useEffect(() => {
    function read() {
      const next = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      setValue(next);
    }
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, [name]);

  return value;
}
