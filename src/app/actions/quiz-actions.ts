"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { submitQuiz, type SubmitQuizResult } from "@/features/quiz/submit-quiz";

const answerLetter = z.enum(["A", "B", "C", "D"]);

const submitQuizInputSchema = z.object({
  quizId: z.string().min(1),
  answers: z.record(z.string(), answerLetter),
});

export async function submitQuizAction(input: {
  quizId: string;
  answers: Record<string, "A" | "B" | "C" | "D">;
}): Promise<SubmitQuizResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "You must be signed in." };
  }

  const parsed = submitQuizInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  return submitQuiz({
    userId: session.user.id,
    quizId: parsed.data.quizId,
    answers: parsed.data.answers,
  });
}
