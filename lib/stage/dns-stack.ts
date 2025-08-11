import { Stack, StackProps } from "aws-cdk-lib"
import {
  Certificate,
  CertificateValidation,
  ICertificate,
} from "aws-cdk-lib/aws-certificatemanager"
import { IHostedZone, PublicHostedZone } from "aws-cdk-lib/aws-route53"
import { Construct } from "constructs"

interface DnsStackProps extends StackProps {
  domainName: string
}

export interface DomainInfo {
  domainName: string
  certificate: ICertificate
  hostedZone: IHostedZone
}

export class DnsStack extends Stack {
  readonly domainInfo: DomainInfo

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props)
    const { domainName } = props

    const hostedZone = new PublicHostedZone(this, "HostedZone", {
      zoneName: domainName,
    })

    const certificate = new Certificate(this, "Certificate", {
      domainName,
      validation: CertificateValidation.fromDns(hostedZone),
    })

    this.domainInfo = {
      domainName,
      certificate,
      hostedZone,
    }
  }
}
