import {
  CodePipeline,
  CodePipelineProps,
  CodePipelineSource,
} from "aws-cdk-lib/pipelines"
import { Construct } from "constructs"

interface HuntPipelineProps extends CodePipelineProps {
  source: CodePipelineSource
}

export class HuntPipeline extends CodePipeline {
  readonly source: CodePipelineSource

  constructor(scope: Construct, id: string, props: HuntPipelineProps) {
    super(scope, id, props)
    this.source = props.source
  }
}
