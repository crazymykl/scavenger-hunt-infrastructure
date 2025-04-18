import { StageType } from "./stage-type"
import { Construct } from "constructs"
import { AssetStack } from "./asset-stack"
import { Stage, StageProps } from "aws-cdk-lib"

interface ScavengerHuntStageProps extends StageProps {
  stageType: StageType
}

export class ScavengerHuntStage extends Stage {
  constructor(scope: Construct, id: string, props: ScavengerHuntStageProps) {
    super(scope, id, props)

    new AssetStack(this, "assets")
  }
}
