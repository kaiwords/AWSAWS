#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { S3WebsiteStack } from '../lib/s3-website-stack';

const app = new cdk.App();

new S3WebsiteStack(app, 'FullStackLearningFrontendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'S3 static website hosting for the Fullstack Learning App',
});
