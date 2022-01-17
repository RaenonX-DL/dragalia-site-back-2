import env from 'env-var';
import urlJoin from 'url-join';

import {isCi} from '../../../../api-def/utils';


const linkRoot = env.get('MAIL_LINK_ROOT')
  .example('https://dl.raenonx.cc')
  .required(!isCi())
  .asString();

export const makeLink = (path: string): string => urlJoin(linkRoot || 'https://dl.raenonx.cc', path);
