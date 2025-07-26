# Publishing Setup

This repository is configured to automatically publish the VS Code extension when changes are merged to the main branch.

## Setup Requirements

To enable automatic publishing, you need to set up a Personal Access Token (PAT) for the VS Code Marketplace:

1. Go to [Azure DevOps](https://dev.azure.com) and sign in with the account that has access to the VS Code Marketplace publisher "74th"
2. Create a new Personal Access Token with the following permissions:
   - **Marketplace**: Manage
   - **Scopes**: All accessible organizations
3. Add the token as a GitHub repository secret named `VSCE_PAT`:
   - Go to GitHub repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VSCE_PAT`
   - Value: Your Personal Access Token

## How It Works

The GitHub Actions workflow (`.github/workflows/publish.yml`) will:

1. **Trigger**: On every push to the main branch
2. **Build**: Install dependencies and build the extension icons
3. **Version Bump**: Automatically increment the patch version in package.json
4. **Package**: Create a `.vsix` package using vsce
5. **Publish**: Upload to VS Code Marketplace
6. **Release**: Create a GitHub release with the new version tag

## Manual Publishing

You can also publish manually if needed:

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Bump version (patch/minor/major)
npm run version:patch

# Package the extension
npm run package

# Publish to marketplace (requires VSCE_PAT environment variable)
npm run publish
```