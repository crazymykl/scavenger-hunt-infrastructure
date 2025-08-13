import { CfnOutput, Stack, StackProps } from "aws-cdk-lib"
import {
  AccessLevel,
  Distribution,
  KeyGroup,
  LambdaEdgeEventType,
  PriceClass,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront"
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins"
import { Code, Runtime, Function } from "aws-cdk-lib/aws-lambda"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"
import { CloudFrontKeyPair } from "aws-cdk-cloudfront-key-pair"
import path = require("path")
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { StageType } from "../stage-type"
import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53"
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets"
import { DomainInfo } from "./dns-stack"

interface AssetStackProps extends StackProps {
  readonly stageType: StageType
  readonly domainInfo?: DomainInfo
}

export class AssetStack extends Stack {
  readonly bucketName: CfnOutput
  readonly bucketArn: CfnOutput
  readonly distributionId: CfnOutput
  readonly distributionArn: CfnOutput
  readonly domainName: CfnOutput

  constructor(scope: Construct, id: string, props: AssetStackProps) {
    super(scope, id, props)

    const bucket = new Bucket(this, "bucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    })

    const { keyPair, publicKey, publicKeyIdSecretArn } = new CloudFrontKeyPair(
      this,
      "keyPair",
      {
        name: `admin-key-pair-${props.stageType}`,
        description: "restricts access to the admin (non-public) page",
      },
    )

    const keyGroup = new KeyGroup(this, "keyGroup", {
      items: [publicKey],
    })

    const origin = S3BucketOrigin.withOriginAccessControl(bucket, {
      originAccessLevels: [AccessLevel.READ],
    })

    const loginLambda = new Function(this, "loginLambda", {
      code: Code.fromAsset(
        path.join(__dirname, "../../handlers/login-lambda"),
        {
          bundling: {
            image: Runtime.NODEJS_22_X.bundlingImage,
            environment: {
              STAGE_TYPE: props.stageType,
            },
            command: [
              "bash",
              "-c",
              [
                "npm i",
                "npm run build",
                "cp dist/* package.json package-lock.json /asset-output",
              ].join(" && "),
            ],
          },
        },
      ),
      handler: "index.handler",
      runtime: Runtime.NODEJS_22_X,
      initialPolicy: [
        new PolicyStatement({
          actions: ["secretsmanager:GetSecretValue"],
          resources: [keyPair.privateKeyArn, publicKeyIdSecretArn],
          effect: Effect.ALLOW,
        }),
      ],
    })

    const defaultBehavior = {
      origin,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    }

    const adminBehavior = {
      ...defaultBehavior,
      trustedKeyGroups: [keyGroup],
    }

    const loginBehavior = {
      ...adminBehavior,
      edgeLambdas: [
        {
          functionVersion: loginLambda.currentVersion,
          eventType: LambdaEdgeEventType.VIEWER_REQUEST,
        },
      ],
    }

    const distribution = new Distribution(this, "cdn-distro", {
      additionalBehaviors: {
        "admin.html": adminBehavior,
        "hunt.shadow.json": adminBehavior,
        login: loginBehavior,
      },
      certificate: props.domainInfo?.certificate,
      defaultRootObject: "index.html",
      defaultBehavior,
      domainNames: props.domainInfo ? [props.domainInfo.domainName] : [],
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: "/index.html",
          responseHttpStatus: 200,
        },
      ],
      priceClass: PriceClass.PRICE_CLASS_100,
    })

    if (props.domainInfo) {
      new ARecord(this, "cdn-distro-record", {
        zone: props.domainInfo.hostedZone,
        recordName: props.domainInfo.domainName,
        target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      })
    }

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
    this.domainName = new CfnOutput(this, "domainName", {
      value:
        props.domainInfo?.domainName ?? distribution.distributionDomainName,
    })
  }
}
