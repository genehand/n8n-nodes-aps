# n8n-nodes-aps

n8n community node for [Autodesk Platform Services (APS)](https://aps.autodesk.com/). Integrate with Data Management, Object Storage Service (OSS), and Model Derivative APIs.

> [!NOTE]
> Due to [SDK restrictions](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/#no-external-dependencies) this isn't compatible with n8n Cloud and must be used with self-hosted n8n.

## Installation

Follow the [manual installation guide](https://docs.n8n.io/integrations/community-nodes/installation/manual-install/) in the n8n community nodes documentation.

```bash
npm install n8n-nodes-aps
```

## Credentials

Two credential types are supported:

- **ApsOAuth2Api**: 3-legged OAuth2 (user authorization flow)
- **ApsClientCredentialsOAuth2Api**: 2-legged OAuth2 (client credentials flow)

Configure credentials in n8n with your APS Client ID and Client Secret from the [APS Developer Portal](https://aps.autodesk.com/).

## Operations

### Data Management

- List hubs and projects
- List and search folders, items, and versions
- Get item details and version metadata
- Create and manage folders

### Object Storage Service (OSS)

- Create and delete buckets
- Upload, download, and delete objects
- List bucket contents

### Model Derivative

- Submit translation jobs
- Get manifest and metadata
- Extract geometry data
- Check job status

## Compatibility

- n8n version 1.0.0+
- Node.js 18+

## Resources

- [APS API Documentation](https://aps.autodesk.com/developer/documentation)
- [APS SDK for Node.js](https://github.com/autodesk-platform-services/aps-sdk-node)
- [n8n-aps-nodes](https://github.com/chuongmep/n8n-aps-nodes) - Thanks to chuongmep for the original implementation
