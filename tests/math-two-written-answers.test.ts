import assert from 'node:assert/strict';
import test from 'node:test';
import { getMathTwoWrittenAnswerReference } from '../src/data/math-two-written-answers';

test('historical 2009-2025 math-II fill-ins and written problems map to source images', () => {
  for (let year = 2009; year <= 2025; year++) {
    const firstWritten = year <= 2020 ? 9 : 11;
    const lastWritten = year <= 2020 ? 23 : 22;
    for (let question = firstWritten; question <= lastWritten; question++) {
      const found = getMathTwoWrittenAnswerReference(year, question);
      assert.ok(found, 'Missing reference for ' + year + ', question ' + question);
      assert.match(found.explanationImageUrl, /_analysis\.png$/);
      assert.match(found.sourceUrl, /github\.com\/lx-ruc\/kaoyanshuxue/);
      assert.ok(found.explanationImageUrl.includes('/' + year + '/'));
    }
  }
});

test('standalone answers are included where available, never invented otherwise', () => {
  const q2012 = getMathTwoWrittenAnswerReference(2012, 18);
  assert.match(q2012?.answerImageUrl ?? '', /\/2012\/answers\/Q18_id1704_answer\.png$/);

  assert.equal(getMathTwoWrittenAnswerReference(2024, 21)?.answerImageUrl, undefined);
  assert.equal(getMathTwoWrittenAnswerReference(2025, 21)?.answerImageUrl, undefined);
  assert.equal(getMathTwoWrittenAnswerReference(2021, 9), null);
  assert.equal(getMathTwoWrittenAnswerReference(2001, 8), null);
  assert.equal(getMathTwoWrittenAnswerReference(2026, 18), null);
  assert.equal(getMathTwoWrittenAnswerReference(2012, NaN), null);
});
