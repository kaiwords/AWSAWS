import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class S3WebsiteStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- S3 bucket: static website hosting with public read ---
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      // Bucket name is deterministic so the pipeline can reference it via
      // CloudFormation outputs (no need to hardcode in secrets).
      bucketName: `fullstack-learning-app-${this.account}-${this.region}`,

      // Static website hosting
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',

      // Allow public read via bucket policy (not ACLs)
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),

      // Allow CDK/pipeline to delete objects and remove the bucket on destroy
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,

      // Enforce HTTPS-only access
      enforceSSL: true,

      // Server-side encryption at rest
      encryption: s3.BucketEncryption.S3_MANAGED,

      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Bucket policy: public read for all objects (required for static hosting)
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'PublicReadGetObject',
        effect: iam.Effect.ALLOW,
        principals: [new iam.StarPrincipal()],
        actions: ['s3:GetObject'],
        resources: [`${this.bucket.bucketArn}/*`],
      }),
    );

    // --- Outputs used by the GitHub Actions pipeline ---
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name — referenced in the CI/CD pipeline',
      exportName: `${this.stackName}-BucketName`,
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: this.bucket.bucketWebsiteUrl,
      description: 'Public S3 static website URL',
      exportName: `${this.stackName}-WebsiteURL`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'Bucket ARN — use this to scope IAM permissions for the deploy user',
      exportName: `${this.stackName}-BucketArn`,
    });

    // Reminder tag
    cdk.Tags.of(this).add('Project', 'fullstack-learning-app');
    cdk.Tags.of(this).add('ManagedBy', 'aws-cdk');
  }
}
