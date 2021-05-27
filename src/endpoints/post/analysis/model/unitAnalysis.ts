import {Collection, MongoClient} from 'mongodb';

import {AnalysisBody, UnitType} from '../../../../api-def/api';
import {EditableDocumentKey, EditNote} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {PostConstructParamsNoTitle, PostDocumentBaseNoTitle, PostNoTitle} from '../../base/model';
import {dbInfo} from './config';

export enum UnitAnalysisDocumentKey {
  type = 'tp',
  unitId = 'id',
  summary = 'sm',
  summonResult = 'r',
  passives = 'p',
  normalAttacks = 'na',
  videos = 'v',
  story = 'st',
  keywords = 'k',
}

export type UnitAnalysisDocument = PostDocumentBaseNoTitle & {
  [UnitAnalysisDocumentKey.type]: UnitType,
  [UnitAnalysisDocumentKey.unitId]: number,
  [UnitAnalysisDocumentKey.summary]: string,
  [UnitAnalysisDocumentKey.summonResult]: string,
  [UnitAnalysisDocumentKey.passives]: string,
  [UnitAnalysisDocumentKey.normalAttacks]: string,
  [UnitAnalysisDocumentKey.videos]: string,
  [UnitAnalysisDocumentKey.story]: string,
  [UnitAnalysisDocumentKey.keywords]: string,
}

export type UnitAnalysisConstructParams = PostConstructParamsNoTitle & {
  type: UnitType,
  unitId: number,
  summary: string,
  summonResult: string,
  passives: string,
  normalAttacks: string,
  videos: string,
  story: string,
  keywords: string,
}

/**
 * Unit analysis base class.
 */
export abstract class UnitAnalysis extends PostNoTitle {
  type: UnitType;
  unitId: number;
  summary: string;
  summonResult: string;
  passives: string;
  normalAttacks: string;
  videos: string;
  story: string;
  keywords: string;

  /**
   * Construct a unit analysis data.
   *
   * @param {UnitAnalysisConstructParams} params parameters to construct a unit analysis
   */
  protected constructor(params: UnitAnalysisConstructParams) {
    super(params);

    const {type, unitId, summary, summonResult, passives, normalAttacks, videos, story, keywords} = params;

    this.type = type;
    this.unitId = unitId;
    this.summary = summary;
    this.summonResult = summonResult;
    this.passives = passives;
    this.normalAttacks = normalAttacks;
    this.videos = videos;
    this.story = story;
    this.keywords = keywords;
  }

  /**
   * Convert `payload` to an instance of construct params.
   *
   * @param {T} payload payload to be converted
   * @param {UnitType} type type of the unit analysis
   * @return {UnitAnalysisConstructParams} converted construct params
   */
  static fromPayloadToConstructParams<T extends AnalysisBody>(
    payload: T, type: UnitType,
  ): UnitAnalysisConstructParams {
    return {
      ...payload,
      type,
    };
  }

  /**
   * Convert `obj` to an instance to an instance of construct params.
   *
   * @param {T} obj object to be converted
   * @param {UnitType} type type of the unit analysis
   * @return {UnitAnalysisConstructParams} converted construct params
   * @protected
   */
  protected static fromDocumentToConstructParams<T extends UnitAnalysisDocument>(
    obj: T, type: UnitType,
  ): UnitAnalysisConstructParams {
    return {
      type,
      lang: obj[MultiLingualDocumentKey.language],
      unitId: obj[UnitAnalysisDocumentKey.unitId],
      summary: obj[UnitAnalysisDocumentKey.summary],
      summonResult: obj[UnitAnalysisDocumentKey.summonResult],
      passives: obj[UnitAnalysisDocumentKey.passives],
      normalAttacks: obj[UnitAnalysisDocumentKey.normalAttacks],
      videos: obj[UnitAnalysisDocumentKey.videos],
      story: obj[UnitAnalysisDocumentKey.story],
      keywords: obj[UnitAnalysisDocumentKey.keywords],
      editNotes: obj[EditableDocumentKey.editNotes].map((editNote) => EditNote.fromDocument(editNote)),
    };
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo, ((collection) => {
      collection.createIndex(
        [
          {[UnitAnalysisDocumentKey.unitId]: 1},
          {[MultiLingualDocumentKey.language]: 1},
        ],
        {unique: true},
      );
    }));
  }

  /**
   * @inheritDoc
   */
  toObject(): UnitAnalysisDocument {
    return {
      ...super.toObject(),
      [UnitAnalysisDocumentKey.type]: this.type,
      [UnitAnalysisDocumentKey.unitId]: this.unitId,
      [UnitAnalysisDocumentKey.summary]: this.summary,
      [UnitAnalysisDocumentKey.summonResult]: this.summonResult,
      [UnitAnalysisDocumentKey.passives]: this.passives,
      [UnitAnalysisDocumentKey.normalAttacks]: this.normalAttacks,
      [UnitAnalysisDocumentKey.videos]: this.videos,
      [UnitAnalysisDocumentKey.story]: this.story,
      [UnitAnalysisDocumentKey.keywords]: this.keywords,
    };
  }
}
