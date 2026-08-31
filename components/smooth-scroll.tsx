"use client";

import { useEffect } from "react";

// Основные настройки скролла. Значения повторяют характер движения референса.
const SMOOTH_SCROLL = {
  smoothness: 60,
  wheelSpeed: 1,
  trackpadSpeed: 0.8,
  stopThreshold: 1,
  renderThreshold: 1,
  mobileBreakpoint: 960,
  anchorDuration: 800,
};

function isTrackpad(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return false;
  return (Math.abs(event.deltaY) < 50 && event.deltaY % 1 !== 0) || Math.abs(event.deltaY) < 4;
}

function hasScrollableParent(target: EventTarget | null, deltaY: number) {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== document.body && element !== document.documentElement) {
    if (element.hasAttribute("data-smooth-scroll-prevent")) return true;

    if (element.scrollHeight > element.clientHeight + 1) {
      const overflow = window.getComputedStyle(element).overflowY;
      if (overflow === "auto" || overflow === "scroll") {
        const atTop = element.scrollTop <= 0 && deltaY < 0;
        const atBottom = element.scrollTop >= element.scrollHeight - element.clientHeight - 1 && deltaY > 0;
        if (!atTop && !atBottom) return true;
      }
    }

    element = element.parentElement;
  }

  return false;
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.innerWidth < SMOOTH_SCROLL.mobileBreakpoint) return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    let targetY = window.scrollY;
    let currentY = window.scrollY;
    let lastRenderedY = Math.round(window.scrollY);
    let maxScroll = 0;
    let wheelDelta = 0;
    let animationFrame: number | null = null;
    let lastTime = 0;
    let isRunning = false;

    const updateMaxScroll = () => {
      maxScroll = Math.max(0, root.scrollHeight - window.innerHeight);
    };

    const clamp = (value: number) => Math.min(Math.max(value, 0), maxScroll);

    const stop = () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      isRunning = false;
      lastTime = 0;
    };

    const tick = (time: number) => {
      const deltaTime = lastTime ? Math.min(time - lastTime, 64) : 16;
      lastTime = time;

      if (wheelDelta !== 0) {
        targetY = clamp(targetY + wheelDelta);
        wheelDelta = 0;
      }

      const factor = 1 - Math.pow(2, -deltaTime / SMOOTH_SCROLL.smoothness);
      currentY += (targetY - currentY) * factor;

      if (Math.abs(targetY - currentY) < SMOOTH_SCROLL.stopThreshold) {
        currentY = targetY;
        const rounded = Math.round(currentY);
        if (rounded !== lastRenderedY) window.scrollTo(0, rounded);
        lastRenderedY = rounded;
        stop();
        return;
      }

      const rounded = Math.round(currentY);
      if (Math.abs(rounded - lastRenderedY) >= SMOOTH_SCROLL.renderThreshold) {
        window.scrollTo(0, rounded);
        lastRenderedY = rounded;
      }

      animationFrame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (isRunning) return;
      isRunning = true;
      lastTime = 0;
      animationFrame = requestAnimationFrame(tick);
    };

    const animateTo = (destination: number) => {
      stop();
      updateMaxScroll();

      const from = window.scrollY;
      const to = clamp(destination);
      const distance = to - from;
      const startedAt = performance.now();
      isRunning = true;

      const step = (time: number) => {
        const progress = Math.min((time - startedAt) / SMOOTH_SCROLL.anchorDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const position = Math.round(from + distance * eased);
        window.scrollTo(0, position);
        lastRenderedY = position;

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
          return;
        }

        currentY = to;
        targetY = to;
        stop();
      };

      animationFrame = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (window.innerWidth < SMOOTH_SCROLL.mobileBreakpoint) return;
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (hasScrollableParent(event.target, event.deltaY)) return;

      event.preventDefault();

      if (!isRunning) {
        currentY = window.scrollY;
        targetY = window.scrollY;
        lastRenderedY = Math.round(window.scrollY);
        updateMaxScroll();
      }

      let delta = event.deltaY;
      if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 25;
      delta *= isTrackpad(event) ? SMOOTH_SCROLL.trackpadSpeed : SMOOTH_SCROLL.wheelSpeed;
      wheelDelta += delta;
      start();
    };

    const onNativeScroll = () => {
      if (isRunning) return;
      targetY = window.scrollY;
      currentY = window.scrollY;
      lastRenderedY = Math.round(window.scrollY);
    };

    const onAnchorClick = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
      if (!link || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      const url = new URL(link.href, window.location.href);
      if (!url.hash || url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;

      const id = decodeURIComponent(url.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      const header = document.querySelector<HTMLElement>("header");
      const headerPosition = header ? window.getComputedStyle(header).position : "";
      const offset = header && (headerPosition === "fixed" || headerPosition === "sticky") ? header.offsetHeight : 0;
      animateTo(window.scrollY + target.getBoundingClientRect().top - offset);
    };

    const onResize = () => {
      updateMaxScroll();
      if (window.innerWidth < SMOOTH_SCROLL.mobileBreakpoint) stop();
    };

    updateMaxScroll();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onNativeScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("click", onAnchorClick, true);

    const resizeObserver = new ResizeObserver(updateMaxScroll);
    resizeObserver.observe(root);

    return () => {
      stop();
      resizeObserver.disconnect();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onNativeScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("click", onAnchorClick, true);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  return null;
}
