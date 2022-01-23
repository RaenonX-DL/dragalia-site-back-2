import {GenerateMailHtmlOpts, GenerateMailOpts, MakeMailContentUpdatedCommonOpts} from '../base/type';


export type MakeMailTierUpdatedOpts = GenerateMailOpts & MakeMailContentUpdatedCommonOpts;

export type MakeMailTierUpdatedHtmlOpts =
  GenerateMailHtmlOpts<MakeMailTierUpdatedOpts> &
  MakeMailContentUpdatedCommonOpts;
