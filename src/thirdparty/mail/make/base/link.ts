import env from 'env-var';
import urlJoin from 'url-join';


const linkRoot = env.get('MAIL_LINK_ROOT')
  .example('https://dl.raenonx.cc')
  .required()
  .asString();

export const makeLink = (path: string): string => urlJoin(linkRoot, path);
