import { Stack, StackProps } from "aws-cdk-lib"
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines"
import { Construct } from "constructs"

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const pipeline = new CodePipeline(this, "Pipeline", {
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(
          "crazymykl/scavenger-hunt-infrastructure",
          "main",
          {
            connectionArn:
              "arn:aws:codeconnections:us-east-1:105227738989:connection/59a567b2-9acd-4080-a091-5d32be10d491",
          },
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    })
  }
}
