/**
 * External, third-party solution images indexed by year and paper question number.
 * Source: https://github.com/lx-ruc/kaoyanshuxue (original provider: zhentiqiang.com).
 * Images are linked remotely, not redistributed into this repository.
 * These are reference solutions, not an officially verified answer key.
 */
export type MathTwoWrittenAnswerReference = {
  answerImageUrl?: string;
  explanationImageUrl: string;
  sourceUrl: string;
};

const sourceBase = 'https://raw.githubusercontent.com/lx-ruc/kaoyanshuxue/main/kaoyan_math_images/%E6%95%B0%E5%AD%A6%E4%BA%8C';
const githubSourceBase = 'https://github.com/lx-ruc/kaoyanshuxue/tree/main/kaoyan_math_images/%E6%95%B0%E5%AD%A6%E4%BA%8C';

const imageIds: Readonly<Record<number, Readonly<Record<number, number>>>> = {
  2009: { 9: 1626, 10: 1627, 11: 1628, 12: 1629, 13: 1630, 14: 1631, 15: 1632, 16: 1633, 17: 1634, 18: 1635, 19: 1636, 20: 1637, 21: 1638, 22: 1639, 23: 1640 },
  2010: { 9: 1649, 10: 1650, 11: 1651, 12: 1652, 13: 1653, 14: 1654, 15: 1655, 16: 1656, 17: 1657, 18: 1658, 19: 1659, 20: 1660, 21: 1661, 22: 1662, 23: 1663 },
  2011: { 9: 1672, 10: 1673, 11: 1674, 12: 1675, 13: 1676, 14: 1677, 15: 1678, 16: 1679, 17: 1680, 18: 1681, 19: 1682, 20: 1683, 21: 1684, 22: 1685, 23: 1686 },
  2012: { 9: 1695, 10: 1696, 11: 1697, 12: 1698, 13: 1699, 14: 1700, 15: 1701, 16: 1702, 17: 1703, 18: 1704, 19: 1705, 20: 1706, 21: 1707, 22: 1708, 23: 1709 },
  2013: { 9: 1718, 10: 1719, 11: 1720, 12: 1721, 13: 1722, 14: 1723, 15: 1724, 16: 1725, 17: 1726, 18: 1727, 19: 1728, 20: 1729, 21: 1730, 22: 1731, 23: 1732 },
  2014: { 9: 1741, 10: 1742, 11: 1743, 12: 1744, 13: 1745, 14: 1746, 15: 1747, 16: 1748, 17: 1749, 18: 1750, 19: 1751, 20: 1752, 21: 1753, 22: 1754, 23: 1755 },
  2015: { 9: 1764, 10: 1765, 11: 1766, 12: 1767, 13: 1768, 14: 1769, 15: 1770, 16: 1771, 17: 1772, 18: 1773, 19: 1774, 20: 1775, 21: 1776, 22: 1777, 23: 1778 },
  2016: { 9: 1118, 10: 1126, 11: 1125, 12: 1123, 13: 1124, 14: 1119, 15: 1120, 16: 1122, 17: 1121, 18: 1131, 19: 1132, 20: 1128, 21: 1127, 22: 1129, 23: 1130 },
  2017: { 9: 1095, 10: 1103, 11: 1102, 12: 1100, 13: 1101, 14: 1096, 15: 1097, 16: 1099, 17: 1098, 18: 1108, 19: 1109, 20: 1105, 21: 1104, 22: 1106, 23: 1107 },
  2018: { 9: 1072, 10: 1080, 11: 1079, 12: 1077, 13: 1078, 14: 1073, 15: 1074, 16: 1076, 17: 1075, 18: 1085, 19: 1086, 20: 1082, 21: 1081, 22: 1083, 23: 1084 },
  2019: { 9: 1049, 10: 1057, 11: 1056, 12: 1054, 13: 1055, 14: 1050, 15: 1051, 16: 1053, 17: 1052, 18: 1062, 19: 1063, 20: 1059, 21: 1058, 22: 1060, 23: 1061 },
  2020: { 9: 1026, 10: 1034, 11: 1033, 12: 1031, 13: 1032, 14: 1027, 15: 1028, 16: 1030, 17: 1029, 18: 1039, 19: 1040, 20: 1036, 21: 1035, 22: 1037, 23: 1038 },
  2021: { 11: 1011, 12: 1009, 13: 1010, 14: 1005, 15: 1006, 16: 1008, 17: 1007, 18: 1016, 19: 1017, 20: 1014, 21: 1013, 22: 1015 },
  2022: { 11: 989, 12: 987, 13: 988, 14: 983, 15: 984, 16: 986, 17: 985, 18: 994, 19: 995, 20: 992, 21: 991, 22: 993 },
  2023: { 11: 967, 12: 965, 13: 966, 14: 961, 15: 962, 16: 964, 17: 963, 18: 972, 19: 973, 20: 970, 21: 969, 22: 971 },
  2024: { 11: 945, 12: 943, 13: 944, 14: 939, 15: 940, 16: 942, 17: 941, 18: 950, 19: 951, 20: 948, 21: 947, 22: 949 },
  2025: { 11: 923, 12: 921, 13: 922, 14: 917, 15: 918, 16: 920, 17: 919, 18: 928, 19: 929, 20: 926, 21: 925, 22: 927 },
};

const missingAnswerImages = new Set<string>([
  '2024-21',
  '2025-21'
]);

export function getMathTwoWrittenAnswerReference(
  year: number,
  question: number
): MathTwoWrittenAnswerReference | null {
  if (!Number.isInteger(year) || !Number.isInteger(question)) return null;
  const id = imageIds[year]?.[question];
  if (!id) return null;
  const index = String(question).padStart(2, '0');
  const base = `${sourceBase}/${year}`;
  const filename = `Q${index}_id${id}`;
  const hasStandaloneAnswer = !missingAnswerImages.has(`${year}-${question}`);
  return {
    ...(hasStandaloneAnswer ? { answerImageUrl: `${base}/answers/${filename}_answer.png` } : {}),
    explanationImageUrl: `${base}/analysis/${filename}_analysis.png`,
    sourceUrl: `${githubSourceBase}/${year}`
  };
}
