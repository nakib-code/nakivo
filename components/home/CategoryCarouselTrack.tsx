"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";

interface CategoryCarouselTrackProps {
  children: ReactNode;
}

const DRAG_THRESHOLD_PX = 6;

export default function CategoryCarouselTrack({
  children,
}: CategoryCarouselTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isPointerDownRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const didDragRef = useRef(false);

  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const track = trackRef.current;
    if (!track || track.scrollWidth <= track.clientWidth) return;

    isPointerDownRef.current = true;
    didDragRef.current = false;
    startXRef.current = event.clientX;
    startScrollLeftRef.current = track.scrollLeft;
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const track = trackRef.current;
    if (!track) return;

    const deltaX = event.clientX - startXRef.current;

    if (!didDragRef.current && Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
      didDragRef.current = true;
      setIsDragging(true);
    }

    if (didDragRef.current) {
      event.preventDefault();
      track.scrollLeft = startScrollLeftRef.current - deltaX;
    }
  };

  const endDrag = () => {
    if (!isPointerDownRef.current) return;

    isPointerDownRef.current = false;
    setIsDragging(false);

    // Clear the drag flag after the browser's click event fires
    requestAnimationFrame(() => {
      didDragRef.current = false;
    });
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (didDragRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div
      ref={trackRef}
      role="list"
      aria-label="Product categories"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onClickCapture={handleClickCapture}
      onDragStart={(event) => event.preventDefault()}
      className={[
        "flex flex-nowrap overflow-x-auto overscroll-x-contain py-1",
        "gap-[var(--content-gap)]",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        isDragging
          ? "cursor-grabbing select-none snap-none"
          : "cursor-grab snap-x snap-mandatory",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
