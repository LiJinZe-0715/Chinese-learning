import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { findLessons, normalize } from '../src/domain/curriculum.ts';
import type { Lesson } from '../src/domain/curriculum.ts';
import { gradeAnswer, isLessonIndex } from '../src/domain/learning.ts';
import { createCurriculumApplication } from '../src/application/curriculum.ts';
import type { QuestionExpression } from '../src/domain/curriculum.ts';
import { createLearningApplication } from '../src/application/learning.ts';
import { initialSession } from '../src/domain/learning.ts';

const lessons: Lesson[] = JSON.parse(
  readFileSync(new URL('../src/data/curriculum.json', import.meta.url), 'utf8'),
);
const glossary = JSON.parse(
  readFileSync(new URL('../src/data/glossary.json', import.meta.url), 'utf8'),
);
const questions: QuestionExpression[] = JSON.parse(
  readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'),
);
const metadata = JSON.parse(
  readFileSync(new URL('../src/data/metadata.json', import.meta.url), 'utf8'),
);
const app = createCurriculumApplication({
  lessons,
  glossary,
  questions,
  metadata,
});

const learning = createLearningApplication(lessons);

test('quiz lifecycle handles empty answers, wrong retry, completion and locked answers', () => {
  let state = learning.transition(initialSession, {
    type: 'show',
    tab: 'quiz',
  });
  assert.equal(learning.transition(state, { type: 'check' }), state);
  assert.equal(learning.transition(state, { type: 'continue' }), state);
  for (const choice of [-1, NaN, 0.5, lessons[0].options.length]) {
    assert.equal(learning.transition(state, { type: 'choose', choice }), state);
  }
  state = learning.transition(state, {
    type: 'choose',
    choice: (lessons[0].answer + 1) % 3,
  });
  state = learning.transition(state, { type: 'check' });
  assert.deepEqual(state.completed, []);
  assert.equal(learning.transition(state, { type: 'continue' }), state);
  assert.equal(
    learning.transition(state, { type: 'choose', choice: lessons[0].answer }),
    state,
  );
  state = learning.transition(state, { type: 'retry' });
  assert.equal(state.choice, null);
  assert.equal(state.checked, false);
  state = learning.transition(state, {
    type: 'choose',
    choice: lessons[0].answer,
  });
  state = learning.transition(state, { type: 'check' });
  assert.deepEqual(state.completed, [lessons[0].id]);
  assert.equal(learning.view(state).courseCompleted, 1);
  assert.equal(learning.transition(state, { type: 'check' }), state);
  assert.equal(learning.transition(state, { type: 'retry' }), state);
  state = learning.transition(state, { type: 'continue' });
  assert.equal(state.index, 1);
  assert.equal(state.tab, 'learn');
  assert.equal(state.choice, null);
  assert.equal(state.checked, false);
  assert.deepEqual(
    initialSession.completed,
    [],
    'The initial session must remain immutable',
  );
});

test('course boundaries, final summary and review are business use cases', () => {
  let state = learning.transition(initialSession, { type: 'open', index: 69 });
  assert.equal(learning.view(state).nextStep, 'level');
  state = learning.transition(state, { type: 'next' });
  assert.equal(state.index, 70);
  assert.equal(learning.view(state).level, 2);
  state = learning.transition(state, { type: 'open', index: 592 });
  assert.equal(learning.transition(state, { type: 'next' }), state);
  for (const index of [-1, 593, NaN, 0.5])
    assert.equal(learning.transition(state, { type: 'open', index }), state);
  state = learning.transition(state, { type: 'show', tab: 'quiz' });
  state = learning.transition(state, {
    type: 'choose',
    choice: lessons[592].answer,
  });
  state = learning.transition(state, { type: 'check' });
  state = learning.transition(state, { type: 'continue' });
  assert.equal(state.tab, 'summary');
  assert.equal(state.index, 592);
  assert.deepEqual(state.completed, [lessons[592].id]);
  state = learning.transition(
    { ...state, completed: [lessons[0].id] },
    { type: 'review' },
  );
  assert.equal(state.index, 1, 'Review selects the first unfinished lesson');
  state = learning.transition(
    { ...state, completed: lessons.map((l) => l.id) },
    { type: 'review' },
  );
  assert.equal(
    state.index,
    0,
    'After completing everything, review starts from the beginning',
  );
  assert.equal(learning.transition(state, { type: 'previous' }), state);
  assert.throws(() => createLearningApplication([]), /contain lessons/);
});

