import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  tech: z.string().trim().max(200).default(""),
  description: z.string().trim().max(600).default(""),
});

export const educationSchema = z.object({
  degree: z.string().trim().min(1).max(120),
  institution: z.string().trim().min(1).max(160),
  year: z.string().trim().max(20).default(""),
  score: z.string().trim().max(40).default(""),
});

export const skillGroupSchema = z.object({
  category: z.string().trim().min(1).max(60),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const certificationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  issuer: z.string().trim().max(120).default(""),
  year: z.string().trim().max(12).default(""),
});

export const experienceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  company: z.string().trim().max(120).default(""),
  location: z.string().trim().max(120).default(""),
  period: z.string().trim().max(60).default(""),
  bullets: z.array(z.string().trim().min(1).max(400)).max(8).default([]),
});

export const codingChallengeSchema = z.object({
  name: z.string().trim().min(1).max(160),
  status: z.string().trim().max(40).default(""),
  score: z.string().trim().max(40).default(""),
});

export const logisticsSchema = z.object({
  openToRelocation: z.string().trim().max(40).default(""),
  preferredLocations: z.string().trim().max(200).default(""),
  currentLocation: z.string().trim().max(120).default(""),
  availableFrom: z.string().trim().max(60).default(""),
  noticePeriod: z.string().trim().max(60).default(""),
  workAuthorization: z.string().trim().max(80).default(""),
  preferredWorkMode: z.string().trim().max(40).default(""),
});

export const compensationSchema = z.object({
  currentCtc: z.string().trim().max(60).default(""),
  expectedCtc: z.string().trim().max(60).default(""),
  negotiatedOffer: z.string().trim().max(60).default(""),
  equity: z.string().trim().max(60).default(""),
  benefitsRequired: z.string().trim().max(160).default(""),
  currencyPreference: z.string().trim().max(20).default(""),
});

export const projectsSchema = z.array(projectSchema).max(8).default([]);
export const educationListSchema = z.array(educationSchema).max(6).default([]);
export const skillGroupsSchema = z.array(skillGroupSchema).max(12).default([]);
export const certificationsListSchema = z
  .array(certificationSchema)
  .max(12)
  .default([]);
export const experienceListSchema = z.array(experienceSchema).max(8).default([]);
export const codingChallengesSchema = z
  .array(codingChallengeSchema)
  .max(12)
  .default([]);

export const achievementsSchema = z
  .array(z.string().trim().min(1).max(160))
  .max(12)
  .default([]);

export const languagesSpokenSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(12)
  .default([]);

export const areasForGrowthSchema = z
  .array(z.string().trim().min(1).max(160))
  .max(12)
  .default([]);

export const strengthsSchema = z
  .array(z.string().trim().min(1).max(160))
  .max(12)
  .default([]);

export const scoreSchema = z.coerce.number().int().min(0).max(100);

export const recommendationSchema = z.enum([
  "STRONGLY_RECOMMEND",
  "RECOMMEND",
  "NEUTRAL",
  "DO_NOT_RECOMMEND",
]);

export type Project = z.infer<typeof projectSchema>;
export type Education = z.infer<typeof educationSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type CodingChallenge = z.infer<typeof codingChallengeSchema>;
export type Logistics = z.infer<typeof logisticsSchema>;
export type Compensation = z.infer<typeof compensationSchema>;
export type RecommendationLevel = z.infer<typeof recommendationSchema>;

const emptyLogistics = logisticsSchema.parse({});
const emptyCompensation = compensationSchema.parse({});

export function parseProjects(value: unknown): Project[] {
  const r = projectsSchema.safeParse(value);
  return r.success ? r.data : [];
}

export function parseEducation(value: unknown): Education[] {
  const r = educationListSchema.safeParse(value);
  return r.success ? r.data : [];
}

export function parseSkillGroups(value: unknown): SkillGroup[] {
  const r = skillGroupsSchema.safeParse(value);
  return r.success ? r.data : [];
}

export function parseCertifications(value: unknown): Certification[] {
  const r = certificationsListSchema.safeParse(value);
  return r.success ? r.data : [];
}

export function parseExperience(value: unknown): Experience[] {
  const r = experienceListSchema.safeParse(value);
  return r.success ? r.data : [];
}

export function parseCodingChallenges(value: unknown): CodingChallenge[] {
  const r = codingChallengesSchema.safeParse(value);
  return r.success ? r.data : [];
}

export function parseLogistics(value: unknown): Logistics {
  const r = logisticsSchema.safeParse(value);
  return r.success ? r.data : emptyLogistics;
}

export function parseCompensation(value: unknown): Compensation {
  const r = compensationSchema.safeParse(value);
  return r.success ? r.data : emptyCompensation;
}
