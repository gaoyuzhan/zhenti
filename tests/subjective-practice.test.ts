import assert from 'node:assert/strict';
import test from 'node:test';
import { createSubjectivePractice, gradeSubjectiveAnswer, readSubjectiveGrades } from '../src/lib/subjective-practice';
import { readPracticeIds } from '../src/lib/choice-practice';

class FakeElement {
  readonly children: FakeElement[] = [];
  readonly classes = new Set<string>();
  readonly handlers = new Map<string, () => void>();
  readonly attributes = new Map<string, string>();
  readonly classList = {
    toggle: (name: string, enabled: boolean) => {
      if (enabled) this.classes.add(name);
      else this.classes.delete(name);
      return enabled;
    }
  };
  className = '';
  textContent = '';
  open = false;
  hidden = false;
  disabled = false;
  type = '';
  href = '';
  target = '';
  rel = '';
  src = '';
  loading = '';
  decoding = '';
  append(...items: FakeElement[]): void { this.children.push(...items); }
  setAttribute(key: string, value: string): void { this.attributes.set(key, value); }
  addEventListener(type: string, handler: () => void): void { this.handlers.set(type, handler); }
  trigger(type: string): void { this.handlers.get(type)?.(); }
  click(): void { this.trigger('click'); }
}

function fakeBrowser(body: (storage: Map<string, string>) => void): void {
  const oldDocument = globalThis.document;
  const oldStorage = globalThis.localStorage;
  const storage = new Map<string, string>();
  globalThis.document = { createElement: () => new FakeElement() } as unknown as Document;
  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); }
  } as unknown as Storage;
  try { body(storage); }
  finally {
    globalThis.document = oldDocument;
    globalThis.localStorage = oldStorage;
  }
}

const config = {
  id: 'chapters/2012.md#第-18-题',
  resultStorageKey: 'zhijian-math-two-review-subjective-answers',
  wrongStorageKey: 'zhijian-math-two-wrong',
  repeatStorageKey: 'zhijian-math-two-repeat-wrong'
};

function ui(control: HTMLDivElement): {
  details: FakeElement;
  levels: FakeElement[];
  correct: FakeElement;
  wrong: FakeElement;
  feedback: FakeElement;
  retry: FakeElement;
} {
  const items = (control as unknown as FakeElement).children;
  return {
    details: items[0],
    levels: items[2].children,
    correct: items[2].children[0],
    wrong: items[2].children[1],
    feedback: items[3],
    retry: items[4]
  };
}

test('answers are hidden until requested, and answer images are lazily attached', () => {
  fakeBrowser(() => {
    const control = createSubjectivePractice({
      ...config,
      reference: {
        answerImageUrl: 'https://example.org/answer.png',
        explanationImageUrl: 'https://example.org/analysis.png',
        sourceUrl: 'https://example.org'
      }
    });
    const instance = ui(control);
    assert.equal(instance.details.open, false);
    assert.equal(instance.details.children[1].children.length, 0);
    instance.details.open = true;
    instance.details.trigger('toggle');
    const answerContent = instance.details.children[1].children;
    assert.ok(answerContent.length > 3);
    assert.ok(answerContent.some((item) => item.className === 'subjective-reference-image'));
  });
});

test('marking an existing wrong-book question as wrong produces a persistent second wrong', () => {
  fakeBrowser((storage) => {
    storage.set(config.wrongStorageKey, JSON.stringify([config.id]));
    ui(createSubjectivePractice(config)).wrong.click();
    const saved = readSubjectiveGrades(config.resultStorageKey)[config.id];
    assert.equal(saved?.grade, 'wrong');
    assert.equal(saved?.level, 2);
    assert.ok(readPracticeIds(config.repeatStorageKey).has(config.id));
    const refreshed = ui(createSubjectivePractice(config));
    assert.ok(refreshed.wrong.classes.has('is-selected'));
    assert.match(refreshed.feedback.textContent, /二重错题/);
    assert.equal(refreshed.retry.hidden, false);
  });
});

test('first wrong enters wrong book without incorrectly counting as a second wrong', () => {
  fakeBrowser(() => {
    const result = gradeSubjectiveAnswer(config, 2);
    assert.equal(result.secondWrong, false);
    assert.ok(readPracticeIds(config.wrongStorageKey).has(config.id));
    assert.ok(!readPracticeIds(config.repeatStorageKey).has(config.id));
    assert.equal(readSubjectiveGrades(config.resultStorageKey)[config.id].grade, 'wrong');
    assert.equal(readSubjectiveGrades(config.resultStorageKey)[config.id].level, 2);
  });
});

