export interface Lesson {
  id: string;
  level: number;
  order: number;
  chapter: string;
  name: string;
  title: string;
  rule: string;
  explain: string;
  usage: string;
  sourceLabel: string;
  sourceNote?: string;
  sourcePage: number;
  pdfPage: number;
  zh: string;
  py: string;
  ja: string;
  question: string;
  options: string[];
  answer: number;
  feedback: string;
}
export interface Translation {
  zh: string;
  ja: string;
}
export interface QuestionExpression extends Translation {
  py: string;
  examplePy: string;
  example: string;
  note: string;
}
export interface CurriculumCatalog {
  lessons: Lesson[];
  glossary: Record<string, Translation[]>;
  questions: QuestionExpression[];
  metadata: { levels: string[]; syllabusPdf: string };
}
export const levelLabel = (level: number) =>
  level === 7 ? '7–9' : String(level);
export const normalize = (text: string) =>
  text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s、，。？！!?／/（）()—…+「」]/g, '');
export function findLessons(
  lessons: readonly Lesson[],
  glossary: Record<string, Translation[]>,
  query: string,
) {
  const search = normalize(query);
  if (!search) return [];
  return lessons.flatMap((lesson, index) => {
    const words = (glossary[lesson.id] ?? []).filter((word) =>
      normalize(word.zh + word.ja).includes(search),
    );
    return words.length ||
      normalize(
        [lesson.sourceLabel, lesson.explain, lesson.usage, lesson.zh, lesson.ja].join(' '),
      ).includes(search)
      ? [{ lesson, index, words }]
      : [];
  });
}
