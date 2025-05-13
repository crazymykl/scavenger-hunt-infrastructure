import { CfnOutput, Stack, StackProps } from "aws-cdk-lib"
import { AccessLevel, Distribution } from "aws-cdk-lib/aws-cloudfront"
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"

export class AssetStack extends Stack {
  readonly bucketName: CfnOutput
  readonly bucketArn: CfnOutput
  readonly distributionId: CfnOutput
  readonly distributionArn: CfnOutput

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const bucket = new Bucket(this, "bucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    })

    const distribution = new Distribution(this, "cdn-distro", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(bucket, {
          originAccessLevels: [AccessLevel.READ],
        }),
      },
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: "/index.html",
          responseHttpStatus: 200,
        },
      ],
    })

    this.bucketName = new CfnOutput(this, "bucketName", {
      value: bucket.bucketName,
    })
    this.bucketArn = new CfnOutput(this, "bucketArn", {
      value: bucket.bucketArn,
      exportName: `${this.stackName}-bucketArn`,
    })

    this.distributionId = new CfnOutput(this, "distributionId", {
      value: distribution.distributionId,
    })
    this.distributionArn = new CfnOutput(this, "distributionArn", {
      value: distribution.distributionArn,
      exportName: `${this.stackName}-distributionArn`,
    })
  }
}
