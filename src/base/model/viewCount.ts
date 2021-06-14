import {DocumentBase} from '../../api-def/models';


export enum ViewCountableDocumentKey {
  viewCount = '_vc'
}

export type ViewCountableDocumentBase = DocumentBase & {
  [ViewCountableDocumentKey.viewCount]: number,
};
