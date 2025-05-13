import { CodePipelineSource } from "aws-cdk-lib/pipelines"

const connectionArn =
  "arn:aws:codeconnections:us-east-1:105227738989:connection/59a567b2-9acd-4080-a091-5d32be10d491"

export const codestarConnection = (repo: string, branch: string) =>
  CodePipelineSource.connection(repo, branch, { connectionArn })
