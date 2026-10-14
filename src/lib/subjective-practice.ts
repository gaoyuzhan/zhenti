import { readPracticeIds, savePracticeIds, type ChoiceId } from './choice-practice';

export type SubjectiveGrade = 'correct' | 'wrong';
export type SubjectiveLevel = 1 | 2 | 3 | 4;

export const subjectiveLevelLabels: Readonly<Record<SubjectiveLevel, string>> = {
  1: '一档 · 有思路，算对了',
  2: '二档 · 有思路，算错了',
  3: '三档 · 差一点关键知识或思路',
  4: '四档 · 完全没思路'
};

export type SubjectiveAnswerReference = {
  answerImageUrl?: string;
  explanationImageUrl?: string;
  answerText?: string;
  explanationText?: string;
  sourceUrl?: string;
  relatedUrl?: string;
  note?: string;
};

export type SubjectiveGradeRecord = {
  grade: SubjectiveGrade;
  level?: SubjectiveLevel;
  at: number;
  addedWrong?: boolean;
  addedRepeat?: boolean;
};

export type SubjectivePracticeConfig = {
  id: ChoiceId;
  resultStorageKey: string;
  wrongStorageKey: string;
  repeatStorageKey: string;
  reference?: SubjectiveAnswerReference | null;
  onGraded?: (grade: SubjectiveGrade, secondWrong: boolean, level: SubjectiveLevel) => void;
};

export function readSubjectiveGrades(key: string): Record<string, SubjectiveGradeRecord> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const results: Record<string, SubjectiveGradeRecord> = {};
    for (const [id, record] of Object.entries(value)) {
      if (!record || typeof record !== 'object') continue;
      const item = record as Partial<SubjectiveGradeRecord>;
      if (item.grade !== 'correct' && item.grade !== 'wrong') continue;
      const level = Number(item.level);
      const isValidLevel = [1, 2, 3, 4].includes(level)
        && (level === 1) === (item.grade === 'correct');
      results[id] = {
        grade: item.grade,
        ...(isValidLevel ? { level: level as SubjectiveLevel } : {}),
        at: Number(item.at) || 0,
        addedWrong: item.addedWrong === true,
        addedRepeat: item.addedRepeat === true
      };
    }
    return results;
  } catch {
    return {};
  }
}

function saveSubjectiveGrades(key: string, results: Record<string, SubjectiveGradeRecord>): void {
  try { localStorage.setItem(key, JSON.stringify(results)); } catch {}
}

/**
 * A failed answer is a first mistake unless the question was already in the
 * corresponding wrong book. Repeating an incorrect answer adds a second mistake.
 * Both the self-assessment and the corresponding wrong-book flags are persisted.
 */
export function gradeSubjectiveAnswer(
  config: SubjectivePracticeConfig,
  level: SubjectiveLevel
): { secondWrong: boolean; record: SubjectiveGradeRecord } {
  if (![1, 2, 3, 4].includes(level)) throw new Error('Invalid subjective grading level');
  const grade: SubjectiveGrade = level === 1 ? 'correct' : 'wrong';
  const results = readSubjectiveGrades(config.resultStorageKey);
  const id = String(config.id);
  const previous = results[id];
  const wrong = readPracticeIds(config.wrongStorageKey);
  const repeat = readPracticeIds(config.repeatStorageKey);

  // Correct a mistaken tap without deleting any older mistake history.
  if (previous?.grade === 'wrong' && grade === 'correct') {
    if (previous.addedRepeat) repeat.delete(config.id);
    if (previous.addedWrong && !repeat.has(config.id)) wrong.delete(config.id);
  }

  let addedWrong = false;
  let addedRepeat = false;
  if (grade === 'wrong' && previous?.grade !== 'wrong') {
    const wasWrong = wrong.has(config.id);
    const wasRepeated = repeat.has(config.id);
    wrong.add(config.id);
    if (wasWrong) repeat.add(config.id);
    addedWrong = !wasWrong;
    addedRepeat = wasWrong && !wasRepeated;
  } else if (grade === 'wrong' && previous?.grade === 'wrong') {
    addedWrong = previous.addedWrong === true;
    addedRepeat = previous.addedRepeat === true;
  }

  const record: SubjectiveGradeRecord = {
    grade,
    level,
    at: Date.now(),
    addedWrong,
    addedRepeat
  };
  results[id] = record;
  saveSubjectiveGrades(config.resultStorageKey, results);
  savePracticeIds(config.wrongStorageKey, wrong);
  savePracticeIds(config.repeatStorageKey, repeat);
  const secondWrong = grade === 'wrong' && repeat.has(config.id);
  config.onGraded?.(grade, secondWrong, level);
  return { secondWrong, record };
}

export function clearSubjectiveGrade(config: SubjectivePracticeConfig): void {
  const results = readSubjectiveGrades(config.resultStorageKey);
  delete results[String(config.id)];
  saveSubjectiveGrades(config.resultStorageKey, results);
  // A new practice round does not erase historical wrong-book entries.
}

