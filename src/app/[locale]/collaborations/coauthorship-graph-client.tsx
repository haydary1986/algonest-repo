'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { GraphNode, GraphLink } from './page';

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface CoauthorshipGraphClientProps {
  nodes: readonly GraphNode[];
  links: readonly GraphLink[];
}

export function CoauthorshipGraphClient({ nodes, links }: CoauthorshipGraphClientProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string } | null>(null);

  const handleNodeClick = useCallback(
    (username: string) => {
      router.push(`/researcher/${username}`);
    },
    [router],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 600;

    const simNodes: SimNode[] = nodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * width * 0.6,
      y: height / 2 + (Math.random() - 0.5) * height * 0.6,
      vx: 0,
      vy: 0,
    }));

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));

    const resolvedLinks = links
      .map((l) => ({ source: nodeMap.get(l.source), target: nodeMap.get(l.target) }))
      .filter((l): l is { source: SimNode; target: SimNode } => Boolean(l.source && l.target));

    let frameId: number;
    let tick = 0;
    const maxTicks = 200;
    const alpha = () => Math.max(0, 1 - tick / maxTicks);

    function simulate() {
      const a = alpha();
      if (a <= 0) return;

      // Repulsion between nodes
      for (let i = 0; i < simNodes.length; i++) {
        for (let j = i + 1; j < simNodes.length; j++) {
          const ni = simNodes[i]!;
          const nj = simNodes[j]!;
          const dx = nj.x - ni.x;
          const dy = nj.y - ni.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const force = (a * 800) / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          ni.vx -= fx;
          ni.vy -= fy;
          nj.vx += fx;
          nj.vy += fy;
        }
      }

      // Attraction along links
      for (const link of resolvedLinks) {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const force = a * (dist - 80) * 0.02;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        link.source.vx += fx;
        link.source.vy += fy;
        link.target.vx -= fx;
        link.target.vy -= fy;
      }

      // Center gravity
      for (const node of simNodes) {
        node.vx += (width / 2 - node.x) * a * 0.005;
        node.vy += (height / 2 - node.y) * a * 0.005;
        node.vx *= 0.6;
        node.vy *= 0.6;
        node.x = Math.max(10, Math.min(width - 10, node.x + node.vx));
        node.y = Math.max(10, Math.min(height - 10, node.y + node.vy));
      }

      // Render
      const lineEls = svg!.querySelectorAll<SVGLineElement>('[data-link]');
      lineEls.forEach((el, i) => {
        const l = resolvedLinks[i];
        if (!l) return;
        el.setAttribute('x1', String(l.source.x));
        el.setAttribute('y1', String(l.source.y));
        el.setAttribute('x2', String(l.target.x));
        el.setAttribute('y2', String(l.target.y));
      });

      const circleEls = svg!.querySelectorAll<SVGCircleElement>('[data-node]');
      circleEls.forEach((el, i) => {
        const n = simNodes[i];
        if (!n) return;
        el.setAttribute('cx', String(n.x));
        el.setAttribute('cy', String(n.y));
      });

      tick++;
      frameId = requestAnimationFrame(simulate);
    }

    frameId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(frameId);
  }, [nodes, links]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border">
      <svg
        ref={svgRef}
        className="h-[500px] w-full bg-background"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
      >
        {links.map((l, i) => (
          <line key={i} data-link className="stroke-muted-foreground/30" strokeWidth={1} />
        ))}
        {nodes.map((n) => (
          <circle
            key={n.id}
            data-node
            r={n.h_index ? Math.min(12, 4 + n.h_index * 0.3) : 5}
            className="cursor-pointer fill-primary stroke-primary/30 transition-colors hover:fill-primary/70"
            strokeWidth={2}
            onClick={() => handleNodeClick(n.username)}
            onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, name: n.name })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
          style={{ left: tooltip.x + 10, top: tooltip.y - 30 }}
        >
          {tooltip.name}
        </div>
      )}
    </div>
  );
}
