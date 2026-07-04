import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { PublicGrid } from "../types";
import { TileView } from "./tiles/TileView";
import { MapOverlay } from "./MapOverlay";

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const COMMIT_FRACTION = 0.25; // drag > 25% of viewport commits
const COMMIT_VELOCITY = 400; // px/s release velocity commits
const MAP_LINGER_MS = 800;

type Dir = { dr: number; dc: number };
const LEFT: Dir = { dr: 0, dc: -1 };
const RIGHT: Dir = { dr: 0, dc: 1 };
const UP: Dir = { dr: -1, dc: 0 };
const DOWN: Dir = { dr: 1, dc: 0 };

export function Stage({ grid }: { grid: PublicGrid }) {
  const gsize = grid.size;
  const reduced = useReducedMotion();

  const initialCell = useMemo(() => {
    if (grid.cells[grid.startCell]) return grid.startCell;
    const first = grid.cells.findIndex(Boolean);
    return first >= 0 ? first : grid.startCell;
  }, [grid]);

  // `cell` drives layout (which tile sits at the origin); `activeIdx` flips the
  // moment a navigation commits, so media pauses instantly, before the slide ends.
  const [cell, setCell] = useState(initialCell);
  const [activeIdx, setActiveIdx] = useState(initialCell);
  const [animating, setAnimating] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const r = Math.floor(cell / gsize);
  const c = cell % gsize;

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasNeighbor = (dir: Dir): boolean => {
    const nr = r + dir.dr;
    const nc = c + dir.dc;
    return nr >= 0 && nr < gsize && nc >= 0 && nc < gsize && Boolean(grid.cells[nr * gsize + nc]);
  };

  const showMap = () => {
    clearTimeout(hideTimer.current);
    setMapVisible(true);
  };
  const scheduleHide = () => {
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setMapVisible(false), MAP_LINGER_MS);
  };
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const commit = (dir: Dir, nextIdx: number) => {
    if (!dims) return;
    setAnimating(true);
    setActiveIdx(nextIdx); // pauses outgoing media immediately
    showMap();
    const horiz = dir.dc !== 0;
    const mv = horiz ? x : y;
    const target = horiz ? -dir.dc * dims.w : -dir.dr * dims.h;

    const land = () => {
      flushSync(() => setCell(nextIdx));
      x.set(0);
      y.set(0);
      setAnimating(false);
      scheduleHide();
    };

    if (reduced) {
      land();
      return;
    }
    animate(mv, target, SPRING).then(land);
  };

  const bounce = (dir: Dir) => {
    showMap();
    if (reduced || !dims) {
      scheduleHide();
      return;
    }
    setAnimating(true);
    const horiz = dir.dc !== 0;
    const mv = horiz ? x : y;
    const amt = -(horiz ? dir.dc : dir.dr) * 44;
    animate(mv, amt, { duration: 0.1, ease: "easeOut" }).then(() =>
      animate(mv, 0, SPRING).then(() => {
        setAnimating(false);
        scheduleHide();
      }),
    );
  };

  const tryGo = (dir: Dir) => {
    if (animating) return;
    if (hasNeighbor(dir)) {
      commit(dir, (r + dir.dr) * gsize + (c + dir.dc));
    } else {
      bounce(dir);
    }
  };
  const tryGoRef = useRef(tryGo);
  tryGoRef.current = tryGo;

  // Keyboard: arrow keys move one cell with the same animation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowLeft: LEFT,
        ArrowRight: RIGHT,
        ArrowUp: UP,
        ArrowDown: DOWN,
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      tryGoRef.current(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Trackpad two-finger scroll: accumulate deltas, commit past a threshold.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const acc = { x: 0, y: 0, t: 0, lockUntil: 0 };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      if (now < acc.lockUntil) return;
      if (now - acc.t > 300) {
        acc.x = 0;
        acc.y = 0;
      }
      acc.t = now;
      acc.x += e.deltaX;
      acc.y += e.deltaY;
      const ax = Math.abs(acc.x);
      const ay = Math.abs(acc.y);
      if (Math.max(ax, ay) < 80) return;
      const dir = ax > ay ? (acc.x > 0 ? RIGHT : LEFT) : (acc.y > 0 ? DOWN : UP);
      acc.x = 0;
      acc.y = 0;
      acc.lockUntil = now + 650;
      tryGoRef.current(dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (!dims) {
    return <div ref={wrapRef} className="h-full w-full bg-ink" />;
  }

  const { w: W, h: H } = dims;

  // Current tile + up-to-4 in-bounds neighbors, pre-mounted so a swipe never
  // shows a blank frame. Keys are grid indices so tiles never remount on move.
  const visible: { idx: number; dr: number; dc: number }[] = [];
  for (const { dr, dc } of [
    { dr: 0, dc: 0 },
    LEFT,
    RIGHT,
    UP,
    DOWN,
  ]) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < gsize && nc >= 0 && nc < gsize && grid.cells[nr * gsize + nc]) {
      visible.push({ idx: nr * gsize + nc, dr, dc });
    }
  }

  const chevrons: { dir: Dir; Icon: typeof ChevronLeft; className: string; label: string }[] = [
    { dir: LEFT, Icon: ChevronLeft, className: "left-2 top-1/2 -translate-y-1/2", label: "Go left" },
    { dir: RIGHT, Icon: ChevronRight, className: "right-2 top-1/2 -translate-y-1/2", label: "Go right" },
    { dir: UP, Icon: ChevronUp, className: "top-2 left-1/2 -translate-x-1/2", label: "Go up" },
    { dir: DOWN, Icon: ChevronDown, className: "bottom-2 left-1/2 -translate-x-1/2", label: "Go down" },
  ];

  return (
    <div
      ref={wrapRef}
      className="group relative h-full w-full touch-none select-none overflow-hidden bg-ink outline-none"
      tabIndex={0}
      role="region"
      aria-roledescription="swipeable grid"
      aria-label={grid.title}
    >
      <motion.div
        className="absolute inset-0"
        style={{ x, y }}
        drag={!reduced}
        dragListener={!animating}
        dragDirectionLock
        dragMomentum={false}
        dragElastic={0.12}
        dragConstraints={{
          left: hasNeighbor(RIGHT) ? -W : 0,
          right: hasNeighbor(LEFT) ? W : 0,
          top: hasNeighbor(DOWN) ? -H : 0,
          bottom: hasNeighbor(UP) ? H : 0,
        }}
        onDragStart={showMap}
        onDragEnd={(_e, info) => {
          const dx = x.get();
          const dy = y.get();
          const horiz = Math.abs(dx) >= Math.abs(dy);
          const off = horiz ? dx : dy;
          const vel = horiz ? info.velocity.x : info.velocity.y;
          const span = horiz ? W : H;
          if (off !== 0) {
            const dir = horiz ? (off < 0 ? RIGHT : LEFT) : (off < 0 ? DOWN : UP);
            const pastDistance = Math.abs(off) > span * COMMIT_FRACTION;
            const pastVelocity =
              Math.abs(vel) > COMMIT_VELOCITY && Math.sign(vel) === Math.sign(off);
            if (hasNeighbor(dir) && (pastDistance || pastVelocity)) {
              commit(dir, (r + dir.dr) * gsize + (c + dir.dc));
              return;
            }
          }
          animate(x, 0, SPRING);
          animate(y, 0, SPRING);
          scheduleHide();
        }}
      >
        {visible.map(({ idx, dr, dc }) => (
          <div
            key={idx}
            className="absolute overflow-hidden"
            style={{ left: dc * W, top: dr * H, width: W, height: H }}
            aria-hidden={idx !== activeIdx}
          >
            <TileView tile={grid.cells[idx]!} active={idx === activeIdx} />
          </div>
        ))}
      </motion.div>

      {/* Desktop-only chevrons, visible on hover, only where a tile exists */}
      <div className="hidden [@media(hover:hover)_and_(pointer:fine)]:block">
        {chevrons.map(
          ({ dir, Icon, className, label }) =>
            hasNeighbor(dir) && (
              <button
                key={label}
                aria-label={label}
                onClick={() => tryGo(dir)}
                className={`absolute z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white/80 opacity-0 backdrop-blur-sm transition-opacity duration-300 hover:bg-black/45 hover:text-white group-hover:opacity-100 ${className}`}
              >
                <Icon size={22} />
              </button>
            ),
        )}
      </div>

      <MapOverlay grid={grid} current={activeIdx} visible={mapVisible} />
    </div>
  );
}
