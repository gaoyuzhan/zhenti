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
 * Only confirmed question numbers are included. For 2011 math-II, only question 22 is confirmed in the available review.
 * For 2011 CS408, the specific wrong choice numbers are unknown.
 */
export const assistantMathTwoWrongBatches: readonly AssistantWrongBatch<AssistantMathTwoWrongItem>[] = [
  {
    id: 'math2-2021-graded-20261001',
    items: [
      { year: 2021, question: 3 },
      { year: 2021, question: 6 },
      { year: 2021, question: 13 },
      { year: 2021, question: 16 },
      { year: 2021, question: 18 },
      { year: 2021, question: 19 },
      { year: 2021, question: 20 },
    ],
  },
  {
    id: 'math2-2011-reviewed-20261005',
    items: [
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
  {
    id: 'math2-practice-errors-20261008-a',
    items: [
      { year: 2005, question: 14 }, // 伴随矩阵交换行后的符号和列变换
      { year: 2014, question: 4 },  // 参数曲线曲率半径
    ],
  },
  {
    id: 'math2-2015-reviewed-20261009-a',
    items: [
      { year: 2015, question: 18 }, // Polar-coordinate region misses sectors outside the intersection angles
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
  {
    id: 'cs408-2012-choice-reviewed-20261008',
    items: [
      { year: 2012, question: 4 },  // AVL minimum nodes, balance factor 1
      { year: 2012, question: 12 }, // CPU and I/O time after CPU speedup
      { year: 2012, question: 14 }, // IEEE 754 maximum finite positive float
      { year: 2012, question: 15 }, // Little endian and struct alignment
      { year: 2012, question: 17 }, // Cache two-way mapping and LRU
      { year: 2012, question: 19 }, // Bus burst timing, shared address/data
      { year: 2012, question: 23 }, // User mode vs kernel mode events
      { year: 2012, question: 32 }, // Disk I/O optimization
      { year: 2012, question: 35 }, // Ethernet MAC service model
      { year: 2012, question: 36 }, // GBN window and sequence-number bits
      { year: 2012, question: 37 }, // IP router forwarding and reliability
    ],
  },
  {
    id: 'cs408-2012-comprehensive-reviewed-20261008',
    items: [
      { year: 2012, question: 42 }, // Shared suffix start in two intersecting linked lists
      { year: 2012, question: 43 }, // MIPS, Cache misses, page faults, DMA and interleaved memory
      { year: 2012, question: 44 }, // Arithmetic shift and five-stage pipeline hazards without forwarding
      { year: 2012, question: 45 }, // Periodic resident-set scanning and free-frame queue
      { year: 2012, question: 46 }, // FCB indexing, block-number width and maximum file size
      { year: 2012, question: 47 }, // TCP three-way handshake, Ethernet padding, ACK bytes and TTL hops
    ],
  },
];
