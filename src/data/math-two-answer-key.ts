// Math II multiple-choice keys, ordered by the choice section of each paper.
// 2000-2008 reference: historical worked solutions and answer lists
// https://www.cnblogs.com/zhaokaifeng/category/2511758.html
// https://max.book118.com/html/2022/0424/6222132143004140.shtm
// https://max.book118.com/html/2022/0424/7152102120004114.shtm
// https://max.book118.com/html/2023/0621/7025201026005124.shtm
// 2009-2025 reference: https://github.com/lx-ruc/kaoyanshuxue/tree/main/kaoyan_math_images
// 2026 cross-check: https://noobdream.com/Practice/exam_solution/42535/
// Third-party keys, not an official answer key.
// Older papers with fill-in first have a different starting question number.
export const mathTwoChoiceAnswers: Readonly<Record<number, readonly string[]>> = {
  2000: ['D', 'C', 'A', 'C', 'B'],
  2001: ['B', 'B', 'C', 'A', 'D'],
  2002: ['D', 'D', 'C', 'B', 'A'],
  2003: ['D', 'B', 'A', 'C', 'B', 'D'],
  2004: ['B', 'C', 'B', 'C', 'A', 'D', 'D', 'A'],
  2005: ['C', 'A', 'A', 'D', 'B', 'D', 'B', 'C'],
  2006: ['A', 'B', 'C', 'D', 'C', 'D', 'A', 'B'],
  2007: ['B', 'A', 'C', 'D', 'D', 'D', 'C', 'B', 'A', 'B'],
  2008: ['D', 'C', 'D', 'A', 'B', 'A', 'C', 'D'],
  2009: ['C', 'A', 'D', 'C', 'B', 'D', 'B', 'A'],
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
  2025: ['A', 'B', 'C', 'C', 'A', 'B', 'D', 'D', 'B', 'D'],
  2026: ['A', 'B', 'A', 'D', 'C', 'B', 'D', 'B', 'A', 'D']
};

const firstChoiceQuestion: Readonly<Record<number, number>> = {
  2000: 6,
  2004: 7,
  2005: 7,
  2006: 7
};

export function getMathTwoChoiceAnswer(year: number, questionNumber: number): string {
  if (!Number.isInteger(year) || !Number.isInteger(questionNumber)) return '';
  const answers = mathTwoChoiceAnswers[year];
  if (!answers) return '';
  const index = questionNumber - (firstChoiceQuestion[year] ?? 1);
  return index >= 0 ? answers[index] ?? '' : '';
}
