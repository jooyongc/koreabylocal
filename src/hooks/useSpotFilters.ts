import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export function useSpotFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const area = searchParams.get("area") ?? undefined;
  const type = searchParams.get("type") ?? undefined;

  const setArea = useCallback(
    (next: string | undefined) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next) params.set("area", next);
        else params.delete("area");
        return params;
      });
    },
    [setSearchParams],
  );

  const setType = useCallback(
    (next: string | undefined) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next) params.set("type", next);
        else params.delete("type");
        return params;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("area");
      params.delete("type");
      return params;
    });
  }, [setSearchParams]);

  return { area, type, setArea, setType, clearFilters };
}
