import {SupportedLanguages} from '../../../../api-def/api';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {PostDocumentBaseNoTitle} from '../model';
import {PostGetResponseParam} from '../response/post/get';


export type PostGetResultOpts<T extends PostDocumentBaseNoTitle> = {
  post: T,
  isAltLang: boolean,
  otherLangs: Array<SupportedLanguages>,
  userSubscribed: boolean,
};

/**
 * Base object of a post getting result.
 * @template T, R
 */
export abstract class PostGetResult<T extends PostDocumentBaseNoTitle> {
  post: T;
  isAltLang: boolean;
  otherLangs: Array<SupportedLanguages>;
  userSubscribed: boolean;

  /**
   * Construct a post getting result object.
   *
   * @param {PostGetResultOpts} options options to create a post get result
   * @protected
   */
  protected constructor({post, isAltLang, otherLangs, userSubscribed}: PostGetResultOpts<T>) {
    this.post = post;
    this.isAltLang = isAltLang;
    this.otherLangs = otherLangs;
    this.userSubscribed = userSubscribed;
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
      userSubscribed: this.userSubscribed,
    };
  }
}

export type ResultConstructFunction< D extends PostDocumentBaseNoTitle, T extends PostGetResult<D>> =
  (options: PostGetResultOpts<D>) => T;
