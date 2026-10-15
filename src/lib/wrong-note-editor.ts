import type { ChoiceId } from './choice-practice';

export interface QuestionNoteEditorConfig {
  id: ChoiceId;
  storageKey: string;
  questionLabel?: string;
}

/** Notes share a storage key with their original exam, but are isolated by question ID. */
export function readQuestionNotes(storageKey: string): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([id, note]) => id.length > 0 && typeof note === 'string')
    );
  } catch {
    return {};
  }
}

/** Save immediately on each edit, so reloading or moving between questions won't lose text. */
export function saveQuestionNote(storageKey: string, id: ChoiceId, text: string): boolean {
  try {
    const notes = readQuestionNotes(storageKey);
    if (text.trim()) notes[String(id)] = text;
    else delete notes[String(id)];
    localStorage.setItem(storageKey, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

export function createQuestionNoteEditor(config: QuestionNoteEditorConfig): HTMLDetailsElement {
  const id = String(config.id);
  const saved = readQuestionNotes(config.storageKey)[id] ?? '';

  const wrap = document.createElement('details');
  wrap.className = 'question-note-editor';
  wrap.open = Boolean(saved.trim());

  const summary = document.createElement('summary');
  summary.textContent = saved.trim() ? '我的错题笔记 · 已记录' : '写错题笔记';

  const body = document.createElement('div');
  body.className = 'question-note-editor-body';

  const label = document.createElement('label');
  label.className = 'question-note-editor-label';
  label.textContent = '错因 / 易混知识点 / 下次怎么做';

  const textarea = document.createElement('textarea');
  textarea.rows = 5;
  textarea.value = saved;
  textarea.placeholder = '例如：错因是概念混淆；对应王道第几章；下次看到什么关键词先想到什么方法……';
  textarea.setAttribute('aria-label', (config.questionLabel ?? '这道题') + '的错题笔记');
  label.append(textarea);

  const status = document.createElement('p');
  status.className = 'question-note-editor-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.textContent = saved.trim() ? '笔记已保存在当前浏览器' : '输入后自动保存到当前浏览器';

  textarea.addEventListener('input', () => {
    const success = saveQuestionNote(config.storageKey, config.id, textarea.value);
    if (!success) {
      status.textContent = '保存失败：请检查浏览器存储空间或隐私设置';
      return;
    }
    const hasNote = Boolean(textarea.value.trim());
    summary.textContent = hasNote ? '我的错题笔记 · 已记录' : '写错题笔记';
    status.textContent = hasNote ? '已自动保存' : '笔记已清空';
  });

  body.append(label, status);
  wrap.append(summary, body);
  return wrap;
}
