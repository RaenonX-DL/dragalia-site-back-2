import {MongoClient, ObjectId} from 'mongodb';

import {InputDataPreset} from '../../../api-def/api';
import {DocumentBaseKey} from '../../../api-def/models';
import {AtkSkillPreset, AtkSkillPresetDocumentKey} from './model';


/**
 * Class to control ATK skill input presets.
 */
export class AtkSkillPresetController {
  /**
   * Get the ATK skill preset, if exists. Returns `null` if not found.
   *
   * Also, the preset expiry resets if the preset exists.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {string} presetId ID of the preset
   * @return {Promise<number>} post unit ID
   */
  static async getPreset(mongoClient: MongoClient, presetId: string): Promise<InputDataPreset | null> {
    try {
      const result = await AtkSkillPreset.getCollection(mongoClient)
        .findOneAndUpdate(
          {[DocumentBaseKey.id]: new ObjectId(presetId)},
          {$set: {[AtkSkillPresetDocumentKey.lastUsed]: new Date()}},
        );

      if (!result.value) {
        return null;
      }

      return result.value[AtkSkillPresetDocumentKey.preset];
    } catch (e) {
      if (e instanceof TypeError) {
        return null;
      }
      throw e;
    }
  }

  /**
   * Make an ATK skill preset and return its ID.
   *
   * @param {MongoClient} mongoClient mongo client
   * @param {InputDataPreset} preset ATK skill input preset body
   * @return {Promise<number>} post unit ID
   */
  static async makePreset(mongoClient: MongoClient, preset: InputDataPreset): Promise<ObjectId> {
    const obj = new AtkSkillPreset({preset});

    const insertResult = await AtkSkillPreset.getCollection(mongoClient).insertOne(obj.toObject());

    return insertResult.insertedId;
  }
}
