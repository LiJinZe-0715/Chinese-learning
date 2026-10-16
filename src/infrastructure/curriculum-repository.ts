import curriculum from '../data/curriculum.json';
import glossaryData from '../data/glossary.json';
export { default as metadata } from '../data/metadata.json';
import questionData from '../data/questions.json';
import type {
  Lesson,
  Translation,
  QuestionExpression,
} from '../domain/curriculum';
export const lessons: Lesson[] = curriculum;
export const glossary: Record<string, Translation[]> = glossaryData;
export const questions: QuestionExpression[] = questionData;
