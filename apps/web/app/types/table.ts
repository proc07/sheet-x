import { OPERATORS } from '~/constants/filter';
import { FIELD_TYPE_DATE, FIELD_TYPE_MULTI_SELECT, FIELD_TYPE_NUMBER, FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_TEXT, FIELD_TYPE_USER, FIELD_TYPE_GROUP, FIELD_TYPE_ATTACHMENT, FIELD_TYPE_CHECKBOX, FIELD_TYPE_URL, FIELD_TYPE_FORMULA, FIELD_TYPE_LOOKUP, FIELD_TYPE_WORKFLOW, FIELD_TYPE_AUTO_NUMBER, FIELD_TYPE_BARCODE, FIELD_TYPE_BUTTON, FIELD_TYPE_CREATED_BY, FIELD_TYPE_CREATED_TIME, FIELD_TYPE_CURRENCY, FIELD_TYPE_EMAIL, FIELD_TYPE_LINK_BIDIRECTIONAL, FIELD_TYPE_LINK_UNIDIRECTIONAL, FIELD_TYPE_LOCATION, FIELD_TYPE_PHONE, FIELD_TYPE_PROGRESS, FIELD_TYPE_RATING, FIELD_TYPE_UPDATED_BY, FIELD_TYPE_UPDATED_TIME } from '~/constants/table';

export type OperatorType = (typeof OPERATORS)[keyof typeof OPERATORS][number]['value'];

export interface FilterCondition {
  fieldId: string;
  operator: OperatorType;
  value: any;
}

export type Workspace = { id: string; name: string; createdAt: string };
export type Base = { id: string; name: string; createdAt: string };
export type Table = { id: string; name: string; createdAt: string; rowHeight?: number };
export type Attachment = {
  name: string;
  type: string;
  url: string;
  size: number;
  lastModified?: number;
}

export type UrlData = {
  link: string;
  text?: string;
}

export type FieldType =
  | typeof FIELD_TYPE_TEXT
  | typeof FIELD_TYPE_NUMBER
  | typeof FIELD_TYPE_DATE
  | typeof FIELD_TYPE_SINGLE_SELECT
  | typeof FIELD_TYPE_MULTI_SELECT
  | typeof FIELD_TYPE_USER
  | typeof FIELD_TYPE_GROUP
  | typeof FIELD_TYPE_ATTACHMENT
  | typeof FIELD_TYPE_CHECKBOX
  | typeof FIELD_TYPE_URL
  | typeof FIELD_TYPE_FORMULA
  | typeof FIELD_TYPE_LOOKUP
  | typeof FIELD_TYPE_WORKFLOW
  | typeof FIELD_TYPE_BUTTON
  | typeof FIELD_TYPE_AUTO_NUMBER
  | typeof FIELD_TYPE_PHONE
  | typeof FIELD_TYPE_EMAIL
  | typeof FIELD_TYPE_LOCATION
  | typeof FIELD_TYPE_BARCODE
  | typeof FIELD_TYPE_PROGRESS
  | typeof FIELD_TYPE_CURRENCY
  | typeof FIELD_TYPE_RATING
  | typeof FIELD_TYPE_LINK_BIDIRECTIONAL
  | typeof FIELD_TYPE_LINK_UNIDIRECTIONAL
  | typeof FIELD_TYPE_CREATED_BY
  | typeof FIELD_TYPE_UPDATED_BY
  | typeof FIELD_TYPE_CREATED_TIME
  | typeof FIELD_TYPE_UPDATED_TIME;

export type Field = {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  config?: any;
  position: number;
  width?: number;
  hidden?: boolean;
  frozen?: boolean;
};

export type RecordRow = { id: string; data: Record<string, any>; revision: number };