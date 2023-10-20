import awsServerlessExpress from 'aws-serverless-express';
import { app } from './app';

const server = awsServerlessExpress.createServer(app);

exports.handler = (event: any, context: any) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};
