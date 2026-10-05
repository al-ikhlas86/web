'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { withBase } from '@/lib/base-path';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

// ─── Debug flag ───────────────────────────────────────────────────────────────
const DEBUG = false;

// ─── Scroll density: pixels of scroll per frame ───────────────────────────────
// 120px per frame → 1 wheel notch (~100–120px) ≈ exactly 1 frame (responsive)
const PX_PER_FRAME = 120;

const FRAME_PREFIX = 'bg';

// ─── Types ────────────────────────────────────────────────────────────────────

type SegmentMeta = {
  id: string;
  title: string;
  subtitle: string;
  folder: string;
};

type SegmentConfig = SegmentMeta & {
  /** 0 = not yet available, renders placeholder card + overlay on click */
  totalFrames: number;
};

type FrameMapping = {
  segIdx: number;
  localFrameIdx: number;
  /** True only for the last frame of a segment — this is the "checkpoint arrival" frame */
  isCheckpointFrame: boolean;
};

export type VirtualTourCanvasProps = {
  imagePath?: string;
  imageExtension?: string;
};

// ─── Segment config ───────────────────────────────────────────────────────────
// File structure: public/tour-assets/{folder}/{FRAME_PREFIX}{n}.{ext}
// Last file in each folder = checkpoint frame (thumbnail + title reveal)
// totalFrames is NOT listed here — it's detected at runtime via /api/tour-frames,
// which scans the folder and reports the highest bgN file found. Just drop new
// images into the folder and refresh; no code change needed.

const SEGMENT_META: SegmentMeta[] = [
  {
    id: 'cp1',
    title: 'Gerbang Utama',
    subtitle: 'Titik awal virtual tour',
    folder: 'cp1',
  },
  {
    id: 'cp2',
    title: 'Ruang Tata Usaha',
    subtitle: 'Area administrasi sekolah',
    folder: 'cp2',
  },
  {
    id: 'cp3',
    title: 'Halaman Sekolah',
    subtitle: 'Area terbuka dan aktivitas siswa',
    folder: 'cp3',
  },
  {
    id: 'cp4',
    title: 'Lorong Kelas',
    subtitle: 'Akses menuju ruang pembelajaran',
    folder: 'cp4',
  },
  {
    id: 'cp5',
    title: 'Perpustakaan',
    subtitle: 'Area literasi dan belajar mandiri',
    folder: 'cp5',
  },
  {
    id: 'cp6',
    title: 'Lapangan',
    subtitle: 'Area kegiatan luar ruang',
    folder: 'cp6',
  },
];

