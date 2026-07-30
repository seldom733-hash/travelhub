"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";

export interface MobileDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Called when the drawer should close (after animation) */
  onClose: () => void;
  /** Header title */
  title?: string;
  /** Content to render inside the drawer */
  children: React.ReactNode;
  /** Optional hint text shown in peek mode */
  peekHint?: string;
  /** Open directly in full mode instead of peek */
  fullOnOpen?: boolean;
}

/**
 * Reusable bottom-sheet drawer with:
 * - Peek mode (handle + header only)
 * - Swipe-up to expand from peek
 * - Drag-to-dismiss with rubber-band resistance
 * - Velocity-based dismiss (fast swipe dismisses even short distance)
 * - Spring-back animation when released below threshold
 * - Haptic feedback at threshold and on dismiss
 * - Slide-down close animation
 * - Visual dismiss indicator when velocity is high enough
 */
export default function MobileDrawer({
  open,
  onClose,
  title,
  children,
  peekHint,
  fullOnOpen = false,
}: MobileDrawerProps) {
  const { t } = useI18n();

  // ── State ──
  const [drawerPeek, setDrawerPeek] = useState(!fullOnOpen);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [drawerDragY, setDrawerDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [willDismiss, setWillDismiss] = useState(false);

  // ── Refs ──
  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);
  const lastMoveY = useRef(0);
  const lastMoveTime = useRef(0);
  const hasVibratedThreshold = useRef(false);
  const handleDragStartY = useRef(0);
  const handleDragStartTime = useRef(0);

  // ── Helpers ──
  const vibrate = useCallback((ms: number) => {
    navigator.vibrate?.(ms);
  }, []);

  const applyResistance = useCallback((rawY: number): number => {
    const maxDrag = 400;
    const normalized = Math.min(rawY / maxDrag, 1);
    return rawY * (1 - 0.6 * Math.pow(normalized, 2));
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerDragY(0);
    setIsDragging(false);
    setWillDismiss(false);
    setDrawerPeek(false);
    setDrawerClosing(true);
  }, []);

  // ── Sync open state ──
  useEffect(() => {
    if (open && !drawerClosing) {
      setDrawerPeek(!fullOnOpen);
    }
  }, [open, fullOnOpen, drawerClosing]);

  // Don't render if not open and not closing
  if (!open && !drawerClosing) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeDrawer}
        style={{ opacity: isDragging ? Math.max(0, 0.4 - drawerDragY / 800) : drawerClosing ? 0 : undefined }}
      />

      {/* Drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col ${drawerClosing ? 'animate-slide-down' : !isDragging && drawerDragY > 0 ? 'drawer-spring-back' : 'animate-slide-up ' + (drawerPeek ? 'drawer-peek' : 'drawer-full')}`}
        style={{
          '--drag-y': `${drawerDragY}px`,
          transform: isDragging ? `translateY(${drawerDragY}px)` : undefined,
          opacity: willDismiss ? 0.7 : 1,
        } as React.CSSProperties}
        onAnimationEnd={(e) => {
          if (e.animationName === 'slide-down' && drawerClosing) {
            setDrawerClosing(false);
            onClose();
          } else if (e.animationName === 'spring-back') {
            setDrawerDragY(0);
          }
        }}
      >
        {/* Handle — swipe up to expand from peek, or tap to expand */}
        <div
          className="flex justify-center pt-3 pb-1 touch-none"
          onTouchStart={(e) => {
            handleDragStartY.current = e.touches[0].clientY;
            handleDragStartTime.current = Date.now();
          }}
          onTouchEnd={(e) => {
            if (!drawerPeek) return;
            const rawDy = e.changedTouches[0].clientY - handleDragStartY.current;
            const elapsed = Date.now() - handleDragStartTime.current;
            // Swipe up (negative dy) OR tap → expand to full
            if (rawDy < -20 || (Math.abs(rawDy) < 10 && elapsed < 300)) {
              vibrate(10);
              setDrawerPeek(false);
            }
            // Swipe down from peek → dismiss
            const velocity = elapsed > 0 ? (rawDy / elapsed) * 1000 : 0;
            if (rawDy > 40 || (velocity > 500 && rawDy > 10)) {
              closeDrawer();
            }
          }}
          onClick={() => {
            if (drawerPeek) setDrawerPeek(false);
          }}
        >
          <div className={`w-10 h-1 rounded-full transition-colors ${willDismiss ? 'bg-green-400' : 'bg-gray-300'}`} />
        </div>

        {/* Peek hint */}
        {drawerPeek && !willDismiss && peekHint && (
          <div className="flex justify-center pb-1">
            <span className="text-xs text-gray-400">↑ {peekHint}</span>
          </div>
        )}

        {/* Dismiss indicator */}
        {willDismiss && (
          <div className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none">
            <span className="px-4 py-1.5 bg-green-500 text-white text-sm font-medium rounded-full shadow-lg animate-pulse">
              ↑ {t('filter.releaseToDismiss')}
            </span>
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h3 className="font-bold text-secondary text-lg">{title}</h3>
            <button onClick={closeDrawer} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm">
              ✕
            </button>
          </div>
        )}

        {/* Scrollable content — drag-to-dismiss only when scrollTop <= 0 */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ touchAction: 'pan-y' }}
          onTouchStart={(e) => {
            dragStartY.current = e.touches[0].clientY;
            dragStartTime.current = Date.now();
            lastMoveY.current = e.touches[0].clientY;
            lastMoveTime.current = Date.now();
            hasVibratedThreshold.current = false;
            setWillDismiss(false);
          }}
          onTouchMove={(e) => {
            const el = e.currentTarget;
            const now = Date.now();
            const dy = e.touches[0].clientY - dragStartY.current;
            const dt = now - lastMoveTime.current;
            const instantVelocity = dt > 0 ? ((e.touches[0].clientY - lastMoveY.current) / dt) * 1000 : 0;
            lastMoveY.current = e.touches[0].clientY;
            lastMoveTime.current = now;
            if (dy > 0 && el.scrollTop <= 0) {
              if (!isDragging) setIsDragging(true);
              setDrawerDragY(applyResistance(dy));
              setWillDismiss(instantVelocity > 800 && dy > 20);
              if (dy > 120 && !hasVibratedThreshold.current) {
                hasVibratedThreshold.current = true;
                vibrate(10);
              }
            }
          }}
          onTouchEnd={(e) => {
            const elapsed = Date.now() - dragStartTime.current;
            const rawDy = e.changedTouches[0].clientY - dragStartY.current;
            const velocity = elapsed > 0 ? (rawDy / elapsed) * 1000 : 0;
            if (rawDy > 120 || (velocity > 800 && rawDy > 20)) {
              vibrate(20);
              setIsDragging(false);
              setWillDismiss(false);
              setDrawerDragY(0);
              setDrawerClosing(true);
            } else {
              setIsDragging(false);
              setWillDismiss(false);
            }
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
