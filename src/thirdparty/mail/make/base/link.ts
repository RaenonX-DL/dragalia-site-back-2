import env from 'env-var';
import urlJoin from 'url-join';

import {isCi} from '../../../../api-def/utils';


export const mailLinkRoot = env.get('MAIL_LINK_ROOT')
  .example('https://dl.raenonx.cc')
  .required(!isCi())
  .asString();

export const makeLink = (path: string): string => urlJoin(mailLinkRoot || 'https://dl.raenonx.cc', path);
