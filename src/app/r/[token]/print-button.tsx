import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrintButton({ token }: { token: string }) {
  return (
    <a
      href={`/r/${token}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "default" }),
        "print:hidden inline-flex items-center",
      )}
    >
      <Download className="mr-2 size-4" aria-hidden />
      Download PDF
    </a>
  );
}
