export default function BackgroundGlow() {
  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-0 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-[#0A84FF]/15 blur-[150px]" />

      <div className="pointer-events-none fixed bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-white/5 blur-[140px]" />
    </>
  );
}
