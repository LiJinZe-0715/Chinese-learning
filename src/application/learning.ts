import type { Lesson } from '../domain/curriculum.ts';
import { gradeAnswer, transitionSession } from '../domain/learning.ts';
import type { LearningSession, LearningAction } from '../domain/learning.ts';

export function createLearningApplication(lessons: readonly Lesson[]) {
  if (!lessons.length) throw new Error('The curriculum must contain lessons');
  return {
    transition: (session: LearningSession, action: LearningAction) =>
      transitionSession(lessons, session, action),
    view(session: LearningSession) {
      const lesson = lessons[session.index];
      const course = lessons.flatMap((item, index) =>
        item.level === lesson.level
          ? [{ ...item, index, completed: session.completed.includes(item.id) }]
          : [],
      );
      const next = lessons[session.index + 1];
      return {
        lesson,
        course,
        level: lesson.level,
        total: lessons.length,
        courseCompleted: course.filter((item) => item.completed).length,
        correct: gradeAnswer(lesson, session.choice).correct,
        nextStep: !next
          ? ('summary' as const)
          : next.level === lesson.level
            ? ('lesson' as const)
            : ('level' as const),
      };
    },
  };
}
