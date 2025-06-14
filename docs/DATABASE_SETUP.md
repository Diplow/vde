# Database Setup Guide

## Initial Database Setup for Neon

When deploying to a new Neon database, you need to create the database schema. Follow these steps:

### 1. Set Environment Variable Locally

```bash
# Set your Neon database URL
export DATABASE_URL="postgresql://user:password@host.neon.tech/database?sslmode=require"
```

### 2. Push Schema to Database

For initial setup, use the push command which creates all tables without migration history:

```bash
pnpm db:push
```

This command will:
- Read your schema from `src/server/db/schema`
- Create all necessary tables in your Neon database
- Set up indexes and constraints

### 3. Alternative: Run Migrations

If you prefer to use migrations (recommended for production):

```bash
pnpm db:migrate
```

## Verifying Setup

After running either command, you can verify the tables exist:

1. **Using Drizzle Studio**:
   ```bash
   pnpm db:studio
   ```
   This opens a web interface to browse your database.

2. **Using Neon Console**:
   - Go to your Neon project dashboard
   - Navigate to the SQL Editor
   - Run: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`

## Required Tables

The application requires these tables:
- `users` - User accounts
- `sessions` - User sessions
- `accounts` - OAuth accounts (if using social login)
- `verificationTokens` - Email verification tokens
- `items` - Map items
- `userMapping` - Maps auth users to mapping system users

## Troubleshooting

### "relation does not exist" errors
This means the tables haven't been created. Run `pnpm db:push` with the correct DATABASE_URL.

### SSL connection errors
Ensure your DATABASE_URL includes `?sslmode=require` at the end.

### Permission errors
Make sure your Neon database user has CREATE TABLE permissions.

## Production Deployment

For production, always:
1. Test migrations on a development branch first
2. Backup your database before running migrations
3. Use migrations (`db:migrate`) instead of push for better version control
4. **NEVER hardcode credentials in scripts** - always use environment variables

### Running Production Migrations

```bash
# Set the DATABASE_URL environment variable (get from Vercel dashboard)
export DATABASE_URL="postgresql://..."

# Run migrations
pnpm db:migrate

# Or use the migration script template
DATABASE_URL="postgresql://..." ./scripts/migrate-production-template.sh
```

### Security Best Practices

1. **Never commit credentials** to Git
2. Use environment variables for all sensitive data
3. Add production scripts to `.gitignore`
4. Use secret management tools like Vercel environment variables
5. Rotate credentials immediately if exposed