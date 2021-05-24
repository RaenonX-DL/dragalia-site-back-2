import {Collection, Document} from 'mongodb';

import {PostMeta, SupportedLanguages} from '../../../../api-def/api';
import {UpdateResult} from '../../../../base/enum/updateResult';
import {DocumentBaseKey} from '../../../../base/model/base';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {PostDocumentBaseNoTitle} from '../model';
import {PostGetResult, ResultConstructFunction} from './get';
import {PostControllerListOptions, PostListResult} from './list';


/**
 * Sequence controller.
 */
export abstract class PostController {
  /**
   * Get a list of posts.
   *
   * @param {Collection} collection collection to perform the post listing
   * @param {SupportedLanguages} lang language of the posts
   * @param {PostControllerListOptions} options additional options for listing the posts
   * @return {Promise<PostListResult>} promise containing a list of post documents
   * @protected
   */
  protected static async listPosts<E extends PostMeta, D extends Document>(
    collection: Collection, lang: SupportedLanguages, options: PostControllerListOptions<E, D>,
  ): Promise<PostListResult<E>> {
    const {
      start = 0,
      limit = 0,
      projection = {},
      transformFunc,
    } = options;

    const query = {[MultiLingualDocumentKey.language]: lang};

    const posts = await collection.find(
      query,
      {
        projection: {
          ...projection,
          [MultiLingualDocumentKey.language]: 1,
          [EditableDocumentKey.dateModifiedEpoch]: 1,
          [EditableDocumentKey.datePublishedEpoch]: 1,
          [ViewCountableDocumentKey.viewCount]: 1,
        },
        sort: {[EditableDocumentKey.dateModifiedEpoch]: 'desc'},
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
   * @param {Document} findCondition base condition to use for finding the desired post
   * @param {SupportedLanguages} lang language of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @param {ResultConstructFunction} resultConstructFunction function to construct the result object
   * @return {Promise<T>} result of getting a post
   * @protected
   */
  protected static async getPost<D extends PostDocumentBaseNoTitle,
    T extends PostGetResult<D>>(
    collection: Collection,
    findCondition: Document,
    lang = SupportedLanguages.CHT,
    incCount = true,
    resultConstructFunction: ResultConstructFunction<D, T>,
  ): Promise<T | null> {
    // Get the code of other available languages
    let otherLangs = [];
    if (incCount) {
      // Only get the other available languages when incCount is true,
      // because incCount implied that the post fetch is for displaying purpose.
      // If incCount is false, it implies that the post fetch is for other purpose, such as post editing.

      const langsAvailable = await collection.find(
        {...findCondition, [MultiLingualDocumentKey.language]: {$ne: lang}},
        {projection: {[MultiLingualDocumentKey.language]: 1}},
      ).toArray();
      otherLangs = langsAvailable.map((doc) => doc[MultiLingualDocumentKey.language]);
    }

    const postDataUpdate = {$inc: {[ViewCountableDocumentKey.viewCount]: incCount ? 1 : 0}};

    let isAltLang = false;
    let post = await collection.findOneAndUpdate(
      {...findCondition, [MultiLingualDocumentKey.language]: lang},
      postDataUpdate,
    );

    if (!post.value) {
      post = await collection.findOneAndUpdate(
        findCondition,
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
   * If any of ``seqId`` or ``lang`` is ``undefined``,
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
   * @param {Document} filterCondition condition to select the post to edit
   * @param {string | undefined} lang language of the post to be edited
   * @param {D} update document used to replace the old post
   * @param {string} editNote post edit note
   * @param {D} additionalFilter additional filtering conditions
   * @return {Promise<UpdateResult>} promise of the update result
   * @protected
   */
  protected static async editPost<D extends PostDocumentBaseNoTitle>(
    collection: Collection,
    filterCondition: Document,
    lang: string | undefined,
    update: D,
    editNote: string,
    additionalFilter?: D,
  ): Promise<UpdateResult> {
    // Returns `NOT_FOUND` if `lang` is falsy - which post to update?
    if (!lang) {
      return 'NOT_FOUND';
    }

    const nowEpoch = new Date().valueOf();

    // Create filter (condition for updating the post)
    let filter = {
      ...filterCondition,
      [MultiLingualDocumentKey.language]: lang,
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
      MultiLingualDocumentKey.language, // Language should be immutable
      EditableDocumentKey.editNotes, // Edit notes should not be updated
      EditableDocumentKey.dateModifiedEpoch, // Last modified timestamp should be updated later
      EditableDocumentKey.datePublishedEpoch, // Publish timestamp should not be updated
      ViewCountableDocumentKey.viewCount, // Post view count should not be changed
      ...Object.keys(filterCondition), // Any keys that is used as the post selecting criteria
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
      $set: {[EditableDocumentKey.dateModifiedEpoch]: nowEpoch},
      $push: {
        [EditableDocumentKey.editNotes]: {
          [EditNoteDocumentKey.timestampEpoch]: nowEpoch,
          [EditNoteDocumentKey.note]: editNote,
        },
      },
    });

    return 'UPDATED';
  }
}
