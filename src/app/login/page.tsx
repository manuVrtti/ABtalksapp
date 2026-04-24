import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { setReferralCookie } from "@/app/actions/referral-actions";
import { LoginClient } from "./login-client";

type Props = {
  searchParams: Promise<{ from?: string; ref?: string }>;
};

function resolveRedirectTo(from: string | undefined) {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return "/dashboard";
  }
  return from;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const redirectTo = resolveRedirectTo(params.from);
  const refRaw = params.ref;
  const normalizedRef =
    typeof refRaw === "string"
      ? refRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
      : "";
  if (normalizedRef && /^[A-Z0-9]{6}$/.test(normalizedRef)) {
    await setReferralCookie(normalizedRef);
  }
  const referralRef =
    typeof params.ref === "string" && params.ref.trim() !== ""
      ? params.ref.trim()
      : undefined;

  const showGoogle = Boolean(process.env.AUTH_GOOGLE_ID);
  const showDev = process.env.ENABLE_DEV_AUTH === "true";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            ABtalks
          </CardTitle>
          <CardDescription>60 Days Challenge Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginClient
            showGoogle={showGoogle}
            showDev={showDev}
            redirectTo={redirectTo}
            referralRef={referralRef}
          />
        </CardContent>
      </Card>
    </div>
  );
}
