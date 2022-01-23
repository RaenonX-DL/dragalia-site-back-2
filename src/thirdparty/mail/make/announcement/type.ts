import {GenerateMailHtmlOpts, GenerateMailOpts} from '../base/type';


export type MakeMailSiteAnnouncementCommonOpts = {
  markdown: string,
};

export type MakeMailSiteAnnouncementOpts = GenerateMailOpts & MakeMailSiteAnnouncementCommonOpts;

export type MakeMailSiteAnnouncementHtmlOpts =
  GenerateMailHtmlOpts<MakeMailSiteAnnouncementOpts> &
  MakeMailSiteAnnouncementCommonOpts;
