export function resolveProgressTarget(params: {
  availableIds: string[];
  anchorId?: string | null;
  fallbackProgress?: number | null;
}) {
  if (params.anchorId && params.availableIds.includes(params.anchorId)) {
    return {
      type: "anchor" as const,
      value: params.anchorId,
    };
  }

  if (typeof params.fallbackProgress === "number" && params.fallbackProgress > 0) {
    return {
      type: "percent" as const,
      value: params.fallbackProgress,
    };
  }

  return {
    type: "top" as const,
    value: 0,
  };
}

export function clampProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}
