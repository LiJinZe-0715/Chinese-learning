import type { Lesson } from './curriculum';
export interface LearningSession {
  index: number;
  tab: 'learn' | 'quiz' | 'summary';
  choice: number | null;
  checked: boolean;
  completed: string[];
}
export type LearningAction =
  | { type: 'open'; index: number }
  | { type: 'show'; tab: 'learn' | 'quiz' }
  | { type: 'choose'; choice: number }
  | { type: 'check' | 'retry' | 'continue' | 'review' | 'previous' | 'next' };
export const initialSession: LearningSession = {
  index: 0,
  tab: 'learn',
  choice: null,
  checked: false,
  completed: [],
};

export function transitionSession(
  lessons: readonly Lesson[],
  session: LearningSession,
  action: LearningAction,
): LearningSession {
  const lesson = lessons[session.index];
  const open = (index: number) =>
    isLessonIndex(index, lessons.length)
      ? {
          ...session,
          index,
          tab: 'learn' as const,
          choice: null,
          checked: false,
        }
      : session;
  switch (action.type) {
    case 'open':
      return open(action.index);
    case 'previous':
      return open(session.index - 1);
    case 'next':
      return open(session.index + 1);
    case 'show':
      return { ...session, tab: action.tab };
    case 'choose':
      return !session.checked &&
        session.tab === 'quiz' &&
        isLessonIndex(action.choice, lesson.options.length)
        ? { ...session, choice: action.choice }
        : session;
    case 'check':
      if (session.tab !== 'quiz' || session.choice === null || session.checked)
        return session;
      return {
        ...session,
        checked: true,
        completed: gradeAnswer(lesson, session.choice, session.completed)
          .completed,
      };
    case 'retry':
      return session.checked && !gradeAnswer(lesson, session.choice).correct
        ? { ...session, choice: null, checked: false }
        : session;
    case 'continue':
      if (!session.checked || !gradeAnswer(lesson, session.choice).correct)
        return session;
      return session.index === lessons.length - 1
        ? { ...session, tab: 'summary' }
        : open(session.index + 1);
    case 'review':
      return open(
        Math.max(
          0,
          lessons.findIndex((item) => !session.completed.includes(item.id)),
        ),
      );
  }
}
export const isLessonIndex = (index: number, total: number) =>
  Number.isInteger(index) && index >= 0 && index < total;
export function gradeAnswer(
  lesson: Lesson,
  choice: number | null,
  completed: string[] = [],
) {
  const correct =
    choice !== null &&
    Number.isInteger(choice) &&
    choice >= 0 &&
    choice < lesson.options.length &&
    choice === lesson.answer;
  return {
    correct,
    completed:
      correct && !completed.includes(lesson.id)
        ? [...completed, lesson.id]
        : completed,
  };
}
