import * as dotenv from 'dotenv';

export = async (): Promise<void> => {
  dotenv.config();
  console.log('Global test setup');
}
