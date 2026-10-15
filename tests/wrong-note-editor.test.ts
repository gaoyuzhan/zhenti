import assert from 'node:assert/strict';
import test from 'node:test';
import { createQuestionNoteEditor, readQuestionNotes, saveQuestionNote } from '../src/lib/wrong-note-editor';

class FakeElement {
  readonly children: FakeElement[] = [];
  readonly attributes = new Map<string, string>();
  readonly listeners = new Map<string, () => void>();
  className = '';
  textContent = '';
  value = '';
  placeholder = '';
  rows = 0;
  open = false;

  append(...items: FakeElement[]): void { this.children.push(...items); }
  setAttribute(key: string, value: string): void { this.attributes.set(key, value); }
  addEventListener(type: string, handler: () => void): void { this.listeners.set(type, handler); }
  trigger(type: string): void { this.listeners.get(type)?.(); }
}

function withFakeBrowser(fn: (storage: Map<string, string>) => void): void {
  const oldDocument = globalThis.document;
  const oldStorage = globalThis.localStorage;
  const storage = new Map<string, string>();
  globalThis.document = { createElement: () => new FakeElement() } as unknown as Document;
  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, value); },
    removeItem: (key: string) => { storage.delete(key); }
  } as unknown as Storage;
  try { fn(storage); }
  finally {
    globalThis.document = oldDocument;
    globalThis.localStorage = oldStorage;
  }
}

function ui(element: HTMLDetailsElement) {
  const container = element as unknown as FakeElement;
  return {
    container,
    summary: container.children[0],
    textarea: container.children[1].children[0].children[0],
    status: container.children[1].children[1]
  };
}

test('each math-II question gets an independently saved note that survives refresh', () => {
  withFakeBrowser(() => {
    const storageKey = 'zhijian-math-two-notes';
    const id = 'chapters/2012.md#question-18';
    const first = ui(createQuestionNoteEditor({ id, storageKey, questionLabel: '2012年数学二第18题' }));
    assert.equal(first.container.open, false);
    assert.equal(first.textarea.value, '');
    assert.match(first.textarea.attributes.get('aria-label') ?? '', /2012年数学二第18题/);

    const text = '错因：极坐标积分的上下限。\n回书：吴忠祥讲义第3章。';
    first.textarea.value = text;
    first.textarea.trigger('input');
    assert.equal(readQuestionNotes(storageKey)[id], text);
    assert.match(first.summary.textContent, /已记录/);
    assert.equal(first.status.textContent, '已自动保存');

    const refreshed = ui(createQuestionNoteEditor({ id, storageKey }));
    assert.equal(refreshed.textarea.value, text);
    assert.equal(refreshed.container.open, true);
    assert.equal(ui(createQuestionNoteEditor({ id: 'chapters/2012.md#question-19', storageKey })).textarea.value, '');
  });
});

test('408 note editor reads and updates the very same key as the original practice page', () => {
  withFakeBrowser((storage) => {
    const key = 'zhijian-408-notes';
    storage.set(key, JSON.stringify({ '10': '原有笔记', '12': '另一道题' }));
    const editor = ui(createQuestionNoteEditor({ id: 10, storageKey: key }));
    assert.equal(editor.textarea.value, '原有笔记');
    editor.textarea.value = '修订后的错因：DMA和中断混淆';
    editor.textarea.trigger('input');
    assert.deepEqual(readQuestionNotes(key), {
      '10': '修订后的错因：DMA和中断混淆',
      '12': '另一道题'
    });
  });
});

test('clearing a note does not erase notes from other questions or their wrong-book flags', () => {
  withFakeBrowser((storage) => {
    const key = 'zhijian-math-two-notes';
    const wrongKey = 'zhijian-math-two-wrong';
    storage.set(wrongKey, JSON.stringify(['chapters/2011.md#question-3']));
    assert.equal(saveQuestionNote(key, 'chapters/2011.md#question-3', '易混：秩的判定'), true);
    assert.equal(saveQuestionNote(key, 'chapters/2011.md#question-6', '另一个笔记'), true);
    const editor = ui(createQuestionNoteEditor({ id: 'chapters/2011.md#question-3', storageKey: key }));
    editor.textarea.value = '   ';
    editor.textarea.trigger('input');

    assert.equal(readQuestionNotes(key)['chapters/2011.md#question-3'], undefined);
    assert.equal(readQuestionNotes(key)['chapters/2011.md#question-6'], '另一个笔记');
    assert.match(editor.summary.textContent, /写错题笔记/);
    assert.equal(storage.get(wrongKey), JSON.stringify(['chapters/2011.md#question-3']));
  });
});

test('malformed browser data does not break the editor; note text stays plain text', () => {
  withFakeBrowser((storage) => {
    const key = 'zhijian-math-two-notes';
    storage.set(key, 'not-json');
    assert.deepEqual(readQuestionNotes(key), {});
    const editor = ui(createQuestionNoteEditor({ id: 'foo', storageKey: key }));
    editor.textarea.value = '<script>alert("x")</script>';
    editor.textarea.trigger('input');
    assert.equal(readQuestionNotes(key).foo, '<script>alert("x")</script>');
  });
});

test('storage failures are visible rather than falsely reported as saved', () => {
  withFakeBrowser(() => {
    const editor = ui(createQuestionNoteEditor({ id: 7, storageKey: 'notes' }));
    const old = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('Quota exceeded'); }
    } as unknown as Storage;
    try {
      editor.textarea.value = '未保存文本';
      editor.textarea.trigger('input');
      assert.match(editor.status.textContent, /保存失败/);
      assert.equal(editor.textarea.value, '未保存文本');
    } finally {
      globalThis.localStorage = old;
    }
  });
});
