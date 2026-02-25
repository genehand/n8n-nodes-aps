import type { IExecuteFunctions, ICredentialDataDecryptedObject, IDataObject } from 'n8n-workflow';
import { StaticAuthenticationProvider } from '@aps_sdk/autodesk-sdkmanager';
import { OssClient } from '@aps_sdk/oss';
import { DataManagementClient } from '@aps_sdk/data-management';
import { ModelDerivativeClient } from '@aps_sdk/model-derivative';

interface JsonApiEntity {
	id?: string;
	type?: string;
	attributes?: Record<string, unknown>;
	links?: {
		self?: { href?: string } | string;
		href?: string;
	};
	[key: string]: unknown;
}

interface JsonApiResponse {
	data?: JsonApiEntity | JsonApiEntity[];
	[key: string]: unknown;
}

/**
 * Extract access token from n8n credential
 */
export async function getAccessToken(
	ctx: IExecuteFunctions,
	credentialName: string,
): Promise<string> {
	const credentials = (await ctx.getCredentials(credentialName)) as ICredentialDataDecryptedObject;
	const oauthData = credentials.oauthTokenData as { access_token?: string } | undefined;
	const accessToken = oauthData?.access_token;

	if (!accessToken) {
		throw new Error(`No access token found in credentials: ${credentialName}`);
	}

	return accessToken;
}

/**
 * Create OSS client with authentication provider
 */
export function createOssClient(accessToken: string): OssClient {
	const authProvider = new StaticAuthenticationProvider(accessToken);
	return new OssClient({ authenticationProvider: authProvider });
}

/**
 * Create Data Management client with authentication provider
 */
export function createDataManagementClient(accessToken: string): DataManagementClient {
	const authProvider = new StaticAuthenticationProvider(accessToken);
	return new DataManagementClient({ authenticationProvider: authProvider });
}

/**
 * Create Model Derivative client with authentication provider
 */
export function createModelDerivativeClient(accessToken: string): ModelDerivativeClient {
	const authProvider = new StaticAuthenticationProvider(accessToken);
	return new ModelDerivativeClient({ authenticationProvider: authProvider });
}

/**
 * Simplify JSON:API entity by flattening attributes into the main object
 * Transforms { id, type, attributes: { ... } } to { id, type, href, ...attributes }
 * Also handles plain objects (like OSS API responses) by returning them as-is
 */
export function simplifyJsonApiEntity(
	entity: JsonApiEntity | null,
): Record<string, unknown> | null {
	if (!entity) return null;

	const { id, type, attributes, links, ...rest } = entity;
	const simplified: Record<string, unknown> = {};

	// Check if this is a JSON:API formatted entity (must have id+type+attributes structure)
	// Note: Some APIs return plain objects with 'type' field that are NOT JSON:API format
	const isJsonApiFormat = attributes !== undefined || (id !== undefined && type !== undefined);

	if (isJsonApiFormat) {
		// Handle JSON:API format
		if (id !== undefined) simplified.id = id;
		if (type !== undefined) simplified.type = type;

		// Extract href from links
		let href: string | undefined;
		if (links?.self) {
			if (typeof links.self === 'string') {
				href = links.self;
			} else if (typeof links.self === 'object' && 'href' in links.self) {
				href = links.self.href;
			}
		}
		if (!href && links?.href) {
			href = links.href;
		}
		if (href !== undefined) simplified.href = href;

		if (attributes && typeof attributes === 'object') {
			Object.assign(simplified, attributes);
		}
	} else {
		// Handle plain objects (like OSS API responses)
		Object.assign(simplified, rest);
	}

	return simplified;
}

/**
 * Simplify JSON:API response with data array or single item
 */
export function simplifyJsonApiResponse(response: JsonApiResponse | unknown): unknown {
	if (!response || typeof response !== 'object') return response;

	const typedResponse = response as JsonApiResponse & { items?: JsonApiEntity[] };

	// Handle data array
	if (typedResponse.data && Array.isArray(typedResponse.data)) {
		return {
			...typedResponse,
			data: typedResponse.data.map((item) => simplifyJsonApiEntity(item)),
		};
	}

	// Handle single data item
	if (typedResponse.data) {
		return {
			...typedResponse,
			data: simplifyJsonApiEntity(typedResponse.data),
		};
	}

	// Handle OSS API format with items array
	if (typedResponse.items && Array.isArray(typedResponse.items)) {
		return {
			...typedResponse,
			items: typedResponse.items.map((item) => simplifyJsonApiEntity(item)),
		};
	}

	// Handle array response without data wrapper
	if (Array.isArray(typedResponse)) {
		return typedResponse.map((item) => simplifyJsonApiEntity(item as JsonApiEntity));
	}

	// Handle single entity
	return simplifyJsonApiEntity(typedResponse as JsonApiEntity);
}

/**
 * Extract the actual content from SDK response (handles ApiResponse wrapper)
 */
function extractResponseContent(data: unknown): unknown {
	// Handle SDK ApiResponse wrapper which has 'content' and 'response' properties
	// The 'response' property contains circular references (req/res), so we only extract 'content'
	if (data && typeof data === 'object' && 'content' in data && !Array.isArray(data)) {
		return (data as { content: unknown }).content;
	}
	return data;
}

/**
 * Handle paginated response - returns array or single item based on simplify setting
 */
export function handlePaginatedResponse(
	data: unknown,
	splitIntoItems: boolean,
	simplify: boolean,
): IDataObject | IDataObject[] {
	// First extract content from SDK wrapper if present
	const content = extractResponseContent(data);

	// Handle null/undefined responses (e.g., successful delete operations)
	if (content === null || content === undefined) {
		return { success: true };
	}

	const processed = simplify ? simplifyJsonApiResponse(content) : content;

	// If we have a wrapped response with data array, extract just the data
	if (processed && typeof processed === 'object') {
		const typedProcessed = processed as JsonApiResponse & { items?: unknown[] };
		if (typedProcessed.data && Array.isArray(typedProcessed.data)) {
			// Always return just the data array (flattened), not the wrapper
			return typedProcessed.data as IDataObject[];
		}
		// Handle OSS API format with items array
		if (typedProcessed.items && Array.isArray(typedProcessed.items)) {
			return typedProcessed.items as IDataObject[];
		}
	}

	// If splitIntoItems is true and we have a direct array
	if (splitIntoItems && Array.isArray(processed)) {
		return processed as IDataObject[];
	}

	return processed as IDataObject;
}
