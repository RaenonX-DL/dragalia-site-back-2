import {SupportedLanguages} from '../../../../api-def/api';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {PostDocumentBaseNoTitle} from '../model';
import {PostGetResponseParam} from '../response/post/get';

/**
 * Base object of a post getting result.
 * @template T, R
 */
export abstract class PostGetResult<T extends PostDocumentBaseNoTitle> {
  post: T;
  isAltLang: boolean;
  otherLangs: Array<SupportedLanguages>;

  /**
   * Construct a post getting result object.
   *
   * @param {T} post post document fetched from the database
   * @param {boolean} isAltLang if the post is returned in an alternative language
   * @param {Array<string>} otherLangs other languages available, if any
   * @protected
   */
  protected constructor(post: T, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) {
    this.post = post;
    this.isAltLang = isAltLang;
    this.otherLangs = otherLangs;
  }

  /**
   * Convert the result object to an object ready to be used by the response object.
   *
   * @return {R} object ready to be used by the response object
   */
  protected toResponseReady(): PostGetResponseParam {
    return {
      lang: this.post[MultiLingualDocumentKey.language],
      isAltLang: this.isAltLang,
      otherLangs: this.otherLangs,
      viewCount: this.post[ViewCountableDocumentKey.viewCount],
      editNotes: this.post[EditableDocumentKey.editNotes].map((doc) => {
        return {
          timestampEpoch: doc[EditNoteDocumentKey.timestampEpoch],
          note: doc[EditNoteDocumentKey.note],
        };
      }),
      modifiedEpoch: this.post[EditableDocumentKey.dateModifiedEpoch],
      publishedEpoch: this.post[EditableDocumentKey.datePublishedEpoch],
    };
  }
}

export type ResultConstructFunction<D extends PostDocumentBaseNoTitle,
  T extends PostGetResult<D>> =
  (post: D, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) => T;