test('self-grading correct persists and correcting a mis-tap reverses its own second-wrong flag', () => {
  fakeBrowser((storage) => {
    storage.set(config.wrongStorageKey, JSON.stringify([config.id]));
    const control = ui(createSubjectivePractice(config));
    control.wrong.click();
    assert.ok(readPracticeIds(config.repeatStorageKey).has(config.id));

    control.correct.click();
    assert.equal(readSubjectiveGrades(config.resultStorageKey)[config.id].grade, 'correct');
    assert.equal(readSubjectiveGrades(config.resultStorageKey)[config.id].level, 1);
    assert.ok(!readPracticeIds(config.repeatStorageKey).has(config.id));
    const refreshed = ui(createSubjectivePractice(config));
    assert.ok(refreshed.correct.classes.has('is-selected'));
    assert.match(refreshed.feedback.textContent, /一档.*算对了/);

    refreshed.retry.click();
    const nextRound = ui(createSubjectivePractice(config));
    assert.equal(nextRound.feedback.hidden, true);
    assert.equal(Object.keys(readSubjectiveGrades(config.resultStorageKey)).length, 0);
    assert.ok(readPracticeIds(config.wrongStorageKey).has(config.id));
  });
});

test('missing solution explicitly warns instead of pretending there is an answer', () => {
  fakeBrowser(() => {
    const control = ui(createSubjectivePractice(config));
    control.details.open = true;
    control.details.trigger('toggle');
    const text = control.details.children[1].children[0].textContent;
    assert.match(text, /暂无已核对的参考答案/);
  });
});

test('four grades match the requested mastery tiers and preserve the selected level after refresh', () => {
  fakeBrowser(() => {
    const first = ui(createSubjectivePractice(config));
    assert.equal(first.levels.length, 4);
    const labels = first.levels.map((button) => button.textContent);
    assert.deepEqual(labels, [
      '一档 · 有思路，算对了',
      '二档 · 有思路，算错了',
      '三档 · 差一点关键知识或思路',
      '四档 · 完全没思路'
    ]);
    first.levels[2].click();
    const saved = readSubjectiveGrades(config.resultStorageKey)[config.id];
    assert.equal(saved.grade, 'wrong');
    assert.equal(saved.level, 3);
    const refreshed = ui(createSubjectivePractice(config));
    assert.ok(refreshed.levels[2].classes.has('is-selected'));
    assert.match(refreshed.feedback.textContent, /三档/);
  });
});

test('switching between second, third, and fourth tiers is one wrong attempt, not multiple wrongs', () => {
  fakeBrowser((storage) => {
    storage.set(config.wrongStorageKey, JSON.stringify([config.id]));
    const control = ui(createSubjectivePractice(config));
    control.levels[1].click();
    assert.equal(readSubjectiveGrades(config.resultStorageKey)[config.id].level, 2);
    assert.equal(readPracticeIds(config.repeatStorageKey).size, 1);
    control.levels[2].click();
    control.levels[3].click();
    assert.equal(readPracticeIds(config.repeatStorageKey).size, 1);
    const saved = readSubjectiveGrades(config.resultStorageKey)[config.id];
    assert.equal(saved.level, 4);
    assert.equal(saved.grade, 'wrong');
    const refreshed = ui(createSubjectivePractice(config));
    assert.ok(refreshed.levels[3].classes.has('is-selected'));
    assert.match(refreshed.feedback.textContent, /四档/);
    assert.match(refreshed.feedback.textContent, /二重错题/);
  });
});

test('previous correct/wrong marks remain available without inventing a tier for old mistakes', () => {
  fakeBrowser((storage) => {
    storage.set(config.resultStorageKey, JSON.stringify({
      [config.id]: { grade: 'wrong', at: 100, addedWrong: false }
    }));
    storage.set(config.wrongStorageKey, JSON.stringify([config.id]));
    const oldRecord = readSubjectiveGrades(config.resultStorageKey)[config.id];
    assert.equal(oldRecord.level, undefined);
    const oldUi = ui(createSubjectivePractice(config));
    assert.ok(!oldUi.levels.some((level) => level.classes.has('is-selected')));
    assert.match(oldUi.feedback.textContent, /尚未细分档位/);
    oldUi.levels[2].click();
    assert.equal(readSubjectiveGrades(config.resultStorageKey)[config.id].level, 3);
    assert.ok(readPracticeIds(config.wrongStorageKey).has(config.id));

    const legacyCorrectConfig = { ...config, id: 'old-correct' };
    storage.set(config.resultStorageKey, JSON.stringify({
      [config.id]: readSubjectiveGrades(config.resultStorageKey)[config.id],
      'old-correct': { grade: 'correct', at: 101 }
    }));
    const correctUi = ui(createSubjectivePractice(legacyCorrectConfig));
    assert.ok(correctUi.levels[0].classes.has('is-selected'));
  });
});

test('grading is reject-safe and regrading from fourth tier to first reverses only newly added flags', () => {
  fakeBrowser(() => {
    const initial = gradeSubjectiveAnswer(config, 4);
    assert.equal(initial.record.level, 4);
    assert.equal(initial.secondWrong, false);
    assert.ok(readPracticeIds(config.wrongStorageKey).has(config.id));
    const correction = gradeSubjectiveAnswer(config, 1);
    assert.equal(correction.record.level, 1);
    assert.ok(!readPracticeIds(config.wrongStorageKey).has(config.id));
    assert.ok(!readPracticeIds(config.repeatStorageKey).has(config.id));
    assert.throws(() => gradeSubjectiveAnswer(config, 5 as never), /Invalid subjective grading level/);
  });
});
