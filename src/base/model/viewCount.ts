import {DocumentBase} from './base';

export enum ViewCountableDocumentKey {
  viewCount = '_vc'
}

export type ViewCountableDocumentBase = DocumentBase & {
  [ViewCountableDocumentKey.viewCount]: number,
};
