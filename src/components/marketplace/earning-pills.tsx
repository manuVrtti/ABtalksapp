import {
  CheckCircle2,
  GitBranch,
  Share2,
  Users,
} from "lucide-react";
import {
  SYNERGY_BASE_SUBMISSION,
  SYNERGY_PROOF_GITHUB,
  SYNERGY_PROOF_LINKEDIN,
  SYNERGY_REFERRAL,
} from "@/features/synergy/scoring";

const pills = [
  {
    label: "Complete Task",
    Icon: CheckCircle2,
    points: SYNERGY_BASE_SUBMISSION,
  },
  {
    label: "Refer a Friend",
    Icon: Users,
    points: SYNERGY_REFERRAL,
  },
  {
    label: "Share on LinkedIn",
    Icon: Share2,
    points: SYNERGY_PROOF_LINKEDIN,
  },
  {
    label: "Contribute on GitHub",
    Icon: GitBranch,
    points: SYNERGY_PROOF_GITHUB,
  },
] as const;

export function EarningPills() {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-2.5">
      {pills.map(({ label, Icon, points }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0B1228] px-3.5 py-2 text-xs text-zinc-100 sm:text-sm"
        >
          <Icon className="size-4 text-[#7364E6]" aria-hidden />
          <span className="whitespace-nowrap">{label}</span>
          <span className="whitespace-nowrap font-semibold text-[#7364E6]">
            +{points} SP
          </span>
        </div>
      ))}
    </div>
  );
}
