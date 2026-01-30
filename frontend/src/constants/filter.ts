export const OP_IS = 'is';
export const OP_IS_NOT = 'isNot';
export const OP_CONTAINS = 'contains';
export const OP_DOES_NOT_CONTAIN = 'doesNotContain';
export const OP_IS_EMPTY = 'isEmpty';
export const OP_IS_NOT_EMPTY = 'isNotEmpty';

export const OP_EQ = '=';
export const OP_NEQ = '!=';
export const OP_GT = '>';
export const OP_GTE = '>=';
export const OP_LT = '<';
export const OP_LTE = '<=';

export const OP_IS_BEFORE = 'isBefore';
export const OP_IS_AFTER = 'isAfter';

export const OP_IS_BOOLEAN = 'isBoolean';

export const OPERATORS = {
  default: [
    { label: '等于', value: OP_IS },
    { label: '不等于', value: OP_IS_NOT },
    { label: '包含', value: OP_CONTAINS },
    { label: '不包含', value: OP_DOES_NOT_CONTAIN },
    { label: '为空', value: OP_IS_EMPTY },
    { label: '不为空', value: OP_IS_NOT_EMPTY },
  ],
  number: [
    { label: '等于', value: OP_EQ },
    { label: '不等于', value: OP_NEQ },
    { label: '大于', value: OP_GT },
    { label: '大于等于', value: OP_GTE },
    { label: '小于', value: OP_LT },
    { label: '小于等于', value: OP_LTE },
    { label: '为空', value: OP_IS_EMPTY },
    { label: '不为空', value: OP_IS_NOT_EMPTY },
  ],
  date: [
    { label: '等于', value: OP_IS },
    { label: '早于', value: OP_IS_BEFORE },
    { label: '晚于', value: OP_IS_AFTER },
    { label: '为空', value: OP_IS_EMPTY },
    { label: '不为空', value: OP_IS_NOT_EMPTY },
  ],
  file: [
    { label: '为空', value: OP_IS_EMPTY },
    { label: '不为空', value: OP_IS_NOT_EMPTY },
  ],
  checkbox: [
    { label: '等于', value: OP_IS_BOOLEAN },
  ]
} as const;
