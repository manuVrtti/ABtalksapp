import { z } from "zod";
import { optionalPhoneSchema } from "./phone";

const githubUsernameRegex = /^[a-zA-Z0-9-]{1,39}$/;
const githubRepoRegex =
  /^https:\/\/github\.com\/([a-zA-Z0-9-]{1,39})\/([a-zA-Z0-9._-]{1,100})\/?$/;

export const applyProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required").max(120),
    jobRole: z.string().trim().min(1, "Current role is required").max(120),
    company: z.string().trim().min(1, "Company is required").max(120),
    yearsExperience: z.coerce
      .number({ error: "Enter your years of experience" })
      .int("Enter a whole number")
      .min(0, "Cannot be negative")
      .max(40, "Max 40 years"),
    education: z.string().trim().max(160).optional().or(z.literal("")),
    university: z.string().trim().max(160).optional().or(z.literal("")),
    graduationYear: z
      .union([
        z.literal(""),
        z.coerce.number().int().min(1950, "Invalid year").max(2035, "Invalid year"),
      ])
      .optional(),
    skills: z
      .array(z.string().trim().min(1).max(40))
      .min(1, "Add at least one skill")
      .max(8, "Max 8 skills"),
    linkedinUrl: z
      .string()
      .trim()
      .url("Enter a valid URL")
      .refine((v) => /linkedin\.com/i.test(v), "Enter your LinkedIn profile URL"),
    resumeUrl: z
      .union([z.literal(""), z.string().trim().url("Enter a valid URL")])
      .optional(),
    phone: optionalPhoneSchema,
    githubUsername: z
      .string()
      .trim()
      .regex(githubUsernameRegex, "Enter a valid GitHub username"),
    githubRepoUrl: z
      .string()
      .trim()
      .regex(
        githubRepoRegex,
        "Enter a public repo URL like https://github.com/owner/repo",
      ),
  })
  .refine(
    (data) => {
      const match = data.githubRepoUrl.match(githubRepoRegex);
      if (!match) return false;
      return match[1]!.toLowerCase() === data.githubUsername.toLowerCase();
    },
    {
      path: ["githubRepoUrl"],
      message: "The repo owner must match your GitHub username",
    },
  );

export type ApplyProfileInput = z.infer<typeof applyProfileSchema>;

export const entrySubmitSchema = z.object({
  attemptId: z.string().cuid(),
  answers: z
    .array(z.number().int().min(0).max(3).nullable())
    .length(20, "Expected 20 answers"),
});

export type EntrySubmitInput = z.infer<typeof entrySubmitSchema>;
