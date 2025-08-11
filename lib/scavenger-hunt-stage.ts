import { StageType } from "./stage-type"
import { Construct } from "constructs"
import { AssetStack } from "./stage/asset-stack"
import { Stage, StageProps } from "aws-cdk-lib"
import { CodeBuildStep, ShellStep } from "aws-cdk-lib/pipelines"
import { PolicyStatement } from "aws-cdk-lib/aws-iam"
import { HuntPipeline } from "./hunt-pipeline"
import { DnsStack } from "./stage/dns-stack"

interface ScavengerHuntStageProps extends StageProps {
  stageType: StageType
  domainName?: string
}

export class ScavengerHuntStage extends Stage {
  private assets: AssetStack

  constructor(scope: Construct, id: string, props: ScavengerHuntStageProps) {
    super(scope, id, props)

    const domainInfo = props.domainName
      ? new DnsStack(this, "dns", {
          domainName: props.domainName,
        }).domainInfo
      : undefined

    this.assets = new AssetStack(this, "assets", {
      stageType: props.stageType,
      domainInfo,
    })
  }

  addToPipeline(pipeline: HuntPipeline) {
    const { bucketName, bucketArn, distributionId, distributionArn } =
      this.assets

    const appBuild = new ShellStep("AppBuild", {
      input: pipeline.source,
      commands: ["npm ci", "npm run build"],
      primaryOutputDirectory: "dist",
    })

    const appDeploy = new CodeBuildStep("AppDeploy", {
      input: appBuild.primaryOutput,
      rolePolicyStatements: [
        new PolicyStatement({
          actions: ["s3:*"],
          resources: [`${bucketArn.importValue}/*`, bucketArn.importValue],
        }),
        new PolicyStatement({
          actions: ["cloudfront:CreateInvalidation"],
          resources: [distributionArn.importValue],
        }),
      ],
      envFromCfnOutputs: {
        BUCKET_NAME: bucketName,
        DISTRIBUTION_ID: distributionId,
      },
      commands: [
        "aws s3 sync . s3://${BUCKET_NAME}/",
        'aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"',
      ],
    })

    pipeline.addStage(this, { pre: [appBuild], post: [appDeploy] })
  }
}
