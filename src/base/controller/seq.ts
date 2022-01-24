import {Collection, Filter, MongoClient} from 'mongodb';

import {PostType, SupportedLanguages, EmailSendResult} from '../../api-def/api';
import {DocumentBase} from '../../api-def/models';
import {makePostUrl, toPostPath} from '../../api-def/paths';
import {sendMailPostEdited} from '../../thirdparty/mail/send/post/edited';
import {sendMailPostPublished} from '../../thirdparty/mail/send/post/published';
import {MultiLingualDocumentBase, MultiLingualDocumentKey} from '../model/multiLang';
import {SequentialDocumentBase, SequentialDocumentKey} from '../model/seq';


export type NextSeqIdOptions = {
  seqId?: number,
  increase?: boolean,
  lang?: SupportedLanguages,
};

type FuncGetCollection<T extends DocumentBase> = (mongoClient: MongoClient) => Promise<Collection<T>>;

type FuncGetNextSeqId = (mongoClient: MongoClient, options: NextSeqIdOptions) => Promise<number>;

type SendPostUpdatedEmailOpts = {
  mongoClient: MongoClient,
  lang: SupportedLanguages,
  postType: PostType,
  seqId: number,
  title: string,
};

type SendPostPublishedOpts = SendPostUpdatedEmailOpts;

type SendPostEditedOpts = SendPostUpdatedEmailOpts & {
  editNote: string,
};

/**
 * Sequence controller.
 */
export abstract class SequencedController {
  /**
   * Check if the given sequential ID is available.
   *
   * If ``seqId`` is omitted, returns ``true``.
   * (a new ID will be automatically generated and used when publishing a post without specifying it)
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {FuncGetCollection} getCollection function to get the mongo collection to use
   * @param {FuncGetNextSeqId} getNextSeqId function to get the next sequential ID
   * @param {SupportedLanguages} lang post language to be checked
   * @param {number} seqId post sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the sequential ID
   */
  static async isIdAvailable<T extends SequentialDocumentBase & MultiLingualDocumentBase>(
    mongoClient: MongoClient,
    getCollection: FuncGetCollection<T>,
    getNextSeqId: FuncGetNextSeqId,
    lang: SupportedLanguages,
    seqId?: number,
  ): Promise<boolean> {
    if (!seqId) {
      return true;
    }
    if (seqId < 0) {
      return false;
    }

    const nextSeqId = await getNextSeqId(mongoClient, {increase: false, lang});
    if (seqId > nextSeqId + 1) {
      return false;
    }

    const filter: Filter<T> = {
      [SequentialDocumentKey.sequenceId]: seqId,
      [MultiLingualDocumentKey.language]: lang,
    } as Filter<T>;

    // Cannot directly pass in the collection because for some reason,
    // if `seqId` is negative and the function is early-terminated,
    // the mongo client will be used for getting the collection and
    // triggers session expired error.
    // This happens when calling `npm run test:ci-jest`,
    // but not when calling `npm run test` or using the IDE builtin `jest` testing config.
    // ------------
    // False-negative of the inspection
    // noinspection JSVoidFunctionReturnValueUsed
    return !await (await getCollection(mongoClient)).findOne(filter);
  }

  /**
   * Sends a sequenced post published email.
   *
   * @param {SendPostPublishedOpts} options options for sending the post published email
   * @return {Promise<EmailSendResult>} email send result
   * @private
   */
  static async sendPostPublishedEmail({
    mongoClient,
    lang,
    postType,
    seqId,
    title,
  }: SendPostPublishedOpts): Promise<EmailSendResult> {
    return sendMailPostPublished({
      mongoClient,
      lang,
      postType,
      sitePath: makePostUrl(toPostPath[postType], {lang, pid: seqId}),
      title,
    });
  }

  /**
   * Sends a sequenced post edited email.
   *
   * @param {SendPostEditedOpts} options options for sending the post edited email
   * @return {Promise<EmailSendResult>} email send result
   * @private
   */
  static async sendPostEditedEmail({
    mongoClient,
    lang,
    postType,
    seqId,
    title,
    editNote,
  }: SendPostEditedOpts): Promise<EmailSendResult> {
    return sendMailPostEdited({
      mongoClient,
      lang,
      postType,
      postId: seqId,
      sitePath: makePostUrl(toPostPath[postType], {lang, pid: seqId}),
      title,
      editNote,
    });
  }
}
