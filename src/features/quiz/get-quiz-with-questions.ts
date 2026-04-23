import { EnrollmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type QuizQuestionPublic = {
  id: string;
  questionOrder: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: string;
  explanation?: string;
};

export type QuizWithQuestionsPayload = {
  quiz: {
    id: string;
    weekNumber: number;
    title: string;
    domain: string;
  };
  questions: QuizQuestionPublic[];
  existingAttempt: {
    id: string;
    score: number;
    answers: Record<string, string>;
    attemptedAt: Date;
  } | null;
};

export async function getQuizWithQuestions(
  quizId: string,
  userId: string,
): Promise<QuizWithQuestionsPayload | null> {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId },
    select: {
      id: true,
      weekNumber: true,
      title: true,
      domain: true,
      challengeId: true,
    },
  });

  if (!quiz) {
    return null;
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
    return null;
  }

  const rows = await prisma.quizQuestion.findMany({
    where: { quizId },
    orderBy: { questionOrder: "asc" },
  });

  const existingAttempt = await prisma.quizAttempt.findUnique({
    where: {
      userId_quizId: { userId, quizId },
    },
    select: {
      id: true,
      score: true,
      answers: true,
      attemptedAt: true,
    },
  });

  const revealSolutions = existingAttempt !== null;

  const questions: QuizQuestionPublic[] = rows.map((q) => ({
    id: q.id,
    questionOrder: q.questionOrder,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    ...(revealSolutions
      ? { correctAnswer: q.correctAnswer, explanation: q.explanation }
      : {}),
  }));

  return {
    quiz: {
      id: quiz.id,
      weekNumber: quiz.weekNumber,
      title: quiz.title,
      domain: quiz.domain,
    },
    questions,
    existingAttempt: existingAttempt
      ? {
          id: existingAttempt.id,
          score: existingAttempt.score,
          answers: existingAttempt.answers as Record<string, string>,
          attemptedAt: existingAttempt.attemptedAt,
        }
      : null,
  };
}
