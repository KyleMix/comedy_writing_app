"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  applyNodeChanges,
  type Viewport as RFViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useStore } from "@/lib/store";
import { BubbleNode } from "./nodes/BubbleNode";

const nodeTypes = { bubble: BubbleNode };

export default function Canvas() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const viewport = useStore((s) => s.viewport);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  const moveNode = useStore((s) => s.moveNode);
  const setViewport = useStore((s) => s.setViewport);

  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        type: "bubble",
        position: n.position,
        data: { node: n, selected: n.id === selectedNodeId },
        draggable: true,
      })),
    [nodes, selectedNodeId],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const targetNode = nodes.find((n) => n.id === e.target);
        const active =
          targetNode?.confirmed ||
          targetNode?.kind === "joke" ||
          sourceNode?.id === selectedNodeId ||
          targetNode?.id === selectedNodeId;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          className: active ? "active" : undefined,
          animated: active,
        };
      }),
    [edges, nodes, selectedNodeId],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // We only care about position changes to persist drags. React Flow
      // owns the visual state, the store owns the truth.
      const next = applyNodeChanges(changes, rfNodes);
      for (const change of changes) {
        if (change.type === "position" && change.position && !change.dragging) {
          moveNode(change.id, change.position);
        }
      }
      // We do not setState from next here; the store re render handles it.
      void next;
    },
    [rfNodes, moveNode],
  );

  const onNodeDrag = useCallback(
    (_e: unknown, node: Node) => {
      moveNode(node.id, node.position);
    },
    [moveNode],
  );

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeDrag={onNodeDrag}
      onNodeClick={(_e, node) => selectNode(node.id)}
      onPaneClick={() => selectNode(null)}
      defaultViewport={viewport}
      onMoveEnd={(_e, vp: RFViewport) =>
        setViewport({ x: vp.x, y: vp.y, zoom: vp.zoom })
      }
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      fitView={false}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={28}
        size={1}
        color="#242424"
      />
      <Controls />
      <MiniMap
        nodeColor={(n) =>
          (n.data as { node?: { confirmed?: boolean; kind?: string } })?.node
            ?.kind === "premise"
            ? "#f2ea00"
            : "#4d4d4d"
        }
        maskColor="rgba(10,10,10,0.7)"
      />
    </ReactFlow>
  );
}
