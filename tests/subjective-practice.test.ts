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

function ui(control: HTMLDivElement): { details: FakeElement; correct: FakeElement; wrong: FakeElement; feedback: FakeElement; retry: FakeElement } {
  const items = (control as unknown as FakeElement).children;
  return { details: items[0], correct: items[2].children[0], wrong: items[2].children[1], feedback: items[3], retry: items[4] };
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
    assert.ok(readPracticeIds(config.repeatStorageKey).has(config.id));
    const refreshed = ui(createSubjectivePractice(config));
    assert.ok(refreshed.wrong.classes.has('is-selected'));
    assert.match(refreshed.feedback.textContent, /二重错题/);
    assert.equal(refreshed.retry.hidden, false);
  });
});

test('first wrong enters wrong book without incorrectly counting as a second wrong', () => {
  fakeBrowser(() => {
    const result = gradeSubjectiveAnswer(config, 'wrong');
    assert.equal(result.secondWrong, false);
    assert.ok(readPracticeIds(config.wrongStorageKey).has(config.id));
    assert.ok(!readPracticeIds(config.repeatStorageKey).has(config.id));
    assert.equal(readSubjectiveGrades(config.resultStorageKey)[config.id].grade, 'wrong');
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
    assert.ok(!readPracticeIds(config.repeatStorageKey).has(config.id));
    const refreshed = ui(createSubjectivePractice(config));
    assert.ok(refreshed.correct.classes.has('is-selected'));
    assert.match(refreshed.feedback.textContent, /做对了/);

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
