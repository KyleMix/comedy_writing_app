import type { NodeKind } from "./types";

// One source of truth for how each node kind reads on the board. Hazard is
// held back for the spine (premise and confirmed joke) and for live state,
// so the colored kinds stay legible without competing with the active path.
// Tones are desaturated to sit together on the near black surface.

export interface KindStyle {
  label: string;
  color: string; // hex, applied as a dynamic per kind accent
}

export const KIND_STYLES: Record<NodeKind, KindStyle> = {
  premise: { label: "PREMISE", color: "#F2EA00" }, // hazard, the hub
  story: { label: "STORY", color: "#84B26A" }, // muted green
  question: { label: "QUESTION", color: "#56C2D6" }, // muted cyan
  idea: { label: "IDEA", color: "#9AA0BC" }, // cool slate
  listing: { label: "LISTING", color: "#B49BFF" }, // muted violet
  analogy: { label: "ANALOGY", color: "#F2994A" }, // muted orange
  cliche: { label: "CLICHE", color: "#F27EA3" }, // muted pink
  joke: { label: "JOKE", color: "#F2EA00" }, // hazard, confirmed
};

export function kindStyle(kind: NodeKind): KindStyle {
  return KIND_STYLES[kind];
}
