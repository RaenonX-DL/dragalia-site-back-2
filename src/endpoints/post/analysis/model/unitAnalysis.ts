import {Collection, MongoClient} from 'mongodb';

import {AnalysisBody, UnitType} from '../../../../api-def/api';
import {EditableDocumentKey, EditNote} from '../../../../base/model/editable';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {getCollection} from '../../../../utils/mongodb';
import {PostConstructParamsNoTitle, PostDocumentBaseNoTitle, PostNoTitle} from '../../base/model';
import {dbInfo} from './config';
import {AnalysisDocument} from './type';


export enum UnitAnalysisDocumentKey {
  type = 'tp',
  unitId = 'id',
  summary = 'sm',
  summonResult = 'r',
  passives = 'p',
  normalAttacks = 'na',
  videos = 'v',
}

export type UnitAnalysisDocumentBase = PostDocumentBaseNoTitle & {
  [UnitAnalysisDocumentKey.type]: UnitType,
  [UnitAnalysisDocumentKey.unitId]: number,
  [UnitAnalysisDocumentKey.summary]: string,
  [UnitAnalysisDocumentKey.summonResult]: string,
  [UnitAnalysisDocumentKey.passives]: string,
  [UnitAnalysisDocumentKey.normalAttacks]: string,
  [UnitAnalysisDocumentKey.videos]: string,
  // Legacy usage
  [SequentialDocumentKey.sequenceId]?: number,
};

export type UnitAnalysisConstructParams = PostConstructParamsNoTitle & {
  type: UnitType,
  unitId: number,
  summary: string,
  summonResult: string,
  passives: string,
  normalAttacks: string,
  videos: string,
};

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

  /**
   * Construct a unit analysis data.
   *
   * @param {UnitAnalysisConstructParams} params parameters to construct a unit analysis
   */
  protected constructor(params: UnitAnalysisConstructParams) {
    super(params);

    const {type, unitId, summary, summonResult, passives, normalAttacks, videos} = params;

    this.type = type;
    this.unitId = unitId;
    this.summary = summary;
    this.summonResult = summonResult;
    this.passives = passives;
    this.normalAttacks = normalAttacks;
    this.videos = videos;
  }

  /**
   * Convert `payload` to an instance of construct params.
   *
   * @param {AnalysisBody} payload payload to be converted
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
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection<AnalysisDocument> {
    return getCollection<AnalysisDocument>(mongoClient, dbInfo, (collection) => {
      collection.createIndex(
        [
          {[UnitAnalysisDocumentKey.unitId]: 1},
          {[MultiLingualDocumentKey.language]: 1},
        ],
        {unique: true},
        // Empty function to avoid `createdIndex` returning promise
        // https://github.com/nodkz/mongodb-memory-server/issues/598#issuecomment-1015311729
        () => void 0,
      );
    });
  }

  /**
   * Convert `obj` to an instance to an instance of construct params.
   *
   * @param {UnitAnalysisDocumentBase} obj object to be converted
   * @param {UnitType} type type of the unit analysis
   * @return {UnitAnalysisConstructParams} converted construct params
   * @protected
   */
  protected static fromDocumentToConstructParams<T extends AnalysisDocument>(
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
      editNotes: obj[EditableDocumentKey.editNotes].map((editNote) => EditNote.fromDocument(editNote)),
    };
  }

  /**
   * @inheritDoc
   */
  toObject(): UnitAnalysisDocumentBase {
    return {
      ...super.toObject(),
      [UnitAnalysisDocumentKey.type]: this.type,
      [UnitAnalysisDocumentKey.unitId]: this.unitId,
      [UnitAnalysisDocumentKey.summary]: this.summary,
      [UnitAnalysisDocumentKey.summonResult]: this.summonResult,
      [UnitAnalysisDocumentKey.passives]: this.passives,
      [UnitAnalysisDocumentKey.normalAttacks]: this.normalAttacks,
      [UnitAnalysisDocumentKey.videos]: this.videos,
    };
  }
}
