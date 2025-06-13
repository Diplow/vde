# Vercel Environment Setup Guide

## Creating Required Secrets

The application requires several secrets to be configured in Vercel. The `vercel.json` file references these secrets using the `@secret-name` syntax.

### Required Secrets

1. **database-url** (REQUIRED)
   - Your Neon PostgreSQL connection string
   - Format: `postgresql://user:password@host/database?sslmode=require`

2. **auth-secret** (REQUIRED)
   - Random string for authentication
   - Generate with: `openssl rand -base64 32`

3. **better-auth-url** (REQUIRED)
   - Your application URL
   - Example: `https://your-app.vercel.app`

### Optional Secrets

4. **mistral-api-key** (Optional)
   - Your Mistral AI API key
   - Leave unset if not using AI features

5. **youtube-api-key** (Optional)
   - Your YouTube Data API key
   - Leave unset if not using YouTube integration

6. **clerk-publishable-key** (Optional - Legacy)
   - Clerk public key (being phased out)

7. **clerk-secret-key** (Optional - Legacy)
   - Clerk secret key (being phased out)

## Setting Secrets via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Add secrets
vercel secrets add database-url "postgresql://..."
vercel secrets add auth-secret "$(openssl rand -base64 32)"
vercel secrets add better-auth-url "https://your-app.vercel.app"

# Optional secrets (only if needed)
vercel secrets add mistral-api-key "your-mistral-key"
vercel secrets add youtube-api-key "your-youtube-key"
```

## Setting Secrets via Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each secret:
   - Click "Add New"
   - Enter the key name (e.g., `DATABASE_URL`)
   - Enter the value
   - Select environments (Production, Preview, Development)
   - For sensitive values, check "Sensitive" to hide the value
   - Click "Save"

## Verifying Your Setup

After adding all secrets, you can verify:

```bash
# List all secrets (names only, not values)
vercel secrets list

# Redeploy to use new secrets
vercel --prod
```

## Troubleshooting

### "Secret does not exist" error
- Secret name in vercel.json must match exactly (case-sensitive)
- Use hyphens in secret names, not underscores
- Example: `@database-url` not `@database_url`

### "Invalid environment variable" error
- Check that required variables are set
- Verify the DATABASE_URL includes `?sslmode=require` for Neon

### Build failures
- Check build logs in Vercel dashboard
- Ensure all required secrets are set
- Verify DATABASE_URL connection string is valid

## Using Different Values per Environment

You can set different values for Production, Preview, and Development:

1. In Vercel Dashboard → Settings → Environment Variables
2. Click on the variable
3. Uncheck "Same for all Environments"
4. Set different values for each environment

This is useful for:
- Using a different database for preview deployments
- Disabling certain features in development
- Using test API keys in non-production environments