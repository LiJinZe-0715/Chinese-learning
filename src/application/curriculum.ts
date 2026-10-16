import { findLessons, normalize } from '../domain/curriculum.ts';
import type { CurriculumCatalog } from '../domain/curriculum.ts';
export function createCurriculumApplication({
  lessons,
  glossary,
  questions,
  metadata,
}: CurriculumCatalog) {
  return {
    lessons,
    glossary,
    questions,
    levels: metadata.levels,
    syllabusPdf: metadata.syllabusPdf,
    levelLessons: (level: number) =>
      lessons.filter((lesson) => lesson.level === level),
    firstLessonIndex: (level: number) =>
      lessons.findIndex((lesson) => lesson.level === level),
    searchCurriculum(query: string) {
      const search = normalize(query);
      return {
        search,
        matches: findLessons(lessons, glossary, query),
        questionMatches: questions.filter(
          (question) =>
            !search ||
            normalize(Object.values(question).join(' ')).includes(search),
        ),
      };
    },
  };
}
