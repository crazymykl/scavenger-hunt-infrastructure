import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import { PipelineStack } from "./pipeline-stack"

export class ScavengerHuntInfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    new PipelineStack(this, "Pipeline")
  }
}
