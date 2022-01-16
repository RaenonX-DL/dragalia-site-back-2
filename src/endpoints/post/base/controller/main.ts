import {Collection, Document, Filter, UpdateFilter} from 'mongodb';

import {PostInfo, SupportedLanguages} from '../../../../api-def/api';
import {DocumentBaseKey} from '../../../../api-def/models';
import {UpdateResult} from '../../../../base/enum/updateResult';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {getCurrentEpoch} from '../../../../utils/misc';
import {PostDocumentBase, PostDocumentBaseNoTitle} from '../model';
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
  protected static async listPosts<E extends PostInfo, D extends PostDocumentBase>(
    collection: Collection<D>, lang: SupportedLanguages, options: PostControllerListOptions<E, D>,
  ): Promise<PostListResult<E>> {
    const {
      projection = {},
      transformFunc,
    } = options;

    const query = {[MultiLingualDocumentKey.language]: lang} as Filter<D>;

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
        limit: options.limit,
      })
      .toArray();

    return new PostListResult<E>(
      posts,
      transformFunc,
    );
  }

  /**
   * Get a specific post.
   *
   * If this is called for post displaying purpose, incCount should be true. Otherwise, it should be false.
   *
   * @param {Collection} collection mongo collection for getting the post
   * @param {Filter} findCondition base condition to use for finding the desired post
   * @param {SupportedLanguages} lang language of the post
   * @param {boolean} incCount if to increase the view count of the post or not
   * @param {ResultConstructFunction} resultConstructFunction function to construct the result object
   * @return {Promise<PostGetResult>} result of getting a post
   * @protected
   */
  protected static async getPost<
    D extends PostDocumentBaseNoTitle,
    T extends PostGetResult<D>>(
    collection: Collection<D>,
    findCondition: Filter<D>,
    lang = SupportedLanguages.CHT,
    incCount = true,
    resultConstructFunction: ResultConstructFunction<D, T>,
  ): Promise<T | null> {
    // Get the code of other available languages
    let otherLangs: SupportedLanguages[] = [];
    if (incCount) {
      // Only get the other available languages when incCount is true,
      // because incCount implied that the post fetch is for displaying purpose.
      // If incCount is false, it implies that the post fetch is for other purpose, such as post editing.

      const langsAvailable = await collection.find(
        {...findCondition, [MultiLingualDocumentKey.language]: {$ne: lang}} as Filter<D>,
        {projection: {[MultiLingualDocumentKey.language]: 1}},
      ).toArray();
      otherLangs = langsAvailable.map((doc) => doc[MultiLingualDocumentKey.language]);
    }

    const postDataUpdate = {
      $inc: {[ViewCountableDocumentKey.viewCount]: incCount ? 1 : 0},
    } as unknown as UpdateFilter<D>;

    let isAltLang = false;
    let post = await collection.findOneAndUpdate(
      {...findCondition, [MultiLingualDocumentKey.language]: lang} as Filter<D>,
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
   * @param {PostDocumentBaseNoTitle} update document used to replace the old post
   * @param {string} editNote post edit note
   * @return {Promise<UpdateResult>} promise of the update result
   * @protected
   */
  protected static async editPost<D extends PostDocumentBaseNoTitle>(
    collection: Collection<D>,
    filterCondition: Filter<D>,
    lang: SupportedLanguages,
    update: D,
    editNote: string,
  ): Promise<UpdateResult> {
    // Returns `NOT_FOUND` if `lang` is falsy - which post to update?
    if (!lang) {
      return 'NOT_FOUND';
    }

    const nowEpoch = getCurrentEpoch();

    // Create filter (condition for updating the post)
    const filter = {
      ...filterCondition,
      [MultiLingualDocumentKey.language]: lang,
    };

    // Remove the document keys to **not** to update
    const omitKeys = [
      DocumentBaseKey.id, // Document ID should be immutable
      MultiLingualDocumentKey.language, // Language should be immutable
      EditableDocumentKey.editNotes, // Edit notes should not be updated
      EditableDocumentKey.dateModifiedEpoch, // Last modified timestamp should be updated later
      EditableDocumentKey.datePublishedEpoch, // Publish timestamp should not be updated
      ViewCountableDocumentKey.viewCount, // Post view count should not be changed
      ...Object.keys(filterCondition), // Any key that is used as the post selecting criteria
    ];
    omitKeys.forEach((key) => delete (update as Document)[key]);

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
    await collection.updateOne(
      filter,
      {
        $set: {[EditableDocumentKey.dateModifiedEpoch]: nowEpoch},
        $push: {
          [EditableDocumentKey.editNotes]: {
            [EditNoteDocumentKey.timestampEpoch]: nowEpoch,
            [EditNoteDocumentKey.note]: editNote,
          },
        },
      } as unknown as UpdateFilter<D>,
    );

    return 'UPDATED';
  }
}
