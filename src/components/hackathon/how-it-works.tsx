import Image from "next/image";

const CARDS = [
  { src: "/hackathon/how-1.png", alt: "Step 1 — Register" },
  { src: "/hackathon/how-2.png", alt: "Step 2 — Join WhatsApp" },
  { src: "/hackathon/how-3.png", alt: "Step 3 — Build for 48 hours" },
  { src: "/hackathon/how-4.png", alt: "Step 4 — Submit before the deadline" },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-[1897px] px-4 py-16 sm:px-9 sm:py-24"
    >
      <h2
        className="bg-gradient-to-r from-white from-[75%] to-[#A2A2A2] bg-clip-text text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight text-transparent"
        style={{ fontFamily: "var(--font-hackathon-mono), monospace" }}
      >
        How it works
      </h2>
      <p className="mt-3 text-[clamp(1rem,2vw,1.25rem)] tracking-[0.02em] text-[#BCBCBC]">
        Four steps from signup to submit.
      </p>

      <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {CARDS.map((card) => (
          <li key={card.src} className="flex justify-center">
            <Image
              src={card.src}
              alt={card.alt}
              width={260}
              height={320}
              className="h-auto w-full max-w-[240px] object-contain sm:max-w-[260px]"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
