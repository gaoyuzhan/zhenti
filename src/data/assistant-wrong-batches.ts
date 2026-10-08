export type AssistantMathTwoWrongItem = {
  year: number;
  question: number;
};

export type Assistant408WrongItem = {
  year: number;
  question: number;
};

export type AssistantWrongBatch<T> = {
  id: string;
  items: readonly T[];
};

/**
 * ChatGPT-assisted grading can append batches here.
 * Each browser imports a batch at most once, so users can still remove an item
 * from their local wrong-book without old batches re-adding it on every visit.
 *
 * Only confirmed question numbers are included. For 2021 math-II, the detailed
 * choice/fill-in item numbers were not retained, so only graded written answers
 * are imported. For 2011 CS408, the specific wrong choice numbers are unknown.
 */
export const assistantMathTwoWrongBatches: readonly AssistantWrongBatch<AssistantMathTwoWrongItem>[] = [
  {
    id: 'math2-2021-graded-20261001',
    items: [
      { year: 2021, question: 18 },
      { year: 2021, question: 19 },
      { year: 2021, question: 20 },
      { year: 2021, question: 21 },
    ],
  },
  {
    id: 'math2-2011-reviewed-20261005',
    items: [
      { year: 2011, question: 3 },
      { year: 2011, question: 6 },
      { year: 2011, question: 9 },
      { year: 2011, question: 13 },
      { year: 2011, question: 16 },
      { year: 2011, question: 18 },
      { year: 2011, question: 19 },
      { year: 2011, question: 20 },
      { year: 2011, question: 22 },
    ],
  },
  {
    id: 'math2-2012-reviewed-20261008',
    items: [
      { year: 2012, question: 2 },
      { year: 2012, question: 3 },
      { year: 2012, question: 12 },
      { year: 2012, question: 13 },
      { year: 2012, question: 14 },
      { year: 2012, question: 18 },
      { year: 2012, question: 19 },
      { year: 2012, question: 20 },
      { year: 2012, question: 21 },
      { year: 2012, question: 22 },
    ],
  },
];

export const assistant408WrongBatches: readonly AssistantWrongBatch<Assistant408WrongItem>[] = [
  {
    id: 'cs408-2021-choice-reviewed-20261003',
    items: [
      { year: 2021, question: 9 },
      { year: 2021, question: 11 },
      { year: 2021, question: 13 },
      { year: 2021, question: 15 },
      { year: 2021, question: 22 },
      { year: 2021, question: 29 },
      { year: 2021, question: 32 },
      { year: 2021, question: 35 },
      { year: 2021, question: 40 },
    ],
  },
];
