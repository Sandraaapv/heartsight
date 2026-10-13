export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[#EEF2EC] text-[#2F3E31] dark:bg-[#06080A] dark:text-[#E8EEF1] transition-colors">
      <div className="max-w-2xl w-full text-center space-y-6 p-8 rounded-2xl bg-[#FBFCFA] dark:bg-[#0D1115] border border-[#DDE5DA] dark:border-[#1C262D] shadow-sm">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-[#D5DFD1] text-[#2F3E31] dark:bg-[#131A1F] dark:text-[#22D3C5]">
          Track A: Cardiovascular Risk Visualization &amp; Prediction
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          HeartSight
        </h1>
        <p className="text-lg italic text-[#5E6B5F] dark:text-[#8A98A3]">
          Beat the odds.
        </p>
        <p className="text-sm leading-relaxed text-[#5E6B5F] dark:text-[#8A98A3]">
          Interactive 3D visualization and dual-prediction platform for coronary artery disease
          likelihood and 10-year ASCVD risk. Phase 0 scaffold initialized.
        </p>

        <div className="p-4 rounded-xl text-xs bg-[#E3EAE0] dark:bg-[#131A1F] text-[#5E6B5F] dark:text-[#8A98A3] border border-[#DDE5DA] dark:border-[#1C262D]">
          <span className="font-semibold text-[#2F3E31] dark:text-[#E8EEF1]">Educational Tool Disclaimer:</span> This application is developed for educational and exploration purposes only, not clinical diagnosis.
        </div>

        <div className="flex items-center justify-center gap-4 pt-4 text-xs font-mono text-[#5E6B5F] dark:text-[#8A98A3]">
          <span>Next.js App Router</span>
          <span>•</span>
          <span>R3F / Three.js</span>
          <span>•</span>
          <span>FastAPI</span>
        </div>
      </div>
    </main>
  );
}
