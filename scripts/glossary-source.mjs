import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export function readGlossarySource() {
  const [header, ...rows] = readFileSync('content/glossary.tsv', 'utf8')
    .trim()
    .split(/\r?\n/);
  assert.equal(header, 'lessonId\tzh\tja');
  const result = {};
  for (const [index, row] of rows.entries()) {
    const [id, zh, ja, ...extra] = row.split('\t');
    assert(
      id && zh?.trim() && ja?.trim() && !extra.length,
      `Invalid glossary row ${index + 2}`,
    );
    const words = (result[id] ??= []);
    assert(
      !words.some((word) => word.zh === zh),
      `Duplicate glossary term: ${id}/${zh}`,
    );
    words.push({ zh, ja });
  }
  return result;
}
