import { ArrowRight, Lightbulb, ExternalLink } from 'lucide-react';
import { Button } from './controls';
import type { Lesson, Translation } from '../domain/curriculum';
export function LessonStudy({
  lesson,
  words,
  syllabusPdf,
  onPractice,
}: {
  lesson: Lesson;
  words: Translation[];
  syllabusPdf: string;
  onPractice: () => void;
}) {
  return (
    <article key={lesson.id}>
      <small className="kicker">GRAMMAR NOTE</small>
      <div className="source-pattern">
        <small>この課で扱う文法</small>
        <p lang="zh-CN">{lesson.sourceLabel}</p>
        {lesson.sourceNote && <small>{lesson.sourceNote}</small>}
      </div>
      {words.length > 0 && (
        <section className="lesson-translations" aria-label="語句と日本語の対応">
          <h2>語句と日本語の対応</h2>
          <dl>
            {words.map((word, i) => (
              <div key={i}>
                <dt lang="zh-CN">{word.zh}</dt>
                <dd lang="ja">{word.ja}</dd>
              </div>
            ))}
          </dl>
          <p className="dictionary-hint">
            訳語はこの用法での目安です。同じ字でも文脈で意味が変わり、日本語と一対一に対応するとは限りません。
          </p>
        </section>
      )}
      <h2>使い方を理解しよう。</h2>
      <p className="explanation">{lesson.explain}</p>
      <div className="example full-example">
        <small>中国語</small>
        <p>
          <span className="chinese" lang="zh-CN">
            {lesson.zh}
          </span>
          <span lang="zh-Latn">{lesson.py}</span>
        </p>
        <small>日本語</small>
        <p>{lesson.ja}</p>
      </div>
      <div className="tip">
        <Lightbulb size={21} />
        <div>
          <strong>使い分け・間違えやすい点</strong>
          <p>{lesson.usage}</p>
        </div>
      </div>
      <div className="article-actions">
        <Button className="primary" onClick={onPractice}>
          練習してみる <ArrowRight />
        </Button>
        <a
          className="source-link"
          href={`${syllabusPdf}#page=${lesson.pdfPage}`}
          target="_blank"
          rel="noreferrer"
        >
          大綱 p.{lesson.sourcePage} <ExternalLink size={13} />
        </a>
      </div>
    </article>
  );
}
