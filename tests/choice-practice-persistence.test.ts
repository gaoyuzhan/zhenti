import assert from 'node:assert/strict';
import test from 'node:test';
import { createChoicePractice, readPracticeIds } from '../src/lib/choice-practice';

class FakeElement {
  readonly children: FakeElement[] = [];
  readonly selectedClasses = new Set<string>();
  private readonly handlers = new Map<string, () => void>();
  className = '';
  textContent = '';
  type = '';
  hidden = false;
  disabled = false;
  readonly classList = {
    toggle: (name: string, enabled: boolean) => {
      if (enabled) this.selectedClasses.add(name);
      else this.selectedClasses.delete(name);
      return enabled;
    }
  };

  append(...children: FakeElement[]): void { this.children.push(...children); }
  setAttribute(_name: string, _value: string): void {}
  addEventListener(name: string, callback: () => void): void { this.handlers.set(name, callback); }
  click(): void { this.handlers.get('click')?.(); }
}

function withBrowser(run: (storage: Map<string, string>) => void): void {
  const oldDocument = globalThis.document;
  const oldStorage = globalThis.localStorage;
  const storage = new Map<string, string>();
  globalThis.document = { createElement: () => new FakeElement() } as unknown as Document;
  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); }
  } as unknown as Storage;
  try { run(storage); }
  finally {
    globalThis.document = oldDocument;
    globalThis.localStorage = oldStorage;
  }
}

function ui(element: HTMLDivElement): { options: FakeElement[]; status: FakeElement; retry: FakeElement } {
  const children = (element as unknown as FakeElement).children;
  return { options: children[1].children, status: children[2], retry: children[3] };
}

const settings = {
  id: 'chapters/2005.md#math-q-14',
  answer: 'C',
  answerStorageKey: 'zhijian-math-two-review-answers',
  wrongStorageKey: 'zhijian-math-two-wrong',
  repeatStorageKey: 'zhijian-math-two-repeat-wrong'
};

test('wrong answer is restored, regraded and counted after refresh', () => {
  withBrowser((storage) => {
    storage.set(settings.wrongStorageKey, JSON.stringify([settings.id]));
    const first = ui(createChoicePractice(settings));
    first.options[0].click();
    assert.match(first.status.textContent, /回答错误/);
    assert.ok(readPracticeIds(settings.repeatStorageKey).has(settings.id));

    const refreshed = ui(createChoicePractice(settings));
    assert.equal(refreshed.options[0].disabled, true);
    assert.ok(refreshed.options[0].selectedClasses.has('is-selected'));
    assert.match(refreshed.status.textContent, /回答错误/);
    assert.equal(refreshed.retry.hidden, false);
  });
});

test('correct answer survives refresh, but retry deliberately starts a new round', () => {
  withBrowser((storage) => {
    ui(createChoicePractice(settings)).options[2].click();
    const refreshed = ui(createChoicePractice(settings));
    assert.ok(refreshed.options[2].selectedClasses.has('is-selected'));
    assert.match(refreshed.status.textContent, /回答正确/);

    refreshed.retry.click();
    const nextRound = ui(createChoicePractice(settings));
    assert.equal(nextRound.status.hidden, true);
    assert.equal(nextRound.options[2].disabled, false);
    assert.equal(storage.get(settings.answerStorageKey), '{}');
  });
});

test('unverified answer also persists, without guessing a grade', () => {
  withBrowser(() => {
    const unverified = { ...settings, answer: '' };
    ui(createChoicePractice(unverified)).options[1].click();
    const refreshed = ui(createChoicePractice(unverified));
    assert.ok(refreshed.options[1].selectedClasses.has('is-selected'));
    assert.match(refreshed.status.textContent, /已选 B/);
    assert.match(refreshed.status.textContent, /尚未核对/);
  });
});

test('separate math and CS408 storage keys do not overwrite one another', () => {
  withBrowser(() => {
    const cs = { ...settings, answerStorageKey: 'zhijian-408-review-answers' };
    ui(createChoicePractice(settings)).options[2].click();
    ui(createChoicePractice(cs)).options[0].click();
    assert.match(ui(createChoicePractice(settings)).status.textContent, /回答正确/);
    assert.match(ui(createChoicePractice(cs)).status.textContent, /回答错误/);
  });
});
