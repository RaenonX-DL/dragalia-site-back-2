import {DataType} from '../../../../api-def/api';
import {DataMetaHandler} from '../type';
import {datamineHandler} from './datamine';
import {tierKeyPointHandler} from './tierKeyPoint';


export const dataMetaHandlers: {[type in DataType]: DataMetaHandler} = {
  tierKeyPoint: tierKeyPointHandler,
  datamine: datamineHandler,
};
