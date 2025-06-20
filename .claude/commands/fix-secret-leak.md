# /fix_secret_leak

Fix secret leak issues when pushing to GitHub by following GitHub's push protection guidelines.

## Process

1. **Attempt Push** - Try to push and capture the error message
2. **Identify Secrets** - Parse error to find which commits contain secrets
3. **Examine Commits** - Review the problematic commits
4. **Fix Strategy** - Choose appropriate fix based on the situation:
   - If secret is in recent commits: Remove and recommit
   - If secret is in older commits: Interactive rebase
   - If secret was already pushed: Revoke the secret first
5. **Clean History** - Remove secrets from git history
6. **Verify & Push** - Ensure secrets are removed and push again

## Important Notes

- Always revoke exposed secrets immediately
- Never use `--force` push on shared branches without coordination
- Consider using environment variables or secret management tools
- Add sensitive files to .gitignore to prevent future leaks

## References

- [GitHub Push Protection Docs](https://docs.github.com/en/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line#resolving-a-blocked-push)
- [Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)