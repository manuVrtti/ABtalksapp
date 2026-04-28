import { prisma } from "@/lib/db";

export async function getContent() {
  const [problems, quizzes] = await Promise.all([
    prisma.dailyTask.findMany({
      orderBy: [{ domain: "asc" }, { dayNumber: "asc" }],
      select: {
        id: true,
        domain: true,
        dayNumber: true,
        title: true,
        difficulty: true,
        estimatedMinutes: true,
        problemStatement: true,
        learningObjectives: true,
        resources: true,
        linkedinTemplate: true,
        tags: true,
      },
    }),
    prisma.quiz.findMany({
      orderBy: [{ domain: "asc" }, { weekNumber: "asc" }],
      select: {
        id: true,
        domain: true,
        weekNumber: true,
        title: true,
        quizQuestions: {
          orderBy: { questionOrder: "asc" },
          select: {
            id: true,
            questionOrder: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            correctAnswer: true,
            explanation: true,
          },
        },
      },
    }),
  ]);

  return { problems, quizzes };
}
