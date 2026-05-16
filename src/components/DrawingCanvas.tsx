import { useEffect, useRef, useState, useCallback } from 'react';
import { Pen, Eraser, Circle } from 'lucide-react';

type Tool = 'pen' | 'eraser';
type EraserMode = 'pixel' | 'stroke';

interface Point { x: number; y: number; }

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: Tool;
}

const COLORS = ['#ffffff', '#f87171', '#60a5fa', '#4ade80', '#facc15'];
const BASE_ERASER_WIDTH = 28;
const PEN_SIZES = [
  { label: 'S',  value: 2  },
  { label: 'M',  value: 4  },
  { label: 'L',  value: 8  },
  { label: 'XL', value: 16 },
];

export default function DrawingCanvas() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);  // grid only — never erased
  const inkCanvasRef  = useRef<HTMLCanvasElement>(null);  // strokes only

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tool,           setTool          ] = useState<Tool>('pen');
  const [eraserMode,     setEraserMode    ] = useState<EraserMode>('stroke');
  const [color,          setColor         ] = useState('#ffffff');
  const [penSize,        setPenSize       ] = useState(4);
  const [showSizePopup,  setShowSizePopup ] = useState(false);
  const [showEraserPopup,setShowEraserPopup]=useState(false);
  const [displayScale,   setDisplayScale  ] = useState(1);
  const [strokeCount,    setStrokeCount   ] = useState(0);

  // ── Drawing refs ──────────────────────────────────────────────────────────
  const strokesRef      = useRef<Stroke[]>([]);
  const currentStroke   = useRef<Stroke | null>(null);
  const isDrawing       = useRef(false);
  const rafRef          = useRef<number | null>(null);

  // ── Pan / zoom refs ───────────────────────────────────────────────────────
  const scaleRef  = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  // ── Touch tracking ────────────────────────────────────────────────────────
  const touchPtrs    = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchDist    = useRef<number | null>(null);
  const panLast      = useRef<{ x: number; y: number } | null>(null);

  // ── S펜 barrel (contextmenu approach) ────────────────────────────────────
  const sPenActive   = useRef(false);
  const sPenPrevTool = useRef<Tool>('pen');

  // Mirror state → refs for use inside pointer handlers
  const toolRef      = useRef<Tool>('pen');       toolRef.current      = tool;
  const eraserModeRef= useRef<EraserMode>('stroke'); eraserModeRef.current = eraserMode;
  const colorRef     = useRef('#ffffff');          colorRef.current     = color;
  const penSizeRef   = useRef(4);                  penSizeRef.current   = penSize;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toLogical = (clientX: number, clientY: number): Point => {
    const rect = inkCanvasRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left  - offsetRef.current.x) / scaleRef.current,
      y: (clientY - rect.top   - offsetRef.current.y) / scaleRef.current,
    };
  };

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      drawGrid();
      drawInk();
    });
  }, []);

  // ── Grid canvas (background, never cleared by eraser) ────────────────────
  const drawGrid = () => {
    const canvas = gridCanvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const sc  = scaleRef.current;
    const off = offsetRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(off.x, off.y);
    ctx.scale(sc, sc);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth   = 1 / sc;
    const gs = 40;
    const x0 = Math.floor(-off.x / sc / gs) * gs;
    const y0 = Math.floor(-off.y / sc / gs) * gs;
    const x1 = x0 + canvas.width  / sc + gs;
    const y1 = y0 + canvas.height / sc + gs;
    for (let x = x0; x < x1; x += gs) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
    for (let y = y0; y < y1; y += gs) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
    ctx.restore();
  };

  // ── Ink canvas (strokes only — eraser uses clearRect here) ───────────────
  const drawInk = () => {
    const canvas = inkCanvasRef.current;
    const ctx    = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const sc  = scaleRef.current;
    const off = offsetRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(off.x, off.y);
    ctx.scale(sc, sc);

    const all = currentStroke.current
      ? [...strokesRef.current, currentStroke.current]
      : strokesRef.current;

    all.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.save();

      if (stroke.tool === 'eraser') {
        // True erase: remove pixels only from the ink canvas
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
      }

      ctx.lineCap    = 'round';
      ctx.lineJoin   = 'round';
      ctx.lineWidth  = stroke.width;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p    = stroke.points[i];
        const prev = stroke.points[i - 1];
        const mx   = (p.x + prev.x) / 2;
        const my   = (p.y + prev.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  };

  // ── Resize both canvases ──────────────────────────────────────────────────
  const resizeCanvases = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    [gridCanvasRef, inkCanvasRef].forEach(ref => {
      if (ref.current) { ref.current.width = w; ref.current.height = h; }
    });
    scheduleRedraw();
  }, [scheduleRedraw]);

  useEffect(() => {
    resizeCanvases();
    window.addEventListener('resize', resizeCanvases);
    return () => window.removeEventListener('resize', resizeCanvases);
  }, [resizeCanvases]);

  // ── Stroke eraser (stroke-mode) ───────────────────────────────────────────
  const eraseStrokeAt = (logX: number, logY: number) => {
    const thresh = 20 / scaleRef.current;
    const before = strokesRef.current.length;
    strokesRef.current = strokesRef.current.filter(s =>
      !s.points.some(p => Math.abs(p.x - logX) < thresh && Math.abs(p.y - logY) < thresh)
    );
    if (strokesRef.current.length !== before) {
      setStrokeCount(strokesRef.current.length);
      scheduleRedraw();
    }
  };

  // ── S펜 barrel via contextmenu ────────────────────────────────────────────
  useEffect(() => {
    const el = inkCanvasRef.current;
    if (!el) return;
    const onCtxMenu = (e: MouseEvent) => {
      e.preventDefault();
      // Toggle eraser while barrel held; restore on next pointerup
      if (!sPenActive.current) {
        sPenActive.current   = true;
        sPenPrevTool.current = toolRef.current;
        setTool('eraser');
      }
    };
    el.addEventListener('contextmenu', onCtxMenu);
    return () => el.removeEventListener('contextmenu', onCtxMenu);
  }, []);

  // ── Pointer down ──────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();

    if (e.pointerType === 'touch') {
      touchPtrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPtrs.current.size === 1) panLast.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const activeTool = sPenActive.current ? 'eraser' : toolRef.current;
    const pos = toLogical(e.clientX, e.clientY);

    if (activeTool === 'eraser' && eraserModeRef.current === 'stroke') {
      isDrawing.current = true;
      eraseStrokeAt(pos.x, pos.y);
      inkCanvasRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    isDrawing.current = true;
    currentStroke.current = {
      id:     `${Date.now()}_${Math.random()}`,
      points: [pos],
      color:  colorRef.current,
      width:  activeTool === 'eraser' ? BASE_ERASER_WIDTH : penSizeRef.current,
      tool:   activeTool,
    };
    inkCanvasRef.current?.setPointerCapture(e.pointerId);
    scheduleRedraw();
  };

  // ── Pointer move ──────────────────────────────────────────────────────────
  const onPointerMove = (e: React.PointerEvent) => {
    e.preventDefault();

    if (e.pointerType === 'touch') {
      touchPtrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(touchPtrs.current.values());

      if (pts.length >= 2) {
        // Pinch zoom
        const [p1, p2] = pts;
        const dx   = p1.x - p2.x;
        const dy   = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mid  = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        if (pinchDist.current !== null) {
          const ratio    = dist / pinchDist.current;
          const canvas   = inkCanvasRef.current!;
          const rect     = canvas.getBoundingClientRect();
          const mx       = mid.x - rect.left;
          const my       = mid.y - rect.top;
          const newScale = Math.min(Math.max(scaleRef.current * ratio, 0.2), 8);
          offsetRef.current = {
            x: mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current),
            y: my - (my - offsetRef.current.y) * (newScale / scaleRef.current),
          };
          scaleRef.current = newScale;
          setDisplayScale(Math.round(newScale * 100) / 100);
          scheduleRedraw();
        }
        pinchDist.current = dist;
        panLast.current   = null; // cancel pan during pinch
        return;
      }

      // Single finger pan
      if (pts.length === 1 && panLast.current) {
        offsetRef.current = {
          x: offsetRef.current.x + e.clientX - panLast.current.x,
          y: offsetRef.current.y + e.clientY - panLast.current.y,
        };
        panLast.current = { x: e.clientX, y: e.clientY };
        scheduleRedraw();
      }
      return;
    }

    if (!isDrawing.current) return;

    const activeTool = sPenActive.current ? 'eraser' : toolRef.current;
    const pos = toLogical(e.clientX, e.clientY);

    if (activeTool === 'eraser' && eraserModeRef.current === 'stroke') {
      eraseStrokeAt(pos.x, pos.y);
      return;
    }

    if (currentStroke.current) {
      currentStroke.current = {
        ...currentStroke.current,
        points: [...currentStroke.current.points, pos],
      };
      scheduleRedraw();
    }
  };

  // ── Pointer up ────────────────────────────────────────────────────────────
  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      touchPtrs.current.delete(e.pointerId);
      if (touchPtrs.current.size < 2) pinchDist.current = null;
      if (touchPtrs.current.size === 0) {
        panLast.current = null;
      } else {
        panLast.current = Array.from(touchPtrs.current.values())[0];
      }
      return;
    }

    // Release S펜 barrel
    if (sPenActive.current) {
      sPenActive.current = false;
      setTool(sPenPrevTool.current);
    }

    // Commit stroke
    if (isDrawing.current && currentStroke.current) {
      if (currentStroke.current.points.length >= 2) {
        strokesRef.current = [...strokesRef.current, currentStroke.current];
        setStrokeCount(strokesRef.current.length);
      }
      currentStroke.current = null;
      scheduleRedraw();
    }
    isDrawing.current = false;
  };

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect     = inkCanvasRef.current!.getBoundingClientRect();
    const mx       = e.clientX - rect.left;
    const my       = e.clientY - rect.top;
    const ratio    = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scaleRef.current * ratio, 0.2), 8);
    offsetRef.current = {
      x: mx - (mx - offsetRef.current.x) * (newScale / scaleRef.current),
      y: my - (my - offsetRef.current.y) * (newScale / scaleRef.current),
    };
    scaleRef.current = newScale;
    setDisplayScale(Math.round(newScale * 100) / 100);
    scheduleRedraw();
  };

  const handleUndo = () => {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    scheduleRedraw();
  };

  const handleClear = () => {
    strokesRef.current = [];
    currentStroke.current = null;
    setStrokeCount(0);
    scheduleRedraw();
  };

  return (
    <div
      className="flex flex-col h-full"
      onClick={() => { setShowSizePopup(false); setShowEraserPopup(false); }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50 flex-shrink-0">

        {/* Pen + size popup */}
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setTool('pen'); setShowEraserPopup(false); setShowSizePopup(v => !v); }}
            className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="펜 (다시 누르면 두께 조절)"
          >
            <Pen size={16} />
          </button>
          {showSizePopup && (
            <div className="absolute top-11 left-0 z-50 bg-zinc-800 border border-zinc-700 rounded-xl p-2 flex flex-col gap-1 shadow-2xl" onClick={e => e.stopPropagation()}>
              {PEN_SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => { setPenSize(s.value); setTool('pen'); setShowSizePopup(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${penSize === s.value ? 'bg-indigo-500 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}
                >
                  <div className="w-14 flex items-center">
                    <div className="bg-current rounded-full w-full" style={{ height: `${Math.max(s.value / 2, 1)}px` }} />
                  </div>
                  <span className="font-mono text-xs">{s.label} ({s.value}px)</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Eraser + mode popup */}
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation(); setShowSizePopup(false);
              if (tool === 'eraser') { setShowEraserPopup(v => !v); }
              else { setTool('eraser'); setShowEraserPopup(true); }
            }}
            className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            title="지우개 (다시 누르면 모드 선택)"
          >
            <Eraser size={16} />
          </button>
          {showEraserPopup && (
            <div className="absolute top-11 left-0 z-50 bg-zinc-800 border border-zinc-700 rounded-xl p-2 flex flex-col gap-1 shadow-2xl min-w-[148px]" onClick={e => e.stopPropagation()}>
              <button onClick={() => { setEraserMode('stroke'); setShowEraserPopup(false); }} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${eraserMode === 'stroke' ? 'bg-indigo-500 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}>
                ✏️ 획 지우개
              </button>
              <button onClick={() => { setEraserMode('pixel'); setShowEraserPopup(false); }} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${eraserMode === 'pixel' ? 'bg-indigo-500 text-white' : 'text-zinc-300 hover:bg-zinc-700'}`}>
                ⬜ 영역 지우개
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        {/* Colors */}
        {COLORS.map(c => (
          <button key={c} onClick={e => { e.stopPropagation(); setColor(c); setTool('pen'); }}
            className={`w-6 h-6 rounded-full border-2 transition-all ${color === c && tool === 'pen' ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: c }} />
        ))}

        <div className="flex-1" />

        {/* Status */}
        <div className="flex items-center gap-2">
          {tool === 'eraser' && <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-mono text-zinc-400">{eraserMode === 'stroke' ? '획 지우개' : '영역 지우개'}</span>}
          {tool === 'pen'    && <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs font-mono text-zinc-400">{PEN_SIZES.find(s => s.value === penSize)?.label} {penSize}px</span>}
          <span className="text-xs font-mono text-zinc-500">{Math.round(displayScale * 100)}%</span>
        </div>

        <div className="w-px h-5 bg-zinc-700 mx-1" />

        <button onClick={e => { e.stopPropagation(); handleUndo(); }} className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-mono">되돌리기</button>
        <button onClick={e => { e.stopPropagation(); handleClear(); }} className="px-2.5 py-1.5 text-xs text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors font-mono">전체 지우기</button>
      </div>

      {/* Canvas container — two stacked canvases */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-zinc-950" style={{ touchAction: 'none' }}>
        {/* Layer 1: grid (bottom) */}
        <canvas ref={gridCanvasRef} className="absolute inset-0" style={{ pointerEvents: 'none' }} />

        {/* Layer 2: ink (top) — receives all events */}
        <canvas
          ref={inkCanvasRef}
          className="absolute inset-0 cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          style={{ touchAction: 'none', background: 'transparent' }}
        />

        {strokeCount === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-zinc-700">
              <Circle size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">S펜으로 풀이를 작성하세요</p>
              <p className="text-xs mt-1">손가락으로 이동 · 핀치로 확대/축소</p>
              <p className="text-xs mt-0.5">S펜 버튼 누른 채 쓰면 지우개</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
