import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager"
import { getSignedCookies } from "@aws-sdk/cloudfront-signer"
import type { CloudFrontRequestHandler, CloudFrontHeaders } from "aws-lambda"

const secretsManagerClient = new SecretsManagerClient()
const getSecret = async (secretId: string): Promise<string> =>
  (
    await secretsManagerClient.send(
      new GetSecretValueCommand({ SecretId: secretId }),
    )
  ).SecretString!

const keyPairId = await getSecret(`admin-key-pair-#STAGE_TYPE#/public-key-id`)
const privateKey = await getSecret(`admin-key-pair-#STAGE_TYPE#/private`)

export const handler: CloudFrontRequestHandler = async event => {
  const { cf } = event.Records[0]
  const domainName = cf.config.distributionDomainName
  const expiry = new Date(Date.now() + 60 * 60 * 1000 * 24 * 7)

  return {
    status: "302",
    statusDescription: "Found",
    headers: {
      ...getCookies(domainName, expiry),
      "cache-control": [
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
      location: [
        {
          key: "Location",
          value: `https://${domainName}/admin.html`,
        },
      ],
    },
  }
}

const getCookies = (domainName: string, expiry: Date): CloudFrontHeaders => {
  const signedCookie = getSignedCookies({
    url: `https://${domainName}`,
    keyPairId,
    privateKey,
    policy: expiryPolicy(`https://${domainName}/*`, expiry),
  })

  const cookie = (key: keyof typeof signedCookie) => ({
    key: "Set-Cookie",
    value: `${key}=${signedCookie[key]};Domain=${domainName};Path=/;Expires=${expiry.toUTCString()};Secure;HttpOnly;SameSite=Lax`,
  })

  return {
    "set-cookie": [
      cookie("CloudFront-Policy"),
      cookie("CloudFront-Signature"),
      cookie("CloudFront-Key-Pair-Id"),
    ],
  }
}

const expiryPolicy = (resource: string, expiry: Date): string =>
  JSON.stringify({
    Statement: [
      {
        Resource: resource,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": Math.floor(expiry.getTime() / 1000),
          },
        },
      },
    ],
  })
