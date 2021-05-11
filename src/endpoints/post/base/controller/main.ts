import {Collection, Document, MongoClient} from 'mongodb';

import {PostListEntry, SupportedLanguages} from '../../../../api-def/api';
import {SequencedController} from '../../../../base/controller/seq';
import {UpdateResult} from '../../../../base/enum/updateResult';
import {DocumentBaseKey} from '../../../../base/model/base';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {PostDocumentBase, PostDocumentKey} from '../model';
import {PostGetResult, ResultConstructFunction} from './get';
import {PostControllerListOptions, PostListResult} from './list';


/**
 * Sequence controller.
 */
export abstract class PostController extends SequencedController {
  /**
   * Get a list of posts.
   *
   * @param {Collection} collection collection to perform the post listing
   * @param {string} langCode language of the posts
   * @param {PostControllerListOptions} options additional options for listing the posts
   * @return {Promise<PostListResult>} promise containing a list of post documents
   * @protected
   */
  protected static async listPosts<E extends PostListEntry, D extends Document>(
    collection: Collection, langCode: string, options: PostControllerListOptions<E, D>,
  ): Promise<PostListResult<E>> {
    const {
      start = 0,
      limit = 0,
      projection = {},
      transformFunc,
    } = options;

    const query = {[MultiLingualDocumentKey.language]: langCode};

    const posts = await collection.find(
      query,
      {
        projection: {
          ...projection,
          [SequentialDocumentKey.sequenceId]: 1,
          [MultiLingualDocumentKey.language]: 1,
          [PostDocumentKey.title]: 1,
          [EditableDocumentKey.dateModified]: 1,
          [EditableDocumentKey.datePublished]: 1,
          [ViewCountableDocumentKey.viewCount]: 1,
        },
        sort: {[EditableDocumentKey.dateModified]: 'desc'},
      })
      .skip(start)
      .limit(limit)
      .toArray();

    const totalAvailableCount = await collection.countDocuments(query);

    return new PostListResult<E>(
      posts,
      totalAvailableCount,
      transformFunc,
    );
  }

  /**
   * Get a specific post.
   *
   * If this is called for post displaying purpose, incCount should be true. Otherwise, it should be false.
   *
   * @param {Collection} collection mongo collection for getting the post
   * @param {number} seqId sequence ID of the post
   * @param {SupportedLanguages} lang language of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @param {ResultConstructFunction} resultConstructFunction function to construct the result object
   * @return {Promise<T>} result of getting a post
   * @protected
   */
  protected static async getPost<D extends PostDocumentBase,
    T extends PostGetResult<D>>(
    collection: Collection, seqId: number, lang = SupportedLanguages.CHT, incCount = true,
    resultConstructFunction: ResultConstructFunction<D, T>,
  ): Promise<T | null> {
    // Get the code of other available languages
    let otherLangs = [];
    if (incCount) {
      // Only get the other available languages when incCount is true,
      // because incCount implied that the post fetch is for displaying purpose.
      // If incCount is false, it implies that the post fetch is for other purpose, such as post editing.

      const langCodesAvailable = await collection.find(
        {[SequentialDocumentKey.sequenceId]: seqId, [MultiLingualDocumentKey.language]: {$ne: lang}},
        {projection: {[MultiLingualDocumentKey.language]: 1}},
      ).toArray();
      otherLangs = langCodesAvailable.map((doc) => doc[MultiLingualDocumentKey.language]);
    }

    const postDataUpdate = {$inc: {[ViewCountableDocumentKey.viewCount]: incCount ? 1 : 0}};

    let isAltLang = false;
    let post = await collection.findOneAndUpdate(
      {[SequentialDocumentKey.sequenceId]: seqId, [MultiLingualDocumentKey.language]: lang},
      postDataUpdate,
    );

    if (!post.value) {
      post = await collection.findOneAndUpdate(
        {[SequentialDocumentKey.sequenceId]: seqId},
        postDataUpdate,
      );
      if (!post.value) { // Post with the given ID not found
        return null;
      }

      isAltLang = true;
    }

    return resultConstructFunction(post.value as D, isAltLang, otherLangs);
  }

