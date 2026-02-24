import type { IExecuteFunctions, ICredentialDataDecryptedObject, IDataObject } from 'n8n-workflow';
import { StaticAuthenticationProvider } from '@aps_sdk/autodesk-sdkmanager';
import { OssClient } from '@aps_sdk/oss';
import { DataManagementClient } from '@aps_sdk/data-management';
import { ModelDerivativeClient } from '@aps_sdk/model-derivative';

interface JsonApiEntity {
	id?: string;
	type?: string;
	attributes?: Record<string, unknown>;
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
 * Transforms { id, type, attributes: { ... } } to { id, type, ...attributes }
 */
export function simplifyJsonApiEntity(
	entity: JsonApiEntity | null,
): Record<string, unknown> | null {
	if (!entity) return null;

	const { id, type, attributes, ...rest } = entity;
	const simplified: Record<string, unknown> = {};

	if (id !== undefined) simplified.id = id;
	if (type !== undefined) simplified.type = type;

	if (attributes && typeof attributes === 'object') {
		Object.assign(simplified, attributes);
	}

	// Merge any other top-level properties
	Object.assign(simplified, rest);

	return simplified;
}

/**
 * Simplify JSON:API response with data array or single item
 */
export function simplifyJsonApiResponse(response: JsonApiResponse | unknown): unknown {
	if (!response || typeof response !== 'object') return response;

	const typedResponse = response as JsonApiResponse;

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

	// Handle array response without data wrapper
	if (Array.isArray(typedResponse)) {
		return typedResponse.map((item) => simplifyJsonApiEntity(item as JsonApiEntity));
	}

	// Handle single entity
	return simplifyJsonApiEntity(typedResponse as JsonApiEntity);
}

/**
 * Handle paginated response - returns array or single item based on simplify setting
 */
export function handlePaginatedResponse(
	data: unknown,
	splitIntoItems: boolean,
	simplify: boolean,
): IDataObject | IDataObject[] {
	const processed = simplify ? simplifyJsonApiResponse(data) : data;

	// If splitIntoItems is true and we have an array, return as array for n8n to split
	if (splitIntoItems && processed && typeof processed === 'object') {
		const typedProcessed = processed as JsonApiResponse;
		if (typedProcessed.data && Array.isArray(typedProcessed.data)) {
			return typedProcessed.data as IDataObject[];
		}
	}

	// If splitIntoItems is true and we have a direct array
	if (splitIntoItems && Array.isArray(processed)) {
		return processed as IDataObject[];
	}

	return processed as IDataObject;
}
