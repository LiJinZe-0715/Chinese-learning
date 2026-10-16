import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { readGlossarySource } from './glossary-source.mjs';
const lessons = JSON.parse(readFileSync('src/data/curriculum.json', 'utf8'));
const result = readGlossarySource();
for (const [id, words] of Object.entries(result)) {
  const lesson = lessons.find((row) => row.id === id);
  assert(lesson, `Unknown lesson ${id}`);
  const terms = lesson.sourceLabel.replace(/^.*[：:]/, '').split('、');
  assert.deepEqual(
    words.map((word) => word.zh),
    terms,
    `Incomplete translations: ${id}`,
  );
}
writeFileSync('src/data/glossary.json', JSON.stringify(result, null, 2) + '\n');
console.log(
  `${Object.keys(result).length} lesson groups, ${Object.values(result).flat().length} individual translations`,
);
