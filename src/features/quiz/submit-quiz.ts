import type { Prisma } from "@prisma/client";
import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type QuizSubmitResultRow = {
  questionId: string;
  userAnswer: "A" | "B" | "C" | "D";
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
};

export type SubmitQuizOk = {
  ok: true;
  score: number;
  results: QuizSubmitResultRow[];
};

export type SubmitQuizErr = {
  ok: false;
  message: string;
};

export type SubmitQuizResult = SubmitQuizOk | SubmitQuizErr;

export async function submitQuiz(input: {
  userId: string;
  quizId: string;
  answers: Record<string, "A" | "B" | "C" | "D">;
}): Promise<SubmitQuizResult> {
  const { userId, quizId, answers } = input;

  const existing = await prisma.quizAttempt.findUnique({
    where: {
      userId_quizId: { userId, quizId },
    },
    select: { id: true },
  });

  if (existing) {
    return { ok: false, message: "Quiz already submitted" };
  }

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId },
    select: { challengeId: true, domain: true },
  });

  if (!quiz) {
    return { ok: false, message: "Quiz not found" };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      challengeId: quiz.challengeId,
      domain: quiz.domain,
      status: { not: EnrollmentStatus.ABANDONED },
    },
    select: { id: true },
  });

  if (!enrollment) {
    return { ok: false, message: "No enrollment for this quiz" };
  }

  const questions = await prisma.quizQuestion.findMany({
    where: { quizId },
    orderBy: { questionOrder: "asc" },
  });

  if (questions.length === 0) {
    return { ok: false, message: "Quiz has no questions" };
  }

  for (const q of questions) {
    const a = answers[q.id];
    if (!a || !["A", "B", "C", "D"].includes(a)) {
      return { ok: false, message: "Missing or invalid answer for a question" };
    }
  }

  let score = 0;
  const results: QuizSubmitResultRow[] = questions.map((q) => {
    const userAnswer = answers[q.id]!;
    const isCorrect = userAnswer === q.correctAnswer;
    if (isCorrect) score += 1;
    return {
      questionId: q.id,
      userAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
    };
  });

  await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score,
      answers: answers as Prisma.InputJsonValue,
    },
  });

  return { ok: true, score, results };
}
