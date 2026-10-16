import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { Button } from './controls';
import type { Lesson } from '../domain/curriculum';
export function LessonQuiz({
  lesson,
  choice,
  checked,
  correct,
  nextLabel,
  setChoice,
  check,
  retry,
  continueLearning,
  onLearn,
}: {
  lesson: Lesson;
  choice: number | null;
  checked: boolean;
  correct: boolean;
  nextLabel: string;
  setChoice: (choice: number) => void;
  check: () => void;
  retry: () => void;
  continueLearning: () => void;
  onLearn: () => void;
}) {
  return (
    <article className="quiz">
      <small className="kicker">LET&apos;S PRACTICE · 1 QUESTION</small>
      <h2>{lesson.question}</h2>
      <div className="quiz-sentence">
        <p lang="zh-CN">{lesson.zh}</p>
        <small lang="zh-Latn">{lesson.py}</small>
      </div>
      <fieldset disabled={checked}>
        <legend className="sr-only">答えを選択</legend>
        {lesson.options.map((option, i) => (
          <label
            key={option}
            className={`answer ${choice === i ? 'chosen' : ''} ${checked && i === lesson.answer ? 'correct' : ''} ${checked && choice === i && !correct ? 'wrong' : ''}`}
          >
            <input
              type="radio"
              name="answer"
              value={i}
              checked={choice === i}
              onChange={() => setChoice(i)}
            />
            <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
            <span>{option}</span>
            {checked && i === lesson.answer && <Check size={20} />}
          </label>
        ))}
      </fieldset>
      {checked && (
        <output className={`feedback ${correct ? 'success' : 'retry'}`}>
          <strong>
            {correct
              ? '正解です！ 文法と使い分けを確認できました。'
              : '答えの根拠を確認して、もう一度考えてみましょう。'}
          </strong>
          <p>正解：{lesson.options[lesson.answer]}</p>
          <p>{lesson.feedback}</p>
        </output>
      )}
      <div className="quiz-actions">
        {!checked ? (
          <Button
            className="primary"
            disabled={choice === null}
            onClick={check}
          >
            答えを確認する <Check />
          </Button>
        ) : correct ? (
          <Button className="primary" onClick={continueLearning}>
            {nextLabel} <ArrowRight />
          </Button>
        ) : (
          <Button className="primary" onClick={retry}>
            もう一度挑戦する <RotateCcw />
          </Button>
        )}
        <Button variant="ghost" onClick={onLearn}>
          解説に戻る
        </Button>
      </div>
    </article>
  );
}
