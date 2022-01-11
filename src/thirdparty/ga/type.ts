import {HomepageData} from '../../api-def/api';
import {ResourceCache} from '../../utils/cache/types';


export type GACache = ResourceCache<HomepageData['stats']['user']>;
