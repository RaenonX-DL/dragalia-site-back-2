import {SupportedLanguages} from '../../../../api-def/api';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {PostDocumentBase, PostDocumentKey} from '../model';
import {PostGetSuccessResponseParam} from '../response/post/get';

/**
 * Base object of a post getting result.
 * @template T, R
 */
export abstract class PostGetResult<T extends PostDocumentBase> {
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
  protected toResponseReady(): PostGetSuccessResponseParam {
    return {
      seqId: this.post[SequentialDocumentKey.sequenceId],
      lang: this.post[MultiLingualDocumentKey.language],
      title: this.post[PostDocumentKey.title],
      isAltLang: this.isAltLang,
      otherLangs: this.otherLangs,
      viewCount: this.post[ViewCountableDocumentKey.viewCount],
      editNotes: this.post[EditableDocumentKey.editNotes].map((doc) => {
        return {
          timestamp: doc[EditNoteDocumentKey.datetime],
          note: doc[EditNoteDocumentKey.note],
        };
      }),
      modified: this.post[EditableDocumentKey.dateModified],
      published: this.post[EditableDocumentKey.datePublished],
    };
  }
}

export type ResultConstructFunction<D extends PostDocumentBase,
  T extends PostGetResult<D>> =
  (post: D, isAltLang: boolean, otherLangs: Array<SupportedLanguages>) => T;
