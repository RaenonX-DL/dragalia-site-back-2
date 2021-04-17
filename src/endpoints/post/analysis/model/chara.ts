import {Collection, MongoClient} from 'mongodb';
import {AnalysisType, CharaAnalysisPayload} from '../../../../api-def/api';
import {MultiLingualDocumentKey} from '../../../../base/model/multiLang';
import {SequentialDocumentKey} from '../../../../base/model/seq';
import {PostDocumentKey} from '../../base/model';
import {SeqIdMissingError} from '../../error';
import {CharaAnalysisSkill, CharaAnalysisSkillDocument} from './charaSkill';
import {dbInfo} from './config';
import {
  UnitAnalysis,
  UnitAnalysisConstructParams,
  UnitAnalysisDocument,
  UnitAnalysisDocumentKey,
} from './unitAnalysis';


export enum CharaAnalysisDocumentKey {
  forceStrike = 'fs',
  skills = 'sk',
  tipsBuilds = 'tb',
}

export type CharaAnalysisDocument = UnitAnalysisDocument & {
  [CharaAnalysisDocumentKey.forceStrike]: string,
  [CharaAnalysisDocumentKey.skills]: Array<CharaAnalysisSkillDocument>,
  [CharaAnalysisDocumentKey.tipsBuilds]: string,
}

export type CharaAnalysisConstructParams = Omit<UnitAnalysisConstructParams, 'type'> & {
  forceStrike: string,
  skills: Array<CharaAnalysisSkill>,
  tipsBuilds: string,
}

/**
 * Character analysis data class.
 */
export class CharaAnalysis extends UnitAnalysis {
  forceStrike: string;
  skills: Array<CharaAnalysisSkill>;
  tipsBuilds: string;

  /**
   * Construct a chara analysis data.
   *
   * @param {CharaAnalysisConstructParams} params parameters to construct a character analysis
   */
  constructor(params: CharaAnalysisConstructParams) {
    super({
      ...params,
      type: AnalysisType.CHARACTER,
    });

    this.forceStrike = params.forceStrike;
    this.skills = params.skills;
    this.tipsBuilds = params.tipsBuilds;
  }

  /**
   * Convert `payload` to a `CharaAnalysis`.
   *
   * @param {T} payload payload to be converted
   * @return {QuestPost} converted character analysis instance
   */
  static fromPayload<T extends CharaAnalysisPayload>(payload: T): CharaAnalysis {
    if (!payload.seqId) {
      throw new SeqIdMissingError();
    }

    return new CharaAnalysis({
      ...super.fromPayloadToConstructParams(payload, AnalysisType.CHARACTER),
      forceStrike: payload.forceStrikes,
      skills: payload.skills.map((skill) => new CharaAnalysisSkill(skill)),
      tipsBuilds: payload.tipsBuilds,
    });
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: CharaAnalysisDocument): CharaAnalysis {
    return new CharaAnalysis(
      {
        seqId: obj[SequentialDocumentKey.sequenceId],
        language: obj[MultiLingualDocumentKey.language],
        title: obj[PostDocumentKey.title],
        summary: obj[UnitAnalysisDocumentKey.summary],
        summonResult: obj[UnitAnalysisDocumentKey.summonResult],
        passives: obj[UnitAnalysisDocumentKey.passives],
        normalAttacks: obj[UnitAnalysisDocumentKey.normalAttacks],
        forceStrike: obj[CharaAnalysisDocumentKey.forceStrike],
        skills: obj[CharaAnalysisDocumentKey.skills].map((doc) => CharaAnalysisSkill.fromDocument(doc)),
        tipsBuilds: obj[CharaAnalysisDocumentKey.tipsBuilds],
        videos: obj[UnitAnalysisDocumentKey.videos],
        story: obj[UnitAnalysisDocumentKey.story],
        keywords: obj[UnitAnalysisDocumentKey.keywords],
      },
    );
  }

  /**
   * @inheritDoc
   */
  static getCollection(mongoClient: MongoClient): Collection {
    return super.getCollectionWithInfo(mongoClient, dbInfo);
  }

  /**
   * @inheritDoc
   */
  toObject(): CharaAnalysisDocument {
    return {
      ...super.toObject(),
      [CharaAnalysisDocumentKey.forceStrike]: this.forceStrike,
      [CharaAnalysisDocumentKey.skills]: this.skills.map((obj) => obj.toObject()),
      [CharaAnalysisDocumentKey.tipsBuilds]: this.tipsBuilds,
    };
  }
}
