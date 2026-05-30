"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampusAmbassadorModal } from "./campus-ambassador-modal";

export function CampusAmbassadorBanner() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="border-b bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2 md:px-6">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Users className="h-4 w-4 shrink-0 text-violet-500" />
            <p className="text-sm font-medium truncate">
              <span className="hidden sm:inline">
                Want to be a campus ambassador for your college?
              </span>
              <span className="sm:hidden">Become a campus ambassador</span>
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="shrink-0 h-7 text-xs gap-1.5 border-violet-500/30 hover:bg-violet-500/10"
          >
            <span className="hidden sm:inline">Learn More</span>
            <span className="sm:hidden">Learn</span>
          </Button>
        </div>
      </div>

      <CampusAmbassadorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
