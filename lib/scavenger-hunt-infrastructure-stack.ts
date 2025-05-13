import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import { CodePipeline, ShellStep } from "aws-cdk-lib/pipelines"
import { ScavengerHuntStage } from "./scavenger-hunt-stage"
import { codestarConnection } from "./codestar-connection"

export class ScavengerHuntInfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const synth = new ShellStep("Synth", {
      input: codestarConnection(
        "crazymykl/scavenger-hunt-infrastructure",
        "main",
      ),
      commands: ["npm ci", "npm run build", "npx cdk synth"],
    })

    const pipeline = new CodePipeline(this, "Pipeline", {
      synth,
    })

    new ScavengerHuntStage(this, "beta-stage", {
      stageType: "beta",
    }).addToPipeline(pipeline)
  }
}
