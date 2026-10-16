import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readGlossarySource } from './glossary-source.mjs';
const read = (path) =>
  JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const source = read('content/syllabus.json'),
  lessons = read('src/data/curriculum.json');
const sourceById = new Map(source.map((row) => [row.id, row]));
const expectedCounts = [70, 78, 96, 95, 70, 50, 134];
const glossary = read('src/data/glossary.json');
const questions = read('src/data/questions.json');
assert.deepEqual(
  questions.map(({ py: _py, examplePy: _examplePy, ...sourceFields }) => sourceFields),
  read('content/questions.json'),
  'Generated question expressions are stale',
);
assert.equal(
  new Set(questions.map((question) => question.zh)).size,
  questions.length,
);
for (const question of questions) {
  for (const field of ['zh', 'ja', 'py', 'example', 'examplePy', 'note'])
    assert(question[field]?.trim(), `Missing question expression ${field}`);
  assert(
    !/[\u3400-\u9fff]/u.test(question.py + question.examplePy),
    `${question.zh}: pinyin must not contain unconverted Hanzi`,
  );
}
assert(questions.find((q) => q.zh === '哪儿／哪里').py.startsWith('nǎr'));
assert.equal(questions.find((q) => q.zh === '谁').py, 'shéi');
assert.deepEqual(glossary, readGlossarySource(), 'Generated glossary is stale');
const manifest = read('content/coverage.json');
const metadata = read('src/data/metadata.json');
const course = read('content/course.json');
assert.deepEqual(metadata, course.metadata, 'Generated metadata is stale');
assert.equal(manifest.edition, metadata.edition);
assert.equal(manifest.sourceUrl, metadata.sourceUrl);
assert.equal(manifest.pdfUrl, metadata.syllabusPdf);
assert.equal(manifest.coverageUnit, metadata.coverageUnit);
assert.equal(manifest.lessons, lessons.length);
assert.equal(manifest.sourceRows, source.length);
assert.deepEqual(manifest.printedPages, [
  Math.min(...source.map((row) => row.page)),
  Math.max(...source.map((row) => row.page)),
]);
assert.deepEqual(manifest.missing, []);
assert.deepEqual(
  manifest.levels,
  Object.fromEntries(expectedCounts.map((count, index) => [index + 1, count])),
);
const teaching = new Map();
const notes = new Map();
for (let level = 1; level <= 7; level++) {
  for (const line of readFileSync(`content/level-${level}.tsv`, 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)) {
    const [id, explain, zh, ja, ...extra] = line.split('\t');
    assert.equal(extra.length, 0, `Invalid teaching fields: ${id}`);
    assert.equal(
      sourceById.get(id)?.level,
      level,
      `Teaching row in wrong level file: ${id}`,
    );
    assert(!teaching.has(id), `Duplicate teaching row: ${id}`);
    teaching.set(id, { explain, zh, ja });
  }
  for (const line of readFileSync(`content/notes-${level}.tsv`, 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)) {
    const [id, usage, question, correct, wrong1, wrong2, feedback, ...extra] =
      line.split('\t');
    assert.equal(extra.length, 0, `Invalid note fields: ${id}`);
    assert.equal(sourceById.get(id)?.level, level, `Note in wrong level: ${id}`);
    assert(!notes.has(id), `Duplicate authored note: ${id}`);
    for (const value of [usage, question, correct, wrong1, wrong2, feedback])
      assert(value?.trim(), `Empty authored note field: ${id}`);
    notes.set(id, { usage, question, correct, wrong1, wrong2, feedback });
  }
}
assert.equal(teaching.size, lessons.length);
assert.equal(notes.size, lessons.length);
assert(
  !source.some((row) => row.source.includes('句公斤')),
  'Measure words must remain separate',
);
for (const [id, words] of Object.entries(glossary)) {
  const lesson = lessons.find((row) => row.id === id);
  assert(lesson, `Unknown glossary lesson: ${id}`);
  assert.deepEqual(
    words.map((word) => word.zh),
    lesson.sourceLabel.replace(/^.*[：:]/, '').split('、'),
  );
  for (const word of words)
    assert(word.zh.trim() && word.ja.trim(), `Empty translation: ${id}`);
}
assert.equal(lessons.length, 593);
assert.equal(new Set(lessons.map((l) => l.id)).size, 593);
assert.deepEqual(
  lessons.map((l) => l.id),
  source.map((r) => r.id),
  'Every PDF row must have a lesson in exactly the same order',
);
let offset = 0;
for (let level = 1; level <= 7; level++) {
  const group = lessons.filter((l) => l.level === level);
  assert.equal(group.length, expectedCounts[level - 1]);
  assert.deepEqual(
    group.map((l) => l.order),
    Array.from({ length: group.length }, (_, i) => i + 1),
  );
  assert.equal(
    lessons.findIndex((l) => l.level === level),
    offset,
  );
  offset += group.length;
  if (level < 7)
    assert.equal(
      lessons[offset].level,
      level + 1,
      'Next lesson crosses correctly into the next level',
    );
  for (let page = 0; page < Math.ceil(group.length / 12); page++)
    assert(group.slice(page * 12, (page + 1) * 12).length > 0);
}
const bins = [0, 0, 0];
for (let i = 0; i < lessons.length; i++) {
  const l = lessons[i],
    s = source[i];
  assert.equal(l.sourceLabel, s.source);
  assert.equal(l.sourceNote, s.sourceCorrection);
  assert.equal(l.sourcePage, s.page);
  assert.equal(l.pdfPage, l.sourcePage + 3);
  assert.equal(l.level, s.level);
  assert.equal(Number(l.id.match(/^p(\d+)/)?.[1]), l.pdfPage);
  if (s.sourceCorrection)
    assert(s.sourceOriginal?.trim(), `${l.id}: missing original source`);
  const chapter = l.id.includes('-extra')
    ? course.extraChapters[l.pdfPage]
    : course.sections[l.pdfPage].findLast(
        ([start]) => start <= Number(l.id.split('-').at(-1)),
      )?.[1];
  assert.equal(l.chapter, chapter, `${l.id}: stale chapter metadata`);
  assert.deepEqual(
    { explain: l.explain, zh: l.zh, ja: l.ja },
    teaching.get(l.id),
    `${l.id}: generated teaching data is stale`,
  );
  for (const field of [
    'explain',
    'usage',
    'zh',
    'py',
    'ja',
    'question',
    'feedback',
    'chapter',
    'title',
  ])
    assert(l[field].trim(), `${l.id} missing ${field}`);
  assert(/[ぁ-ゖァ-ヺ]/u.test(l.explain), `${l.id}: missing Japanese teaching`);
  assert(/[ぁ-ゖァ-ヺ]/u.test(l.ja), `${l.id}: missing Japanese translation`);
  assert(
    !/[\u3400-\u9fff]/u.test(l.py),
    `${l.id}: unconverted Hanzi in pinyin`,
  );
  assert(
    !/来来来|两两条|来定|予来/u.test(l.zh + l.explain),
    `${l.id}: corrupted text`,
  );
  assert.equal(l.options.length, 3);
  assert.equal(new Set(l.options).size, 3);
  assert(l.answer >= 0 && l.answer < 3);
  const note = notes.get(l.id);
  assert(note, `${l.id}: missing authored note`);
  assert.equal(l.usage, note.usage, `${l.id}: stale usage note`);
  assert.equal(l.question, note.question, `${l.id}: stale quiz question`);
  assert.equal(l.feedback, note.feedback, `${l.id}: stale quiz explanation`);
  assert.notEqual(l.feedback, l.explain, `${l.id}: quiz feedback duplicates lesson`);
  assert.equal(l.options[l.answer], note.correct, `${l.id}: incorrect answer key`);
  assert.deepEqual(
    [...l.options].sort(),
    [note.correct, note.wrong1, note.wrong2].sort(),
    `${l.id}: quiz must use its own authored distractors`,
  );
  bins[l.answer]++;
}
assert.equal(source.filter((r) => r.id.includes('extra')).length, 7);
assert.deepEqual(
  [...new Set(source.map((r) => r.sourcePage ?? r.page))],
  Array.from({ length: 21 }, (_, i) => 383 + i),
);
for (const [id, phrase] of [
  ['p389-30', 'rèn zhēn de'],
  ['p390-22', 'cháng'],
  ['p392-4', 'děi'],
  ['p393-26', 'dì zhǐ'],
  ['p398-20', 'shì de'],
  ['p398-25', 'bù dé liǎo'],
  ['p398-26', 'zháo'],
  ['p403-20', 'zuò le jiě shì'],
  ['p406-25', 'fēi děi'],
  ['p399-20', 'xiāo le pí'],
  ['p406-8', 'dào shì'],
  ['p403-8', 'yī zhuàng lóu'],
  ['p404-33', 'wǒ dōu huì'],
  ['p403-9', 'yī tòng'],
  ['p401-26', 'dé le'],
  ['p386-7', 'hǎo jiào'],
  ['p386-15', 'diǎnr'],
  ['p405-21', 'tour'],
])
  assert(
    lessons.find((l) => l.id === id).py.includes(phrase),
    `${id}: pinyin regression (${phrase})`,
  );
console.log(
  JSON.stringify(
    {
      lessons: lessons.length,
      levels: expectedCounts,
      missing: 0,
      duplicateIds: 0,
      answerPositions: bins,
      authoredUsageNotes: notes.size,
      authoredQuizzes: notes.size,
      syllabusPages: '383–403',
      status: 'passed',
    },
    null,
    2,
  ),
);