  /**
   * Edit a post.
   *
   * If any of ``seqId`` or ``langCode`` is ``undefined``,
   * ``NOT_FOUND`` will be returned.
   *
   * Note that several document fields will not be updated, and no messages will be emitted.
   *
   * This includes:
   *
   * - Document ID
   * - Sequential ID
   * - Language
   * - Edit notes
   * - Last Modified timestamp
   * - Publish timestamp
   * - View count
   *
   * @param {Collection} collection mongo collection containing the post to be edited
   * @param {number | undefined} seqId sequential ID of the post to be edited
   * @param {string | undefined} langCode language code of the post to be edited
   * @param {D} update document used to replace the old post
   * @param {string} editNote post edit note
   * @param {D} additionalFilter additional filtering conditions
   * @return {Promise<UpdateResult>} promise of the update result
   * @protected
   */
  protected static async editPost<D extends PostDocumentBase>(
    collection: Collection,
    seqId: number | undefined,
    langCode: string | undefined,
    update: D,
    editNote: string,
    additionalFilter?: D,
  ): Promise<UpdateResult> {
    // Returns `NOT_FOUND` if `seqId` or `langCode` is falsy - which post to update?
    if (!seqId || !langCode) {
      return 'NOT_FOUND';
    }

    const now = new Date();

    // Create filter (condition for updating the post)
    let filter = {
      [SequentialDocumentKey.sequenceId]: seqId,
      [MultiLingualDocumentKey.language]: langCode,
    };
    if (additionalFilter) {
      filter = {
        ...filter,
        ...additionalFilter,
      };
    }

    // Remove the document keys to **not** to update
    const omitKeys = [
      DocumentBaseKey.id, // Document ID should be immutable
      SequentialDocumentKey.sequenceId, // Sequential ID should be immutable
      MultiLingualDocumentKey.language, // Language should be immutable
      EditableDocumentKey.editNotes, // Edit notes should not be updated
      EditableDocumentKey.dateModified, // Last modified timestamp should be updated later
      EditableDocumentKey.datePublished, // Publish timestamp should not be updated
      ViewCountableDocumentKey.viewCount, // Post view count should not be changed
    ];
    omitKeys.forEach((key) => delete update[key]);

    const updateResult = await collection.updateOne(filter, {$set: update});

    // Check if there is any document that matches the criteria
    if (!updateResult.matchedCount) {
      return 'NOT_FOUND';
    }

    // Check if there is any document changed
    if (!updateResult.modifiedCount) {
      return 'NO_CHANGE';
    }

    // Add edit note and update the last modified timestamp
    await collection.updateOne(filter, {
      $set: {[EditableDocumentKey.dateModified]: now},
      $push: {
        [EditableDocumentKey.editNotes]: {
          [EditNoteDocumentKey.datetime]: now,
          [EditNoteDocumentKey.note]: editNote,
        },
      },
    });

    return 'UPDATED';
  }

  /**
   * Check if the given ID is available.
   *
   * If ``seqId`` is omitted, returns ``true``.
   * (a new ID will be automatically generated and used when publishing a post without specifying it)
   *
   * @param {T} controller class of the controller
   * @param {MongoClient} mongoClient mongo client
   * @param {Collection} collection mongo collection to check
   * @param {string} langCode post language code to be checked
   * @param {number} seqId post sequential ID to be checked
   * @return {Promise<boolean>} promise containing the availability of the ID
   */
  protected static async isIdAvailable<T extends typeof PostController>(
    controller: T, mongoClient: MongoClient, collection: Collection, langCode: string, seqId?: number,
  ): Promise<boolean> {
    if (!seqId) {
      return true;
    }
    if (seqId < 0) {
      return false;
    }

    const nextSeqId = await controller.getNextSeqId(mongoClient, {increase: false});
    if (seqId > nextSeqId + 1) {
      return false;
    }

    return !await collection
      .findOne({
        [SequentialDocumentKey.sequenceId]: seqId,
        [MultiLingualDocumentKey.language]: langCode,
      });
  }
}
