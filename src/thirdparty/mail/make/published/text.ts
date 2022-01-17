import {SupportedLanguages} from '../../../../api-def/api';
import {MakeMailContentPublishedOpts} from './type';


export const makeMailContentPublishedText = ({
  lang, title, sitePath,
}: MakeMailContentPublishedOpts): string => {
  if (lang === SupportedLanguages.EN) {
    return `Post: ${title} has published. Link: ${sitePath}.`;
  }

  return `文章: ${title} 已發布。連結: ${sitePath}`;
};
