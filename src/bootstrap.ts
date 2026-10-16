import { registerLessonTool } from './infrastructure/lesson-tool';
import type { ModelContext } from './infrastructure/lesson-tool';
export type { ModelContext } from './infrastructure/lesson-tool';
import { createCurriculumApplication } from './application/curriculum';
import * as catalog from './infrastructure/curriculum-repository';
import { createLearningApplication } from './application/learning';
export const learningApplication = createLearningApplication(catalog.lessons);
export const {
  lessons,
  glossary,
  questions,
  levels,
  syllabusPdf,
  levelLessons,
  firstLessonIndex,
  searchCurriculum,
} = createCurriculumApplication(catalog);

export const registerBrowserLessonTool = (
  context: ModelContext | undefined,
  openLesson: (index: number) => void,
) => registerLessonTool(context, catalog.lessons, openLesson);
