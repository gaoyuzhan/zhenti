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
 */
export const assistantMathTwoWrongBatches: readonly AssistantWrongBatch<AssistantMathTwoWrongItem>[] = [];

export const assistant408WrongBatches: readonly AssistantWrongBatch<Assistant408WrongItem>[] = [];
