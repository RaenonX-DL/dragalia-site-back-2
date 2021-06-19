import {ApiResponseCode, PostPageMetaPayload} from '../../../api-def/api';
import {processPostMetaPayload} from '../../../utils/payload';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {UserController} from '../../userControl/controller';
import {generateResponse} from '../utils';
import {ParamGetters} from './paramGetters';
import {PostPageMetaResponse} from './response';


export const handlePostMeta = async ({
  payload,
  mongoClient,
}: HandlerParams<PostPageMetaPayload>): Promise<PostPageMetaResponse | ApiFailedResponse> => {
  payload = processPostMetaPayload(payload);

  const userData = await UserController.getUserData(mongoClient, payload.uid);
  const params = await ParamGetters[payload.postType](mongoClient, payload.postId, payload.lang);

  if (!params) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS);
  }

  return await generateResponse(
    payload,
    mongoClient,
    userData,
    (options) => new PostPageMetaResponse({
      ...options,
      params,
    }),
  );
};
