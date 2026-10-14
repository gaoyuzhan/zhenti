import assert from 'node:assert/strict';
import test from 'node:test';
import { getMathTwoChoiceAnswer, mathTwoChoiceAnswers } from '../src/data/math-two-answer-key';

const firstChoiceByYear: Readonly<Record<number, number>> = {
  2000: 6,
  2004: 7,
  2005: 7,
  2006: 7
};

test('every listed 2000-2026 math-II choice has a gradeable answer', () => {
  for (let year = 2000; year <= 2026; year++) {
    const answers = mathTwoChoiceAnswers[year];
    assert.ok(answers, `Missing answer key for ${year}`);
    assert.ok(answers.length >= 5 && answers.length <= 10, `Unexpected choice count for ${year}`);
    assert.ok(answers.every((answer) => /^[A-D]$/.test(answer)), `Unverified choice answer in ${year}`);

    const first = firstChoiceByYear[year] ?? 1;
    answers.forEach((answer, index) => {
      assert.equal(getMathTwoChoiceAnswer(year, first + index), answer, `Wrong mapping for ${year}, Q${first + index}`);
    });
    assert.equal(getMathTwoChoiceAnswer(year, first - 1), '');
    assert.equal(getMathTwoChoiceAnswer(year, first + answers.length), '');
  }
});

test('historic fill-in offsets and screenshot cases', () => {
  assert.equal(getMathTwoChoiceAnswer(2005, 14), 'C');
  assert.equal(getMathTwoChoiceAnswer(2005, 6), '');
  assert.equal(getMathTwoChoiceAnswer(2007, 4), 'D');
  assert.equal(getMathTwoChoiceAnswer(2009, 8), 'A');
  assert.equal(getMathTwoChoiceAnswer(2021, 9), 'D');
  assert.equal(getMathTwoChoiceAnswer(2026, 10), 'D');
  assert.equal(getMathTwoChoiceAnswer(2004, 15), '');
  assert.equal(getMathTwoChoiceAnswer(1999, 3), '');
  assert.equal(getMathTwoChoiceAnswer(2010, 1.5), '');
});
