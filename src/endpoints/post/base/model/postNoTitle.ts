import {ObjectId} from 'mongodb';

import {SupportedLanguages} from '../../../../api-def/api';
import {Document, DocumentConstructParams} from '../../../../base/model/base';
import {EditableDocumentBase, EditableDocumentKey, EditNote} from '../../../../base/model/editable';
import {MultiLingualDocumentBase, MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {ViewCountableDocumentBase, ViewCountableDocumentKey} from '../../../../base/model/viewCount';

export type PostDocumentBaseNoTitle =
  MultiLingualDocumentBase
  & EditableDocumentBase
  & ViewCountableDocumentBase

export type PostConstructParamsNoTitle = DocumentConstructParams & {
  lang: SupportedLanguages,
  dateModifiedEpoch?: number,
  datePublishedEpoch?: number,
  id?: ObjectId,
  editNotes?: Array<EditNote>,
  viewCount?: number,
}

/**
 * Post data class without title.
 */
export abstract class PostNoTitle extends Document {
  lang: SupportedLanguages;
  dateModifiedEpoch: number;
  datePublishedEpoch: number;
  editNotes: Array<EditNote>;
  viewCount: number;

  /**
   * Construct a post data without title.
   *
   * @param {PostConstructParamsNoTitle} params parameters to construct a post data
   */
  protected constructor(params: PostConstructParamsNoTitle) {
    super(params);

    const nowEpoch = new Date().valueOf();

    this.lang = params.lang;
    this.dateModifiedEpoch = params.dateModifiedEpoch || nowEpoch;
    this.datePublishedEpoch = params.dateModifiedEpoch || nowEpoch;
    this.editNotes = params.editNotes || [];
    this.viewCount = params.viewCount || 0;
  }

  /**
   * @inheritDoc
   */
  toObject(): PostDocumentBaseNoTitle {
    return {
      ...super.toObject(),
      [MultiLingualDocumentKey.language]: this.lang,
      [EditableDocumentKey.editNotes]: this.editNotes.map((doc) => doc.toObject()),
      [EditableDocumentKey.dateModifiedEpoch]: this.dateModifiedEpoch,
      [EditableDocumentKey.datePublishedEpoch]: this.datePublishedEpoch,
      [ViewCountableDocumentKey.viewCount]: this.viewCount,
    };
  }
}
