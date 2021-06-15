import {SupportedLanguages} from '../../api-def/api';
import {DocumentBase} from '../../api-def/models';


export enum MultiLingualDocumentKey {
  language = '_lang'
}

export type MultiLingualDocumentBase = DocumentBase & {
  [MultiLingualDocumentKey.language]: SupportedLanguages,
};
