// 2009-2025 multiple-choice answer letters sourced from the question metadata at:
// https://github.com/lx-ruc/kaoyanshuxue/tree/main/kaoyan_math_images
// This is third-party answer data, not an official answer key. Missing items remain ungraded.
export const mathTwoChoiceAnswers: Readonly<Record<number, readonly string[]>> = {
  2009: ['C', 'A', 'D', 'C', 'B', 'D', 'B', ''],
  2010: ['B', 'A', 'C', 'D', 'B', 'D', 'A', 'D'],
  2011: ['C', 'B', 'C', 'C', 'A', 'B', 'D', 'D'],
  2012: ['C', 'A', 'B', 'D', 'D', 'D', 'C', 'B'],
  2013: ['C', 'A', 'C', 'D', 'A', 'B', 'B', 'B'],
  2014: ['B', 'C', 'D', 'C', 'D', 'A', 'B', 'A'],
  2015: ['D', 'B', 'A', 'C', 'D', 'B', 'D', 'A'],
  2016: ['B', 'D', 'B', 'B', 'A', 'D', 'C', 'C'],
  2017: ['A', 'B', 'D', 'C', 'D', 'C', 'B', 'B'],
  2018: ['B', 'D', 'D', 'D', 'C', 'C', 'A', 'A'],
  2019: ['C', 'B', 'D', 'D', 'A', 'A', 'A', 'C'],
  2020: ['D', 'C', 'A', 'A', 'B', 'B', 'C', 'D'],
  2021: ['C', 'D', 'C', 'A', 'D', 'C', 'B', 'B', 'D', 'C'],
  2022: ['C', 'D', 'B', 'C', 'A', 'D', 'A', 'B', 'D', 'C'],
  2023: ['B', 'D', 'B', 'C', 'C', 'A', 'C', 'D', 'B', 'D'],
  2024: ['C', 'B', 'D', 'D', 'C', 'A', 'B', 'C', 'D', 'B'],
  2025: ['A', 'B', 'C', 'C', 'A', 'B', 'D', 'D', 'B', 'D']
};

export function getMathTwoChoiceAnswer(year: number, questionNumber: number): string {
  if (!Number.isInteger(questionNumber) || questionNumber < 1) return '';
  return mathTwoChoiceAnswers[year]?.[questionNumber - 1] ?? '';
}