function buildFrameMappings(segments: SegmentConfig[]): FrameMapping[] {
  const m: FrameMapping[] = [];
  for (let s = 0; s < segments.length; s++) {
    const seg = segments[s];
    if (seg.totalFrames <= 0) continue;
    for (let f = 0; f < seg.totalFrames; f++) {
      m.push({ segIdx: s, localFrameIdx: f, isCheckpointFrame: f === seg.totalFrames - 1 });
    }
  }
  return m;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findLastIdx<T>(arr: T[], pred: (v: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) return i;
  }
  return -1;
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
): void {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw: number, dh: number, dx: number, dy: number;
  if (ir > cr) {
    dh = h; dw = dh * ir; dx = (w - dw) / 2; dy = 0;
  } else {
    dw = w; dh = dw / ir; dx = 0; dy = (h - dh) / 2;
  }
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawDark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  label?: string,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, w, h);
  if (label) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, w / 2, h / 2);
    ctx.restore();
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VirtualTourCanvas({
  imagePath = withBase('/tour-assets'),
  imageExtension = 'webp',
}: VirtualTourCanvasProps) {

  // ── State ──────────────────────────────────────────────────────────────────
  /** Fetched once on mount from /api/tour-frames; null while the request is in flight */
  const [frameCounts, setFrameCounts] = useState<Record<string, number> | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  /** Always the last checkpoint reached — title never blanks during transition */
  const [displaySegment, setDisplaySegment] = useState<SegmentConfig>({ ...SEGMENT_META[0], totalFrames: 0 });
  /** True only while the current globalFrame is the last frame of its segment */
  const [isAtCheckpoint, setIsAtCheckpoint] = useState(true);
  /** True for 1.5 s after user click/tap to temporarily show UI during transition */
  const [isCardsRevealedByUser, setIsCardsRevealedByUser] = useState(false);
  /** Set when user clicks a checkpoint with no frames available yet */
  const [emptySegmentMsg, setEmptySegmentMsg] = useState<string | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Mirror of isCardsRevealedByUser for use inside ScrollTrigger callback without re-creating the trigger */
  const isCardsRevealedRef = useRef(false);
  /**
   * segmentImagesRef[segIdx][localFrameIdx] = HTMLImageElement | undefined
   * Undefined means the file failed to load or hasn't been loaded yet.
   */
  const segmentImagesRef = useRef<(HTMLImageElement | undefined)[][]>([]);
  const globalFrameRef = useRef<number>(0);
  /** Index into segments of the last checkpoint we've reached via scroll */
  const currentSegIdxRef = useRef<number>(0);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** DOM ref for debug overlay — written directly to avoid React re-renders */
  const debugRef = useRef<HTMLDivElement>(null);
  /** Card rail DOM node — used for mouse-drag horizontal scroll */
  const cardRailRef = useRef<HTMLDivElement>(null);
  /** Tracks drag state; avoids re-renders during drag */
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  // ── Fetch frame counts (auto-detects new/replaced images in public/tour-assets) ──
  useEffect(() => {
    let cancelled = false;
    fetch(withBase('/api/tour-frames'), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setFrameCounts(data.frames ?? {}); })
      .catch(() => { if (!cancelled) setFrameCounts({}); });
    return () => { cancelled = true; };
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const segments = useMemo<SegmentConfig[]>(() => {
    if (!frameCounts) return [];
    return SEGMENT_META.map((s) => ({ ...s, totalFrames: frameCounts[s.folder] ?? 0 }));
  }, [frameCounts]);
  const frameMappings = useMemo<FrameMapping[]>(() => buildFrameMappings(segments), [segments]);
  // Section height: 100vh (sticky area) + scrollable range
  // scrollable range = (frames - 1) * PX_PER_FRAME → each frame costs exactly PX_PER_FRAME px
  const scrollExtraPx = Math.max(frameMappings.length - 1, 1) * PX_PER_FRAME;

  const isUiVisible = isAtCheckpoint || isCardsRevealedByUser;
  const displaySegIdx = segments.findIndex(s => s.id === displaySegment.id);
  const progressPercent =
    segments.length > 1 ? (Math.max(0, displaySegIdx) / (segments.length - 1)) * 100 : 0;

  // ── revealCards ────────────────────────────────────────────────────────────
  const revealCards = useCallback((): void => {
    isCardsRevealedRef.current = true;
    setIsCardsRevealedByUser(true);
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(() => {
      isCardsRevealedRef.current = false;
      setIsCardsRevealedByUser(false);
    }, 1500);
  }, []);

  // ── drawGlobalFrame ────────────────────────────────────────────────────────
  const drawGlobalFrame = useCallback(
    (gf: number): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;

      const mapping = frameMappings[gf];
      if (!mapping) { drawDark(ctx, w, h); return; }

      const img = segmentImagesRef.current[mapping.segIdx]?.[mapping.localFrameIdx];
      if (!img?.complete || !img.naturalWidth) {
        const seg = segments[mapping.segIdx];
        drawDark(ctx, w, h, `${seg.folder}/${FRAME_PREFIX}${mapping.localFrameIdx + 1}.${imageExtension}`);
        return;
      }

      drawImageCover(ctx, img, w, h);
    },
    [imageExtension, frameMappings, segments],
  );

  // ── resizeCanvas ───────────────────────────────────────────────────────────
  const resizeCanvas = useCallback((): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (w === 0 || h === 0) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGlobalFrame(globalFrameRef.current);
    }
  }, [drawGlobalFrame]);

  // ── Preload ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!frameCounts) return; // still waiting on /api/tour-frames
    let cancelled = false;

    const nonEmpty = segments.filter(s => s.totalFrames > 0);
    const totalToLoad = nonEmpty.reduce((sum, s) => sum + s.totalFrames, 0);

    if (totalToLoad === 0) { setLoadingState('error'); return; }

    // Sparse 2-D array indexed by [segIdx][localFrameIdx]
    const images: (HTMLImageElement | undefined)[][] = segments.map(s =>
      new Array<HTMLImageElement | undefined>(Math.max(s.totalFrames, 0)).fill(undefined),
    );

    let settled = 0;
    let success = 0;

    const onSettled = (): void => {
      settled++;
      if (settled === totalToLoad && !cancelled) {
        if (success === 0) {
          setLoadingState('error');
        } else {
          segmentImagesRef.current = images;
          setLoadingState('loaded');
        }
      }
    };

    for (let si = 0; si < segments.length; si++) {
      const seg = segments[si];
      if (seg.totalFrames <= 0) continue;
      for (let fi = 0; fi < seg.totalFrames; fi++) {
        const segIdx = si;
        const frameIdx = fi;
        const img = new Image();
        img.onload = () => {
          if (cancelled) return;
          success++;
          images[segIdx][frameIdx] = img;
          onSettled();
        };
        img.onerror = () => {
          if (cancelled) return;
          onSettled(); // images[segIdx][frameIdx] stays undefined → placeholder
        };
        img.src = `${imagePath}/${seg.folder}/${FRAME_PREFIX}${frameIdx + 1}.${imageExtension}`;
      }
    }

    return () => { cancelled = true; };
  }, [frameCounts, segments, imagePath, imageExtension]);

  // ── ScrollTrigger ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (loadingState !== 'loaded') return;
    const section = sectionRef.current;
    if (!section) return;

    resizeCanvas();

    const totalMappings = frameMappings.length;

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        // Clear empty-segment overlay as soon as user scrolls
        setEmptySegmentMsg(null);

        const gf = Math.min(
          Math.round(self.progress * (totalMappings - 1)),
          totalMappings - 1,
        );
        if (gf === globalFrameRef.current) return;
        globalFrameRef.current = gf;
        drawGlobalFrame(gf);

        const mapping = frameMappings[gf];
        if (!mapping) return;

        const atCP = mapping.isCheckpointFrame;

        // Update debug overlay without triggering React re-render
        if (DEBUG && debugRef.current) {
          const seg = segments[mapping.segIdx];
          debugRef.current.textContent =
            `${seg.folder} | f ${mapping.localFrameIdx + 1}/${seg.totalFrames}` +
            ` | ${seg.folder}/${FRAME_PREFIX}${mapping.localFrameIdx + 1}.${imageExtension}` +
            ` | at:${atCP} | ui:${atCP || isCardsRevealedRef.current}`;
        }

        // Only update React state when something actually changes
        setIsAtCheckpoint((prev) => (prev === atCP ? prev : atCP));

        if (atCP && mapping.segIdx !== currentSegIdxRef.current) {
          currentSegIdxRef.current = mapping.segIdx;
          setDisplaySegment(segments[mapping.segIdx]);
        }
      },
    });

    window.addEventListener('resize', resizeCanvas);

    return () => {
      st.kill();
      window.removeEventListener('resize', resizeCanvas);
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, [loadingState, drawGlobalFrame, resizeCanvas, imageExtension, frameMappings, segments]);

  // ── handleSegmentClick ─────────────────────────────────────────────────────
  const handleSegmentClick = useCallback(
    (segIdx: number): void => {
      const seg = segments[segIdx];
      if (!seg) return;

      // Empty segment: show overlay, keep current scroll position
      if (seg.totalFrames === 0) {
        setEmptySegmentMsg(seg.title);
        revealCards();
        return;
      }

      setEmptySegmentMsg(null);
      revealCards();

      const section = sectionRef.current;
      if (!section) return;

      const totalMappings = frameMappings.length;
      if (totalMappings === 0) return;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;
      const sectionHeight = section.offsetHeight;
      const viewportH = window.innerHeight;
      const scrollableRange = sectionHeight - viewportH;

      const targetFirstGlobal = frameMappings.findIndex(m => m.segIdx === segIdx);
      const targetLastGlobal = findLastIdx(frameMappings, m => m.segIdx === segIdx);
      if (targetFirstGlobal === -1 || targetLastGlobal === -1) return;

      const endProgress = totalMappings > 1 ? targetLastGlobal / (totalMappings - 1) : 0;
      const targetScroll = sectionTop + endProgress * scrollableRange;

      // Determine if a smart jump is needed (target is ≥ 2 segments away)
      const currentSegEnd = findLastIdx(frameMappings, m => m.segIdx === currentSegIdxRef.current);
      const isLongJump = targetFirstGlobal > currentSegEnd + 1;

      if (isLongJump) {
        // Draw the first frame of the target segment synchronously
        const firstImg = segmentImagesRef.current[segIdx]?.[0];
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && firstImg?.complete && firstImg.naturalWidth) {
          drawImageCover(ctx, firstImg, canvas.offsetWidth, canvas.offsetHeight);
        }

        // Instant scroll to target segment start, then smooth scroll to its end
        const startProgress = totalMappings > 1 ? targetFirstGlobal / (totalMappings - 1) : 0;
        const jumpScroll = sectionTop + startProgress * scrollableRange;

        const tl = gsap.timeline();
        tl.to(window, { duration: 0, scrollTo: { y: jumpScroll, autoKill: false } });
        tl.to(window, {
          duration: 1.2,
          scrollTo: { y: targetScroll, autoKill: false },
          ease: 'power2.inOut',
        });
      } else {
        // Normal smooth scroll — plays through nearby frames
        gsap.to(window, {
          duration: 1.5,
          scrollTo: { y: targetScroll, autoKill: false },
          ease: 'power2.inOut',
        });
      }
    },
    [revealCards, segments, frameMappings],
  );

  // ── Card rail drag handlers ────────────────────────────────────────────────
  const onRailMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rail = cardRailRef.current;
    if (!rail) return;
    drag.current = { active: true, startX: e.pageX - rail.offsetLeft, scrollLeft: rail.scrollLeft, moved: false };
    rail.style.cursor = 'grabbing';
    rail.style.userSelect = 'none';
  }, []);

  const onRailMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const rail = cardRailRef.current;
    if (!rail) return;
    const dx = (e.pageX - rail.offsetLeft) - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    rail.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const onRailMouseEnd = useCallback(() => {
    const rail = cardRailRef.current;
    if (rail) { rail.style.cursor = 'grab'; rail.style.removeProperty('user-select'); }
    drag.current.active = false;
  }, []);

  // Prevent card rail from swallowing vertical wheel events (keeps tour scroll working)
  const onRailWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      // Vertical scroll — let it bubble to the page/ScrollTrigger, do nothing here
      return;
    }
    // Horizontal scroll — handle inside the rail
    const rail = cardRailRef.current;
    if (rail) rail.scrollLeft += e.deltaX;
    e.stopPropagation();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Loading
  // ─────────────────────────────────────────────────────────────────────────
  if (loadingState === 'loading') {
    return (
      <section
        style={{ height: `calc(100vh + ${scrollExtraPx}px)` }}
        className="relative bg-zinc-950"
      >
        <div className="tour-viewport sticky top-0 h-screen w-full flex items-center justify-center">
          <div className="text-center space-y-6">
            <p className="text-white/30 text-xs tracking-[0.45em] uppercase">
              Menyiapkan Virtual Tour
            </p>
            {/* Shimmer loading bar */}
            <div className="w-48 h-px bg-white/10 mx-auto relative overflow-hidden">
              <div className="loading-shimmer absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            </div>
            <p className="text-white/15 text-[10px] tracking-[0.35em] uppercase">
              Harap tunggu sebentar
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Error
  // ─────────────────────────────────────────────────────────────────────────
  if (loadingState === 'error') {
    return (
      <section
        className="relative bg-zinc-950 flex items-center justify-center"
        style={{ minHeight: '100vh' }}
      >
        <div className="text-center px-8 max-w-lg space-y-6">
          <div className="w-10 h-px bg-amber-400/40 mx-auto" />
          <h2 className="text-white text-3xl font-bold">Aset Tidak Tersedia</h2>
          <p className="text-white/40 text-sm leading-relaxed">
            Tidak ada gambar yang berhasil dimuat. Tambahkan file ke folder segment:
          </p>
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-5 text-left font-mono text-sm text-white/60 space-y-1">
            <p>{imagePath}/cp1/bg1.{imageExtension}</p>
            <p>{imagePath}/cp2/bg1.{imageExtension}</p>
            <p className="text-white/25">...</p>
          </div>
        </div>
      </section>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: Main UI
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <section ref={sectionRef} style={{ height: `calc(100vh + ${scrollExtraPx}px)` }} className="relative">
      <div
        className="tour-viewport sticky top-0 h-screen w-full overflow-hidden"
        onClick={revealCards}
      >

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ display: 'block' }}
        />

        {/* Gradient overlays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.48) 32%, rgba(0,0,0,0.12) 60%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 22%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.16) 100%)',
          }}
        />

        {/* ── Debug overlay ─────────────────────────────────────────────────── */}
        {DEBUG && (
          <div
            ref={debugRef}
            className="absolute top-4 left-4 z-50 pointer-events-none
              bg-black/75 text-green-400 text-[10px] font-mono px-3 py-1.5
              rounded-lg border border-green-400/20 leading-relaxed"
          />
        )}

        {/* ── Empty segment overlay ──────────────────────────────────────────── */}
        {emptySegmentMsg && (
          <div className="tour-unavailable absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <div className="text-center space-y-3 px-8 max-w-sm">
              <div className="w-8 h-px bg-amber-400/50 mx-auto" />
              <h3 className="text-white text-2xl font-bold">{emptySegmentMsg}</h3>
              <p className="text-white/40 text-sm">
                Aset virtual tour area ini belum tersedia.
              </p>
            </div>
          </div>
        )}

        {/* ── Left panel: area title + subtitle ─────────────────────────────── */}
        <div
          className={[
            'tour-area-panel absolute z-10 pointer-events-none',
            'left-7 md:left-14',
            'top-[38%] -translate-y-1/2',
            'max-w-[260px] md:max-w-[340px]',
            'transition-opacity duration-500 ease-out',
            isUiVisible ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-7 h-px bg-amber-400 flex-shrink-0" />
            <span className="text-amber-400/85 text-[10px] md:text-xs tracking-[0.3em] uppercase font-medium select-none">
              Sedang Menjelajahi
            </span>
          </div>
          <h2
            key={`title-${displaySegment.id}`}
            className="tour-title-animate text-white font-bold leading-[1.05] tracking-tight mb-2.5"
            style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.75rem)' }}
          >
            {displaySegment.title}
          </h2>
          <p
            key={`sub-${displaySegment.id}`}
            className="tour-title-animate text-white/55 text-sm md:text-base"
            style={{ animationDelay: '65ms' }}
          >
            {displaySegment.subtitle}
          </p>
        </div>

        {/* ── Cards + progress bar ───────────────────────────────────────────── */}
        <div
          className={[
            'tour-controls absolute z-10',
            'transition-opacity duration-500 ease-out',
            isUiVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
            // Mobile: full-width bottom strip
            'bottom-0 left-0 right-0 px-4 pb-5',
            // Desktop: right portion
            'md:bottom-[15vh] md:left-[38%] md:right-8 md:px-0 md:pb-0',
          ].join(' ')}
        >
          {/* Progress bar — desktop only */}
          <div className="hidden md:flex items-center gap-4 mb-4">
            <span className="text-white/25 text-[10px] tracking-[0.4em] uppercase select-none">
              Tour
            </span>
            <div className="flex-1 h-px bg-white/10 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-amber-400/55 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-white/35 text-xs font-mono select-none">
              {String(displaySegIdx + 1).padStart(2, '0')}&thinsp;/&thinsp;
              {String(segments.length).padStart(2, '0')}
            </span>
          </div>

          {/* Portrait checkpoint cards */}
          <div
            ref={cardRailRef}
            className="tour-card-rail hide-scrollbar flex gap-2.5 md:gap-3 overflow-x-auto py-2"
            style={{ cursor: 'grab' }}
            onMouseDown={onRailMouseDown}
            onMouseMove={onRailMouseMove}
            onMouseUp={onRailMouseEnd}
            onMouseLeave={onRailMouseEnd}
            onWheel={onRailWheel}
          >
            {segments.map((seg, idx) => {
              const hasFrames = seg.totalFrames > 0;
              const isActive = seg.id === displaySegment.id && isAtCheckpoint;
              // Thumbnail = last frame of the segment (the checkpoint arrival frame)
              const thumbSrc = hasFrames
                ? `${imagePath}/${seg.folder}/${FRAME_PREFIX}${seg.totalFrames}.${imageExtension}`
                : null;

              return (
                <button
                  key={seg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (drag.current.moved) { drag.current.moved = false; return; }
                    handleSegmentClick(idx);
                  }}
                  aria-pressed={isActive}
                  aria-label={`Pergi ke ${seg.title}`}
                  className={[
                    'tour-checkpoint relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer select-none',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60',
                    'transition-all duration-500 ease-out',
                    isActive
                      ? 'scale-[1.04] shadow-2xl shadow-black/80 ring-1 ring-white/35'
                      : 'opacity-65 hover:opacity-90 hover:scale-[1.03]',
                    !hasFrames ? 'cursor-default' : '',
                  ].join(' ')}
                  style={{
                    width: 'clamp(130px, 11vw, 158px)',
                    height: 'clamp(178px, 15vw, 218px)',
                  }}
                >
                  {/* Layer 0: dark background (always visible) */}
                  <div className="absolute inset-0 bg-zinc-900 z-0" />

                  {/* Layer 1: thumbnail — last frame of segment */}
                  {thumbSrc && (
                    <img
                      src={thumbSrc}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover z-[1]"
                      onError={(e) => { (e.currentTarget).style.display = 'none'; }}
                    />
                  )}

                  {/* Layer 1b: "belum tersedia" pattern for empty segments */}
                  {!hasFrames && (
                    <div
                      className="absolute inset-0 z-[1] opacity-[0.035]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
                        backgroundSize: '8px 8px',
                      }}
                    />
                  )}

                  {/* Layer 2: gradient overlay */}
                  <div
                    className="absolute inset-0 z-[2]"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.18) 100%)',
                    }}
                  />

                  {/* Layer 3: active glow */}
                  {isActive && (
                    <div className="absolute inset-0 z-[3] bg-white/[0.07]" />
                  )}

                  {/* Layer 4: text content */}
                  <div className="absolute inset-0 z-[4] flex flex-col justify-between p-3">
                    <div>
                      <span
                        className={[
                          'block w-5 h-px mb-2 transition-colors duration-300',
                          isActive ? 'bg-amber-400' : 'bg-white/30',
                        ].join(' ')}
                      />
                      <span
                        className={[
                          'text-[10px] font-mono tabular-nums transition-colors duration-300',
                          isActive ? 'text-amber-400' : 'text-white/35',
                        ].join(' ')}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      {!hasFrames && (
                        <span className="block text-[9px] text-white/25 mb-1 tracking-wider uppercase">
                          Belum tersedia
                        </span>
                      )}
                      <span
                        className={[
                          'block text-[10px] leading-snug mb-1 transition-colors duration-300',
                          isActive ? 'text-white/65' : 'text-white/35',
                        ].join(' ')}
                      >
                        {seg.subtitle}
                      </span>
                      <span
                        className={[
                          'block text-[12px] md:text-[13px] font-bold leading-snug transition-colors duration-300',
                          isActive ? 'text-white' : 'text-white/65',
                          !hasFrames ? 'opacity-50' : '',
                        ].join(' ')}
                      >
                        {seg.title}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile "Area" button — visible only when UI is hidden */}
        {!isUiVisible && (
          <button
            className={[
              'md:hidden absolute bottom-5 right-5 z-20 pointer-events-auto',
              'bg-black/65 backdrop-blur-md border border-white/18 rounded-full',
              'px-4 py-2 text-white/75 text-[11px] tracking-[0.25em] uppercase',
            ].join(' ')}
            onClick={(e) => { e.stopPropagation(); revealCards(); }}
          >
            Area
          </button>
        )}

      </div>
    </section>
  );
}
