import {Collection, Document, Filter, UpdateFilter} from 'mongodb';

import {PostInfo, SupportedLanguages} from '../../../../api-def/api';
import {DocumentBaseKey} from '../../../../api-def/models';
import {UpdateResult} from '../../../../base/enum/updateResult';
import {EditableDocumentKey, EditNoteDocumentKey} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {ViewCountableDocumentKey} from '../../../../base/model/viewCount';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {getCurrentEpoch} from '../../../../utils/misc';
import {PostDocumentBase, PostDocumentBaseNoTitle} from '../model';
import {PostGetResult} from './get';
import {PostListResult} from './list';
import {InternalGetPostOptions, InternalListPostOptions} from './type';


/**
 * Sequence controller.
 */
export abstract class PostController {
  /**
   * Get a list of posts.
   *
   * @param {InternalListPostOptions} options options for getting the post list
   * @protected
   */
  protected static async listPosts<E extends PostInfo, D extends PostDocumentBase>(
    options: InternalListPostOptions<E, D>,
  ): Promise<PostListResult<E>> {
    const {
      mongoClient,
      uid,
      lang,
      postCollection,
      postType,
      projection = {},
      transformFunc,
      limit,
      globalSubscriptionKey,
    } = options;

    const [subscriptionKeys, posts] = await Promise.all([
      SubscriptionRecordController.getSubscriptionsOfUser(mongoClient, uid),
      postCollection.find(
        {[MultiLingualDocumentKey.language]: lang} as Filter<D>,
        {
          projection: {
            ...projection,
            [MultiLingualDocumentKey.language]: 1,
            [EditableDocumentKey.dateModifiedEpoch]: 1,
            [EditableDocumentKey.datePublishedEpoch]: 1,
            [ViewCountableDocumentKey.viewCount]: 1,
          },
          sort: {[EditableDocumentKey.dateModifiedEpoch]: 'desc'},
          limit,
        })
        .toArray(),
    ]);

    return new PostListResult<E>({
      posts,
      docTransformFunction: transformFunc,
      subscriptionKeys,
      globalSubscriptionKey,
      postType,
    });
  }

  /**
   * Get a specific post.
   *
   * If this is called for post displaying purpose, incCount should be `true`.
   * Otherwise, it should be `false`.
   *
   * @param {InternalGetPostOptions} options options to get a post
   * @return {Promise<PostGetResult>} result of getting a post
   * @protected
   */
  protected static async getPost<
    D extends PostDocumentBaseNoTitle,
    T extends PostGetResult<D>
  >(options: InternalGetPostOptions<D, T>): Promise<T | null> {
    const {
      mongoClient,
      collection,
      uid,
      findCondition,
      resultConstructFunction,
      isSubscribed,
      lang = SupportedLanguages.CHT,
      incCount = true,
    } = options;

    const postDataUpdate = {
      $inc: {[ViewCountableDocumentKey.viewCount]: incCount ? 1 : 0},
    } as unknown as UpdateFilter<D>;

    let isAltLang = false;
    let [postDoc, otherLangs, subscriptionKeys] = await Promise.all([
      collection.findOneAndUpdate(
        {...findCondition, [MultiLingualDocumentKey.language]: lang} as Filter<D>,
        postDataUpdate,
      ),
      PostController.getOtherAvailableLangOfPost(options),
      SubscriptionRecordController.getSubscriptionsOfUser(mongoClient, uid),
    ]);

    if (!postDoc.value) {
      // Update the post in alt lang
      (postDoc = await collection.findOneAndUpdate(
        findCondition,
        postDataUpdate,
      ));
      if (!postDoc.value) { // Post with the given ID not found
        return null;
      }

      isAltLang = true;
    }

    const post = postDoc.value as D;

    return resultConstructFunction({
      post,
      isAltLang,
      otherLangs,
      userSubscribed: subscriptionKeys.some((key) => isSubscribed(key, post)),
    });
  }

  /**
   * Get the other available language of a post.
   *
   * @param {InternalGetPostOptions} options options to get a post
   * @return {Promise<SupportedLanguages[]>} available languages of a post
   * @private
   */
  private static async getOtherAvailableLangOfPost<
    D extends PostDocumentBaseNoTitle,
    T extends PostGetResult<D>
  >(options: InternalGetPostOptions<D, T>): Promise<SupportedLanguages[]> {
    const {
      collection,
      findCondition,
      lang = SupportedLanguages.CHT,
      incCount = true,
    } = options;

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

    return otherLangs;
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
