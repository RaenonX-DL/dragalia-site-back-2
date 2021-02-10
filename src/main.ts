import {runServer} from './app';

const PORT = parseInt(process.env.PORT || '8787');

runServer(PORT);
