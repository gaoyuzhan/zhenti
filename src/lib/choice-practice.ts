// Shared, answer-hidden-until-selection choice practice for math exams and wrong books.
export type ChoiceId = string | number;

export interface ChoicePracticeConfig {
  id: ChoiceId;
  answer: string;
  answerStorageKey: string;
  wrongStorageKey: string;
  repeatStorageKey: string;
  layout?: 'letters' | 'rows';
  options?: Array<{ label: string; renderContent?: (target: HTMLElement) => void }>;
  onGraded?: (correct: boolean | null, secondWrong: boolean) => void;
}

export function readPracticeIds(key: string): Set<ChoiceId> {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((item) => typeof item === 'string' || typeof item === 'number') : []);
  } catch {
    return new Set();
  }
}

export function savePracticeIds(key: string, ids: Set<ChoiceId>): void {
  try { localStorage.setItem(key, JSON.stringify([...ids])); } catch {}
}

function readAnswerChoices(key: string): Record<string, { selected: string; at: number }> {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

// A mathematical question's four printed answer choices are preserved as rendered Markdown.
export function findMathChoiceEnd(nodes: Element[]): Element | null {
  const found = new Set<string>();
  let last: Element | null = null;
  for (const node of nodes) {
    const candidates = node.matches('p, li') ? [node] : [...node.querySelectorAll('p, li')];
    for (const candidate of candidates) {
      const label = candidate.textContent?.trim().match(/^([A-D])\s*[.．、:：)）]/)?.[1];
      if (!label) continue;
      found.add(label);
      if (label === 'D') last = node;
    }
  }
  return found.size === 4 ? last : null;
}

export function createChoicePractice(config: ChoicePracticeConfig): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'choice-practice choice-practice--' + (config.layout || 'letters');
  const title = document.createElement('p');
  title.className = 'choice-practice-title';
  title.textContent = '选择你的答案（A / B / C / D）';
  const options = document.createElement('div');
  options.className = 'choice-practice-options';
  const status = document.createElement('p');
  status.className = 'choice-practice-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'choice-practice-retry';
  retry.textContent = '再做一次';
  const answer = /^[A-D]$/.test(config.answer) ? config.answer : '';
  const saved = readAnswerChoices(config.answerStorageKey);
  let selected = /^[A-D]$/.test(saved[String(config.id)]?.selected)
    ? saved[String(config.id)].selected : '';
  const buttons = new Map<string, HTMLButtonElement>();

  const paint = () => {
    buttons.forEach((button, label) => {
      button.disabled = Boolean(selected);
      button.classList.toggle('is-selected', selected === label);
      button.classList.toggle('is-correct', Boolean(selected && answer && label === answer));
      button.classList.toggle('is-incorrect', Boolean(selected && answer && label === selected && label !== answer));
    });
    retry.hidden = !selected;
    if (!selected) {
      status.textContent = '';
      status.hidden = true;
      return;
    }
    status.hidden = false;
    if (!answer) {
      status.className = 'choice-practice-status';
      status.textContent = '已选 ' + selected + '。这道题的标准答案尚未核对，暂不判对错。';
    } else if (selected === answer) {
      status.className = 'choice-practice-status is-correct';
      status.textContent = '✓ 回答正确（' + answer + '）';
    } else {
      status.className = 'choice-practice-status is-incorrect';
      status.textContent = '✗ 回答错误，你选了 ' + selected + '，正确答案：' + answer;
    }
  };

  const availableOptions: NonNullable<ChoicePracticeConfig['options']> = config.options
    ?? ['A','B','C','D'].map((label) => ({ label }));
  for (const option of availableOptions) {
    const label = String(option.label || '').toUpperCase();
    if (!/^[A-D]$/.test(label)) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-practice-option';
    const letter = document.createElement('strong');
    letter.textContent = label;
    button.append(letter);
    if (option.renderContent) {
      const content = document.createElement('div');
      content.className = 'choice-practice-option-text';
      option.renderContent(content);
      button.append(content);
    }
    button.addEventListener('click', () => {
      if (selected) return; // One graded submission per round; resetting begins a new attempt.
      selected = label;
      const answers = readAnswerChoices(config.answerStorageKey);
      answers[String(config.id)] = { selected, at: Date.now() };
      try { localStorage.setItem(config.answerStorageKey, JSON.stringify(answers)); } catch {}
      let twice = false;
      if (answer && selected !== answer) {
        const wrong = readPracticeIds(config.wrongStorageKey);
        if (wrong.has(config.id)) {
          const repeat = readPracticeIds(config.repeatStorageKey);
          repeat.add(config.id);
          savePracticeIds(config.repeatStorageKey, repeat);
          twice = true;
        }
        wrong.add(config.id);
        savePracticeIds(config.wrongStorageKey, wrong);
      }
      paint();
      config.onGraded?.(answer ? selected === answer : null, twice);
    });
    options.append(button);
    buttons.set(label, button);
  }

  retry.addEventListener('click', () => {
    selected = '';
    const answers = readAnswerChoices(config.answerStorageKey);
    delete answers[String(config.id)];
    try { localStorage.setItem(config.answerStorageKey, JSON.stringify(answers)); } catch {}
    paint();
  });

  root.append(title, options, status, retry);
  paint();
  return root;
}


export interface ManualRepeatControlConfig {
  id: ChoiceId;
  repeatStorageKey: string;
  onChange?: (repeated: boolean) => void;
}

// Non-multiple-choice questions are self-graded. Use the same repeat IDs
// as choice practice so both kinds of questions share the second-wrong view.
export function createManualRepeatControl(config: ManualRepeatControlConfig): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'wrong-manual-repeat';

  const label = document.createElement('span');
  label.className = 'wrong-manual-repeat-label';
  label.textContent = '本次重做：';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'wrong-manual-repeat-button';

  const paint = () => {
    const repeated = readPracticeIds(config.repeatStorageKey).has(config.id);
    button.classList.toggle('is-marked', repeated);
    button.setAttribute('aria-pressed', String(repeated));
    button.textContent = repeated
      ? '已加入二重错题 · 点击撤销'
      : '再次做错 · 标记二重错题';
  };

  button.addEventListener('click', () => {
    const repeat = readPracticeIds(config.repeatStorageKey);
    if (repeat.has(config.id)) repeat.delete(config.id);
    else repeat.add(config.id);
    savePracticeIds(config.repeatStorageKey, repeat);
    const repeated = readPracticeIds(config.repeatStorageKey).has(config.id);
    paint();
    config.onChange?.(repeated);
  });

  root.append(label, button);
  paint();
  return root;
}
