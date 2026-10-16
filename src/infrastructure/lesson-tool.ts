import type { Lesson } from '../domain/curriculum';
import { levelLabel } from '../domain/curriculum';
export interface ModelContext {
  registerTool: (tool: unknown, options: unknown) => void;
}
export function registerLessonTool(
  context: ModelContext | undefined,
  lessons: readonly Lesson[],
  openLesson: (index: number) => void,
) {
  const total = lessons.length;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  try {
    Promise.resolve(
      context.registerTool(
        {
          name: 'open_grammar_lesson',
          title: '文法レッスンを開く',
          description: `Open one of ${total} grammar lessons in official syllabus order. Navigation only; does not complete a lesson.`,
          inputSchema: {
            type: 'object',
            properties: {
              lessonNumber: { type: 'integer', minimum: 1, maximum: total },
            },
            required: ['lessonNumber'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: async (input: unknown) => {
            const n = (input as { lessonNumber?: number })?.lessonNumber;
            if (
              typeof n !== 'number' ||
              !Number.isInteger(n) ||
              n < 1 ||
              n > total
            )
              throw new Error(
                `lessonNumber must be an integer from 1 to ${total}`,
              );
            openLesson(n - 1);
            await new Promise((resolve) => setTimeout(resolve, 0));
            return {
              lessonNumber: n,
              title: lessons[n - 1].title,
              level: levelLabel(lessons[n - 1].level),
              sourcePage: lessons[n - 1].sourcePage,
              view: 'learn',
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch {}
  return () => lifecycle.abort();
}
