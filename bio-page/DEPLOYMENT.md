# Deploying bio-page to AWS

One-time infrastructure setup for hosting this site at
`bio.pipeline-projects.com` via S3 + CloudFront + Route 53, deployed by
`.github/workflows/deploy-bio-page.yml` on every push to `main`.

You already have a Route 53 hosted zone for `pipeline-projects.com` (used by
Taskbeam), so this just adds a sibling subdomain.

## 1. S3 bucket (private origin, not public website hosting)

```bash
aws s3 mb s3://bio-pipeline-projects-com --region us-east-1
aws s3api put-public-access-block \
  --bucket bio-pipeline-projects-com \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Keep the bucket private — CloudFront will read from it via Origin Access
Control (OAC), not a public bucket policy.

## 2. ACM certificate (must be in us-east-1 for CloudFront)

Console → Certificate Manager (us-east-1) → Request certificate →
`bio.pipeline-projects.com` → DNS validation → add the CNAME record it gives
you to the `pipeline-projects.com` hosted zone in Route 53 → wait for
"Issued". (If you already have a wildcard `*.pipeline-projects.com` cert
from the Taskbeam setup, reuse it instead of requesting a new one.)

## 3. CloudFront distribution

Console → CloudFront → Create distribution:
- Origin: the `bio-pipeline-projects-com` S3 bucket, origin access = **Origin
  access control (OAC)** — create a new OAC and let CloudFront update the
  bucket policy for you when prompted.
- Alternate domain name (CNAME): `bio.pipeline-projects.com`
- Custom SSL certificate: the ACM cert from step 2
- Default root object: `index.html`
- Viewer protocol policy: Redirect HTTP to HTTPS

Note the **Distribution ID** once created — the workflow needs it.

## 4. Route 53 record

In the `pipeline-projects.com` hosted zone, add an **A** record (Alias):
- Name: `bio`
- Alias target: the CloudFront distribution from step 3

## 5. GitHub OIDC role (so Actions can deploy without long-lived AWS keys)

Create the GitHub OIDC identity provider (one-time per AWS account, skip if
Taskbeam's CI already set this up):

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

Create a role trusted by this repo only (replace `ACCOUNT_ID`), with a trust
policy scoped to `repo:NikolasRepo/my-automation-showcase:*`, and attach a
permissions policy limited to:
- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the
  `bio-pipeline-projects-com` bucket
- `cloudfront:CreateInvalidation` on the distribution

Note the role's ARN.

## 6. GitHub repo configuration

In the repo's Settings → Secrets and variables → Actions:

**Secrets**
- `AWS_ROLE_ARN` — the role ARN from step 5

**Variables**
- `AWS_REGION` — e.g. `us-east-1`
- `S3_BUCKET` — `bio-pipeline-projects-com`
- `CLOUDFRONT_DISTRIBUTION_ID` — from step 3

## 7. Ship it

Push to `main` with a change under `bio-page/**` and watch the "Deploy
bio-page to AWS" workflow run in the Actions tab.
