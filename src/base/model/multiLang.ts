import {SupportedLanguages} from '../../api-def/api';
import {DocumentBase} from './base';

export enum MultiLingualDocumentKey {
  language = '_lang'
}

export type MultiLingualDocumentBase = DocumentBase & {
  [MultiLingualDocumentKey.language]: SupportedLanguages,
};