function createReferenceImage(url: string, description: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'subjective-reference-image';
  const image = document.createElement('img');
  image.alt = description;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.src = url;
  image.addEventListener('error', () => {
    image.hidden = true;
    const notice = document.createElement('span');
    notice.textContent = '图片加载失败，请点击打开原图。';
    link.append(notice);
  });
  link.append(image);
  return link;
}

export function createSubjectivePractice(config: SubjectivePracticeConfig): HTMLDivElement {
  const root = document.createElement('div');
  root.className = 'subjective-practice';

  const details = document.createElement('details');
  details.className = 'subjective-reference';
  const summary = document.createElement('summary');
  summary.textContent = '查看参考答案（做完再看）';
  const content = document.createElement('div');
  content.className = 'subjective-reference-content';
  const reference = config.reference;
  let loaded = false;

  details.addEventListener('toggle', () => {
    if (!details.open || loaded) return;
    loaded = true;
    if (reference?.answerImageUrl || reference?.explanationImageUrl || reference?.answerText || reference?.explanationText) {
      if (reference.answerText) {
        const result = document.createElement('p');
        result.className = 'subjective-reference-text';
        result.textContent = reference.answerText;
        content.append(result);
      }
      if (reference.answerImageUrl) {
        const h = document.createElement('h4');
        h.textContent = '参考答案';
        content.append(h, createReferenceImage(reference.answerImageUrl, '该题参考答案图片'));
      }
      if (reference.explanationText) {
        const result = document.createElement('p');
        result.className = 'subjective-reference-text';
        result.textContent = reference.explanationText;
        content.append(result);
      }
      if (reference.explanationImageUrl) {
        const h = document.createElement('h4');
        h.textContent = '解题过程 / 解析';
        content.append(h, createReferenceImage(reference.explanationImageUrl, '该题解题过程图片'));
      }
      const note = document.createElement('p');
      note.className = 'subjective-reference-note';
      note.textContent = reference.note || '此为第三方参考资料，请结合题目独立核对，不属于官方判分。';
      content.append(note);
    } else {
      const message = document.createElement('p');
      message.className = 'subjective-reference-note';
      message.textContent = '该题暂无已核对的参考答案，暂时不能在线对照；仍可根据纸质答案自行评判。';
      content.append(message);
    }

    if (reference?.sourceUrl) {
      const source = document.createElement('a');
      source.href = reference.sourceUrl;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = '查看参考资料来源 ↗';
      content.append(source);
    }
    if (reference?.relatedUrl) {
      const related = document.createElement('a');
      related.href = reference.relatedUrl;
      related.target = '_blank';
      related.rel = 'noopener noreferrer';
      related.textContent = '查看相关教材知识点（非本题答案）↗';
      content.append(related);
    }
  });
  details.append(summary, content);
  root.append(details);

  const label = document.createElement('p');
  label.className = 'subjective-grade-label';
  label.textContent = '本次掌握程度（做完后自评一档）：';

  const buttons = document.createElement('div');
  buttons.className = 'subjective-grade-buttons';
  const optionButtons = new Map<SubjectiveLevel, HTMLButtonElement>();
  for (const level of [1, 2, 3, 4] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'subjective-grade-button subjective-grade-button--level-' + level;
    button.textContent = subjectiveLevelLabels[level];
    button.setAttribute('data-level', String(level));
    button.addEventListener('click', () => {
      gradeSubjectiveAnswer(config, level);
      paint();
    });
    optionButtons.set(level, button);
    buttons.append(button);
  }

  const feedback = document.createElement('p');
  feedback.className = 'subjective-grade-feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'subjective-grade-retry';
  retry.textContent = '重新自评';

  const paint = () => {
    const record = readSubjectiveGrades(config.resultStorageKey)[String(config.id)];
    // Legacy ✓/✗ results must remain readable without inventing a mistake tier.
    const activeLevel = record?.level ?? (record?.grade === 'correct' ? 1 : undefined);
    const repeated = readPracticeIds(config.repeatStorageKey).has(config.id);
    for (const [level, button] of optionButtons) {
      const selected = level === activeLevel;
      button.classList.toggle('is-selected', selected);
      button.classList.toggle('is-correct', selected && level === 1);
      button.classList.toggle('is-incorrect', selected && level !== 1);
      button.setAttribute('aria-pressed', String(selected));
    }
    retry.hidden = !record;
    feedback.hidden = !record;
    feedback.className = 'subjective-grade-feedback' +
      (record?.grade === 'correct' ? ' is-correct' : record?.grade === 'wrong' ? ' is-incorrect' : '');
    if (!record) {
      feedback.textContent = '';
    } else if (!activeLevel) {
      feedback.textContent = '历史记录：做错了（尚未细分档位），可重新选择二、三或四档。';
    } else if (activeLevel === 1) {
      feedback.textContent = '已保存：' + subjectiveLevelLabels[activeLevel] + '。';
    } else {
      feedback.textContent = '已保存：' + subjectiveLevelLabels[activeLevel] +
        (repeated ? '；已记录为二重错题。' : '；已计入错题。');
    }
  };

  retry.addEventListener('click', () => {
    clearSubjectiveGrade(config);
    paint();
  });

  root.append(label, buttons, feedback, retry);
  paint();
  return root;
}
