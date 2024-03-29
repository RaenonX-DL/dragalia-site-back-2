import {UnitType, DragonAnalysisPayload} from '../../../../api-def/api';
import {UnitAnalysis, UnitAnalysisConstructParams, UnitAnalysisDocumentBase} from './unitAnalysis';


export enum DragonAnalysisDocumentKey {
  ultimate = 'ult',
  notes = 'n',
  suitableCharacters = 'sc',
}

export type DragonAnalysisDocument = UnitAnalysisDocumentBase & {
  [DragonAnalysisDocumentKey.ultimate]: string,
  [DragonAnalysisDocumentKey.notes]: string,
  [DragonAnalysisDocumentKey.suitableCharacters]: string,
};

export type DragonAnalysisConstructParams = Omit<UnitAnalysisConstructParams, 'type'> & {
  ultimate: string,
  notes: string,
  suitableCharacters: string,
};

/**
 * Dragon analysis data class.
 */
export class DragonAnalysis extends UnitAnalysis {
  ultimate: string;
  notes: string;
  suitableCharacters: string;

  /**
   * Construct a dragon analysis data.
   *
   * @param {DragonAnalysisConstructParams} params parameters to construct a dragon analysis
   */
  constructor(params: DragonAnalysisConstructParams) {
    super({
      ...params,
      type: UnitType.DRAGON,
    });

    this.ultimate = params.ultimate;
    this.notes = params.notes;
    this.suitableCharacters = params.suitableCharacters;
  }

  /**
   * Convert `payload` to a `DragonAnalysis`.
   *
   * @param {DragonAnalysisPayload} payload payload to be converted
   * @return {QuestPost} converted dragon analysis instance
   */
  static fromPayload<T extends DragonAnalysisPayload>(payload: T): DragonAnalysis {
    return new DragonAnalysis({
      ...super.fromPayloadToConstructParams(payload, UnitType.DRAGON),
      ultimate: payload.ultimate,
      notes: payload.notes,
      suitableCharacters: payload.suitableCharacters,
    });
  }

  /**
   * @inheritDoc
   */
  static fromDocument(obj: DragonAnalysisDocument): DragonAnalysis {
    return new DragonAnalysis(
      {
        ...super.fromDocumentToConstructParams(obj, UnitType.DRAGON),
        ultimate: obj[DragonAnalysisDocumentKey.ultimate],
        notes: obj[DragonAnalysisDocumentKey.notes],
        suitableCharacters: obj[DragonAnalysisDocumentKey.suitableCharacters],
      },
    );
  }

  /**
   * @inheritDoc
   */
  toObject(): DragonAnalysisDocument {
    return {
      ...super.toObject(),
      [DragonAnalysisDocumentKey.ultimate]: this.ultimate,
      [DragonAnalysisDocumentKey.notes]: this.notes,
      [DragonAnalysisDocumentKey.suitableCharacters]: this.suitableCharacters,
    };
  }
}
