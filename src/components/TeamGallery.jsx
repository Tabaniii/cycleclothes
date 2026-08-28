'use client';

import { useRef } from 'react';
import { TEAM_MEMBERS } from '@/data/team';

export default function TeamGallery() {
  const scrollerRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0 });

  function onPointerDown(event) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };
    scroller.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const scroller = scrollerRef.current;
    if (!scroller || !dragRef.current.active) return;
    const delta = event.clientX - dragRef.current.startX;
    scroller.scrollLeft = dragRef.current.scrollLeft - delta;
  }

  function onPointerUp(event) {
    const scroller = scrollerRef.current;
    dragRef.current.active = false;
    if (scroller?.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="flex gap-4 overflow-x-auto px-6 pb-10 sm:gap-5 sm:px-8 lg:px-12 scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TEAM_MEMBERS.map((member) => (
        <article
          key={member.name}
          className="w-[min(78vw,280px)] shrink-0 snap-center overflow-hidden rounded-2xl bg-white shadow-sm border border-brand-cream-dark/25 select-none"
        >
          <div className="aspect-[3/4] bg-brand-cream">
            {member.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.image}
                alt={member.name}
                draggable={false}
                className="h-full w-full object-cover pointer-events-none"
              />
            ) : null}
          </div>
          <div className="px-4 py-4">
            <h3 className="text-base font-bold text-brand-green leading-snug">{member.name}</h3>
            <p className="mt-1 text-sm font-medium text-brand-green/70">{member.role}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
