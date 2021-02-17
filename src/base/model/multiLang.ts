import {DocumentBase} from './base';

export enum MultiLingualDocumentKey {
  language = '_lang'
}

export type MultiLingualDocumentBase = DocumentBase & {
  [MultiLingualDocumentKey.language]: string,
};
