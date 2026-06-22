import type { JokeNode, NodeKind } from "./types";
import { THREE_QUESTIONS } from "./methodology";

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  );
}

export function now(): number {
  return Date.now();
}

// Strip em dashes and en dashes from any text we store or render.
// No em dashes anywhere, per brand.
export function stripDashes(text: string): string {
  return text.replace(/—/g, ", ").replace(/–/g, "-");
}

// Radial layout helper. Place children around a parent point.
export function radialPositions(
  center: { x: number; y: number },
  count: number,
  radius: number,
  startAngle = -Math.PI / 2,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / count) * Math.PI * 2;
    out.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }
  return out;
}

export function makeNode(
  kind: NodeKind,
  partial: Partial<JokeNode>,
): JokeNode {
  const ts = now();
  return {
    id: uid(),
    kind,
    title: "",
    body: "",
    parentId: null,
    position: { x: 0, y: 0 },
    createdAt: ts,
    updatedAt: ts,
    ...partial,
  };
}

// The four auto spawned bubbles for a filled premise:
// three question bubbles plus one listing bubble.
export function buildPremiseChildren(
  premise: JokeNode,
): { nodes: JokeNode[]; positions: { x: number; y: number }[] } {
  const center = premise.position;
  const radius = 320;
  const positions = radialPositions(center, 4, radius);

  const questionNodes = THREE_QUESTIONS.map((q, i) =>
    makeNode("question", {
      parentId: premise.id,
      questionType: q.type,
      title: q.label,
      body: "",
      position: positions[i],
    }),
  );

  const listingNode = makeNode("listing", {
    parentId: premise.id,
    title: "Mine an element",
    body: "",
    position: positions[3],
  });

  return { nodes: [...questionNodes, listingNode], positions };
}
