import { Stack, StackProps } from "aws-cdk-lib"
import { AccessLevel, Distribution } from "aws-cdk-lib/aws-cloudfront"
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"

export class AssetStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const bucket = new Bucket(this, "bucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    })

    new Distribution(this, "cdn-distro", {
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
  }
}
