// lib/email/ses-client.ts
// AWS SES wrapper. Uses AWS SDK v3.
//
// Required env vars (Vercel + .env.local):
//   AWS_ACCESS_KEY_ID
//   AWS_SECRET_ACCESS_KEY
//   AWS_SES_DEFAULT_REGION       (e.g. us-east-1)
//   APP_URL                      (https://360everywhere.com)
//
// npm install @aws-sdk/client-sesv2 @aws-sdk/client-sns

import {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  SendEmailCommand,
  DeleteEmailIdentityCommand,
  PutEmailIdentityMailFromAttributesCommand,
} from '@aws-sdk/client-sesv2';

type SesClientCache = Map<string, SESv2Client>;
const clients: SesClientCache = new Map();

function getClient(region: string): SESv2Client {
  let c = clients.get(region);
  if (!c) {
    c = new SESv2Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    clients.set(region, c);
  }
  return c;
}

/** Create the domain identity in SES and return the DKIM CNAME tokens. */
export async function sesCreateDomainIdentity(domain: string, region: string) {
  const c = getClient(region);
  const out = await c.send(new CreateEmailIdentityCommand({
    EmailIdentity: domain,
    DkimSigningAttributes: undefined, // Use Easy DKIM (SES generates keys)
  }));
  return {
    dkimTokens: out.DkimAttributes?.Tokens || [],
    identityType: out.IdentityType,
    verified: out.VerifiedForSendingStatus ?? false,
  };
}

/** Look up current verification + DKIM status. */
export async function sesGetIdentity(domain: string, region: string) {
  const c = getClient(region);
  try {
    const out = await c.send(new GetEmailIdentityCommand({ EmailIdentity: domain }));
    return {
      verified: out.VerifiedForSendingStatus ?? false,
      dkimStatus: out.DkimAttributes?.Status ?? 'NOT_STARTED',
      dkimTokens: out.DkimAttributes?.Tokens ?? [],
      mailFromDomain: out.MailFromAttributes?.MailFromDomain,
      mailFromStatus: out.MailFromAttributes?.MailFromDomainStatus,
    };
  } catch (err: any) {
    if (err.name === 'NotFoundException') return null;
    throw err;
  }
}

/** Delete the identity from SES (used when a domain is removed). */
export async function sesDeleteDomainIdentity(domain: string, region: string) {
  const c = getClient(region);
  await c.send(new DeleteEmailIdentityCommand({ EmailIdentity: domain }));
}

/** Set the custom MAIL FROM subdomain (e.g. bounce.<domain>) for proper SPF alignment. */
export async function sesSetMailFrom(domain: string, mailFrom: string, region: string) {
  const c = getClient(region);
  await c.send(new PutEmailIdentityMailFromAttributesCommand({
    EmailIdentity: domain,
    MailFromDomain: mailFrom,
    BehaviorOnMxFailure: 'USE_DEFAULT_VALUE',
  }));
}

export interface SesSendInput {
  region: string;
  fromAddress: string;          // e.g. "Sez Sezer <sez@mail-a.yourdomain.com>"
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  configurationSetName?: string; // for SES event publishing (bounces/complaints)
  customHeaders?: { Name: string; Value: string }[];
  tags?: { Name: string; Value: string }[];
}

/** Send a single email through SES. Returns the SES message ID. */
export async function sesSendEmail(input: SesSendInput): Promise<string> {
  const c = getClient(input.region);
  const out = await c.send(new SendEmailCommand({
    FromEmailAddress: input.fromAddress,
    Destination: { ToAddresses: [input.to] },
    ReplyToAddresses: input.replyTo ? [input.replyTo] : undefined,
    Content: {
      Simple: {
        Subject: { Data: input.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: input.html, Charset: 'UTF-8' },
          Text: input.text ? { Data: input.text, Charset: 'UTF-8' } : undefined,
        },
        Headers: input.customHeaders,
      },
    },
    ConfigurationSetName: input.configurationSetName,
    EmailTags: input.tags,
  }));
  return out.MessageId!;
}
