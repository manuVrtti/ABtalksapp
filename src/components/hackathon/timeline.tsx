import { HACKATHON } from "@/components/hackathon/hackathon-config";

function TimelineNode({ index, size }: { index: number; size: "sm" | "lg" }) {
  const isLg = size === "lg";
  return (
    <span
      className={
        isLg
          ? "relative z-10 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#1E1B37] shadow-[0_4px_10px_rgba(0,0,0,0.1),4px_0_10px_rgba(0,0,0,0.1),-4px_0_10px_rgba(0,0,0,0.1)]"
          : "absolute -left-[2.35rem] top-0 flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#1E1B37] shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
      }
      style={{
        background:
          "radial-gradient(circle at 50% 50%, rgba(118, 74, 194, 1) 0%, rgba(62, 34, 111, 1) 50%, rgba(0, 0, 0, 1) 100%)",
      }}
      aria-hidden
    >
      <span
        className={
          isLg
            ? "block text-[22px] font-semibold leading-none text-white"
            : "block text-[16px] font-semibold leading-none text-white"
        }
        style={{ fontFamily: "var(--font-hackathon-mono), monospace" }}
      >
        {index + 1}
      </span>
    </span>
  );
}

export function Timeline() {
  return (
    <section className="mx-auto w-full max-w-[1897px] px-4 py-16 sm:px-9 sm:py-24">
      <h2
        className="bg-gradient-to-r from-white from-[75%] to-[#A2A2A2] bg-clip-text text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight text-transparent"
        style={{ fontFamily: "var(--font-hackathon-mono), monospace" }}
      >
        Timeline
      </h2>
      <p className="mt-3 max-w-3xl text-[clamp(1rem,2vw,1.25rem)] tracking-[0.02em] text-[#BCBCBC]">
        {HACKATHON.kickoffLabel} through {HACKATHON.resultsLabel}.
      </p>

      {/* Mobile: vertical */}
      <ol className="relative mt-12 space-y-10 border-l border-dashed border-[#7364E6] pl-8 md:hidden">
        {HACKATHON.timeline.map((item, index) => (
          <li key={item.title} className="relative">
            <TimelineNode index={index} size="sm" />
            <h3 className="text-[20px] font-semibold text-[#968BEC] underline">
              {item.title}
            </h3>
            <p className="mt-2 text-[16px] text-[#E9E9E9]">{item.body}</p>
          </li>
        ))}
      </ol>

      {/* Desktop: horizontal */}
      <div className="relative mt-16 hidden md:block">
        <div
          className="absolute left-[12%] right-[12%] top-8 border-t border-dashed border-[#7364E6]"
          aria-hidden
        />
        <ol className="relative grid grid-cols-4 gap-4">
          {HACKATHON.timeline.map((item, index) => (
            <li
              key={item.title}
              className="flex flex-col items-center text-center"
            >
              <TimelineNode index={index} size="lg" />
              <h3 className="mt-5 text-[clamp(1rem,1.5vw,1.75rem)] font-semibold text-[#968BEC] underline">
                {item.title}
              </h3>
              <p className="mt-3 max-w-[289px] text-[16px] text-[#E9E9E9]">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
