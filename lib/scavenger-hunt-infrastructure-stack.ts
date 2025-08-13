import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import { CodePipeline, ShellStep } from "aws-cdk-lib/pipelines"
import { ScavengerHuntStage } from "./scavenger-hunt-stage"
import { codestarConnection } from "./codestar-connection"
import { HuntPipeline } from "./hunt-pipeline"

export class ScavengerHuntInfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const synth = new ShellStep("Synth", {
      input: codestarConnection(
        "crazymykl/scavenger-hunt-infrastructure",
        "dev", // FIXME: Update to "main" after testing
      ),
      commands: ["npm ci", "npm run build", "npx cdk synth"],
    })

    const pipeline = new HuntPipeline(this, "Pipeline", {
      synth,
      source: codestarConnection("crazymykl/scavenger-hunt", "main"),
    })

    new ScavengerHuntStage(this, "beta-stage", {
      stageType: "beta",
    }).addToPipeline(pipeline)

    new ScavengerHuntStage(this, "prod-stage", {
      stageType: "prod",
      domainName: "hunt.popcultanimecon.com",
    }).addToPipeline(pipeline)
  }
}