test('all 593 lessons can be completed in order without losing progress', () => {
  let state = initialSession;
  for (let index = 0; index < lessons.length; index++) {
    assert.equal(state.index, index);
    state = learning.transition(state, { type: 'show', tab: 'quiz' });
    state = learning.transition(state, {
      type: 'choose',
      choice: lessons[index].answer,
    });
    state = learning.transition(state, { type: 'check' });
    assert.equal(state.completed.length, index + 1);
    state = learning.transition(state, { type: 'continue' });
  }
  assert.equal(state.tab, 'summary');
  assert.deepEqual(
    state.completed,
    lessons.map((lesson) => lesson.id),
  );
  assert.equal(learning.view(state).courseCompleted, 134);
});

test('search supports Chinese, Japanese and full-width forms across all levels', () => {
  assert.equal(normalize(' ＡＢＣ（？） '), 'abc');
  assert.equal(findLessons(lessons, glossary, '  ').length, 0);
  for (const query of ['谁', '誰', '公斤'])
    assert(app.searchCurriculum(query).matches.length > 0, query);
  assert(app.searchCurriculum('どなた').questionMatches.length > 0);
  const match = app
    .searchCurriculum('公斤')
    .matches.find((result) => result.words.some((word) => word.zh === '公斤'));
  assert(match);
  assert.equal(lessons[match.index].id, match.lesson.id);
  assert(app.searchCurriculum('此词并未收录abcd').matches.length === 0);
});

test('navigation crosses levels and rejects invalid indices', () => {
  assert.equal(app.firstLessonIndex(2), 70);
  assert.equal(app.levelLessons(7).length, 134);
  for (const index of [-1, 593, 0.5, NaN, Infinity])
    assert.equal(isLessonIndex(index, lessons.length), false);
  assert(isLessonIndex(0, lessons.length));
  assert(isLessonIndex(592, lessons.length));
});

test('only correct answers complete a lesson and repeated answers are idempotent', () => {
  const lesson = lessons[0];
  for (const choice of [null, -1, 0.5, NaN, 3, (lesson.answer + 1) % 3]) {
    assert.deepEqual(gradeAnswer(lesson, choice), {
      correct: false,
      completed: [],
    });
  }
  const result = gradeAnswer(lesson, lesson.answer);
  assert.equal(result.correct, true);
  assert.deepEqual(result.completed, [lesson.id]);
  assert.deepEqual(
    gradeAnswer(lesson, lesson.answer, result.completed),
    result,
  );
});

test('layer dependencies keep business independent and UI away from data files', () => {
  const forbidden: Record<string, RegExp> = {
    domain: /react|application|presentation|infrastructure|\/data\//,
    application: /react|presentation|infrastructure|\/data\//,
    infrastructure: /react|presentation|application/,
    presentation: /infrastructure|\/data\//,
  };
  for (const layer of Object.keys(forbidden)) {
    for (const file of readdirSync(
      new URL(`../src/${layer}/`, import.meta.url),
    )) {
      if (!/\.tsx?$/.test(file)) continue;
      const source = readFileSync(
        new URL(`../src/${layer}/${file}`, import.meta.url),
        'utf8',
      );
      const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(
        (match) => match[1],
      );
      for (const path of imports)
        assert(!forbidden[layer].test(path), `${layer}/${file}: ${path}`);
    }
  }
});
