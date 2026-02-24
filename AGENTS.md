# Agent Instructions for n8n-nodes-aps

This is an n8n community node package for Autodesk Platform Services (APS) integration. It provides custom workflow nodes for the n8n automation platform.

## Build/Lint Commands

```bash
# Build the project
npm run build

# Watch mode for development
npm run build:watch

# Development mode with n8n-node
npm run dev

# Lint (no tests configured)
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Create release
npm run release
```

**Note:** No test framework is configured. Verification relies on TypeScript compilation and ESLint.

## Code Style Guidelines

### Formatting (Prettier)

- **Indentation:** Tabs (width: 2)
- **Semicolons:** Required
- **Trailing commas:** All (where valid)
- **Quotes:** Single quotes
- **Print width:** 100 characters
- **End of line:** LF
- **Arrow functions:** Always use parentheses

### TypeScript Configuration

- **Target:** ES2019
- **Module:** CommonJS
- **Strict mode:** Enabled
- **Output:** `./dist/` directory
- **Declaration files:** Generated with source maps

### Import Patterns

**External dependencies:**

```typescript
import { IExecuteFunctions, INodeType } from 'n8n-workflow';
import { OssClient } from '@aps_sdk/oss';
```

**Internal imports:**

```typescript
import { getAccessToken, createOssClient } from '../Aps/ApsHelpers';
```

**Type-only imports:**

```typescript
import type { ICredentialType, INodeProperties } from 'n8n-workflow';
```

### Naming Conventions

| Pattern            | Convention | Example                             |
| ------------------ | ---------- | ----------------------------------- |
| Node classes       | PascalCase | `ApsDataManagement`, `ApsOss`       |
| Credential classes | PascalCase | `ApsOAuth2Api`                      |
| Helper functions   | camelCase  | `getAccessToken`, `createOssClient` |
| Files              | PascalCase | `ApsDataManagement.node.ts`         |
| Properties         | camelCase  | `displayName`, `operation`          |

### Operation Naming Conventions

When defining operation options for nodes, use the following conventions based on the APS SDK `@summary` comments:

**Option `name` values:**

- Use n8n standard names: `Get`, `Get Many`, `Create`, `Delete`, `Update`, etc.
- For unique operations within a resource, use descriptive names like `Get Top Folders`, `Get Contents`, `Start Translation`

**Option `action` values:**

- Use sentence case (lowercase except first word)
- Derive from SDK `@summary` comments in the APS SDK files
- Examples from SDK:
  - `@summary List Hubs` → `action: 'List hubs'`
  - `@summary Get a Hub` → `action: 'Get a hub'`
  - `@summary Create Bucket` → `action: 'Create a bucket'`
  - `@summary Fetch Manifest` → `action: 'Fetch a manifest'`
  - `@summary List Model Views` → `action: 'List model views'`

**Pattern mapping:**

| SDK @summary Pattern | action Value Example     |
| -------------------- | ------------------------ |
| Get/List {Resource}  | `Get a hub`, `List hubs` |
| Create {Resource}    | `Create a bucket`        |
| Delete {Resource}    | `Delete a bucket`        |
| Fetch {Resource}     | `Fetch a manifest`       |
| {Verb} {Resource}    | `Start translation job`  |

**Important:** n8n linting rules require:

- `name: 'Get Many'` for list operations (not 'List')
- Sentence case for all `action` values
- Unique `name` values within each resource's operation options

### Error Handling

**Always use this pattern in execute methods:**

```typescript
for (let i = 0; i < items.length; i++) {
	try {
		// operation logic
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({ json: { error: (error as Error).message } });
			continue;
		}
		throw error;
	}
}
```

**Use NodeOperationError for user-facing errors:**

```typescript
import { NodeOperationError } from 'n8n-workflow';

throw new NodeOperationError(
	this.getNode(),
	`No binary data found for property: ${binaryPropertyName}`,
);
```

## Node Architecture

Each node implements `INodeType`:

```typescript
export class NodeName implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Display Name',
		name: 'nodeName',
		icon: 'file:aps.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Node description',
		defaults: { name: 'Node Name' },
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'credentialName', required: true }],
		properties: [
			/* parameter definitions */
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Implementation
	}
}
```

## Project Structure

```
credentials/          # Credential definitions (OAuth2 configs)
nodes/
  Aps/               # Shared helpers and icons
    ApsHelpers.ts    # SDK client factories, auth helpers
  ApsDataManagement/ # Data Management node
  ApsOss/            # Object Storage node
  ApsModelDerivative/# Model Derivative node
dist/                # Compiled output (gitignored)
```

## Key Dependencies

- `@aps_sdk/autodesk-sdkmanager` - SDK manager for APS
- `@aps_sdk/data-management` - Data Management API
- `@aps_sdk/model-derivative` - Model Derivative API
- `@aps_sdk/oss` - Object Storage Service
- `n8n-workflow` - n8n types and utilities (peer dependency)

## Linting Rules

Uses `@n8n/node-cli/eslint` configuration (n8n's official linting rules).
