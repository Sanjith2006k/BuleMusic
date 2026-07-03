"use client";

export default function SongCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="h-56 rounded-2xl bg-white/10" />

      <div className="mt-4 h-5 w-40 rounded bg-white/10" />

      <div className="mt-3 h-4 w-24 rounded bg-white/10" />
    </div>
  );
}
