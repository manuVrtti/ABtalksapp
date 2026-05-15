"use server";

import { auth } from "@/auth";
import { UserType } from "@prisma/client";
import { completeRegistration } from "@/features/registration/complete-registration";
import { registerPayloadSchema } from "@/lib/validations/register";

export async function completeRegistrationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, message: "Not authenticated" };
  }

  const rawSkills = formData.get("skills") as string;
  const skills = rawSkills
    ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const refRaw = formData.get("referralCode");
  const referralCode =
    typeof refRaw === "string"
      ? refRaw.trim().toUpperCase().slice(0, 6)
      : "";

  const yearRaw = formData.get("graduationYear");
  const graduationYear =
    typeof yearRaw === "string" && yearRaw.trim() !== ""
      ? Number.parseInt(yearRaw, 10)
      : Number(yearRaw);

  const userTypeRaw = formData.get("userType");
  const userType =
    typeof userTypeRaw === "string" &&
    userTypeRaw.trim().toUpperCase() === UserType.PROFESSIONAL
      ? UserType.PROFESSIONAL
      : UserType.STUDENT;

  const yearsExpRaw = formData.get("yearsExperience");
  const yearsExperience =
    typeof yearsExpRaw === "string" && yearsExpRaw.trim() !== ""
      ? Number.parseInt(yearsExpRaw, 10)
      : Number(yearsExpRaw);

  const fullNameRaw = formData.get("fullName");
  const fullName =
    typeof fullNameRaw === "string" ? fullNameRaw.trim() : fullNameRaw;

  const collegeRaw = formData.get("college");
  const college =
    typeof collegeRaw === "string" ? collegeRaw.trim() : collegeRaw;

  const organizationRaw = formData.get("organization");
  const organization =
    typeof organizationRaw === "string"
      ? organizationRaw.trim()
      : organizationRaw;

  const roleRaw = formData.get("role");
  const role = typeof roleRaw === "string" ? roleRaw.trim() : roleRaw;

  const parsed = registerPayloadSchema.safeParse({
    fullName,
    college,
    graduationYear: Number.isFinite(graduationYear) ? graduationYear : undefined,
    userType,
    organization,
    role,
    yearsExperience: Number.isFinite(yearsExperience) ? yearsExperience : undefined,
    domain: formData.get("domain"),
    skills,
    linkedinUrl: formData.get("linkedinUrl") || "",
    phone: String(formData.get("phone") ?? ""),
    githubUsername: formData.get("githubUsername") || "",
    referralCode,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const result = await completeRegistration(session.user.id, parsed.data);
  if (!result.ok) {
    return { ok: false as const, message: result.message };
  }

  return { ok: true as const };
}
