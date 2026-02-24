import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { getAccessToken, createOssClient, handlePaginatedResponse } from '../Aps/ApsHelpers';
import { Region } from '@aps_sdk/oss';

export class ApsOss implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Autodesk APS - OSS',
		name: 'apsOss',
		icon: 'file:aps.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with APS Object Storage Service (OSS)',
		defaults: {
			name: 'APS OSS',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'apsClientCredentialsOAuth2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Bucket',
						value: 'bucket',
					},
					{
						name: 'Object',
						value: 'object',
					},
				],
				default: 'bucket',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['bucket'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'List buckets',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get bucket details',
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Create a bucket',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a bucket',
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['object'],
					},
				},
				options: [
					{
						name: 'Copy',
						value: 'copy',
						action: 'Copy an object',
					},
					{
						name: 'Create Signed URL',
						value: 'createSignedUrl',
						action: 'Generate OSS signed URL',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete an object',
					},
					{
						name: 'Download',
						value: 'download',
						action: 'Download an object using signed URL',
					},
					{
						name: 'Get',
						value: 'getDetails',
						action: 'Get object details',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'List objects',
					},
					{
						name: 'Upload',
						value: 'upload',
						action: 'Upload an object using signed URL',
					},
				],
				default: 'copy',
			},
			// Bucket parameters
			{
				displayName: 'Bucket Key',
				name: 'bucketKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['get', 'delete'],
					},
				},
			},
			{
				displayName: 'Bucket Key',
				name: 'bucketKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['object'],
					},
				},
			},
			{
				displayName: 'Region',
				name: 'region',
				type: 'options',
				options: [
					{ name: 'US', value: 'US' },
					{ name: 'EMEA', value: 'EMEA' },
					{ name: 'APAC', value: 'APAC' },
				],
				default: 'US',
				required: true,
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['create', 'getAll'],
					},
				},
			},
			{
				displayName: 'Policy Key',
				name: 'policyKey',
				type: 'options',
				options: [
					{ name: 'Persistent', value: 'persistent' },
					{ name: 'Temporary', value: 'temporary' },
					{ name: 'Transient', value: 'transient' },
				],
				default: 'persistent',
				required: true,
				description: 'Data retention policy for the bucket',
				displayOptions: {
					show: {
						resource: ['bucket'],
						operation: ['create'],
					},
				},
			},
			// Object parameters
			{
				displayName: 'Object Key',
				name: 'objectKey',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['getDetails', 'delete', 'createSignedUrl'],
					},
				},
			},
			{
				displayName: 'Object Key',
				name: 'objectKey',
				type: 'string',
				default: '',
				required: true,
				description: 'The name for the uploaded object',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the file data',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['upload'],
					},
				},
			},
			{
				displayName: 'New Object Name',
				name: 'newObjectKey',
				type: 'string',
				default: '',
				required: true,
				description: 'The name for the copied object',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['copy'],
					},
				},
			},
			{
				displayName: 'Source Object Key',
				name: 'objectKey',
				type: 'string',
				default: '',
				required: true,
				description: 'The key of the object to copy',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['copy'],
					},
				},
			},
			{
				displayName: 'Download as File',
				name: 'downloadAsFile',
				type: 'boolean',
				default: false,
				description: 'Whether to download the object content as a file',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['download'],
					},
				},
			},
			{
				displayName: 'File Path',
				name: 'filePath',
				type: 'string',
				default: '',
				placeholder: '/path/to/save/file.ext',
				description: 'The path where to save the downloaded file',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['download'],
						downloadAsFile: [true],
					},
				},
			},
			{
				displayName: 'Signed URL Access',
				name: 'access',
				type: 'options',
				options: [
					{ name: 'Read', value: 'read' },
					{ name: 'Write', value: 'write' },
					{ name: 'ReadWrite', value: 'readwrite' },
				],
				default: 'read',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['createSignedUrl'],
					},
				},
			},
			{
				displayName: 'Minutes Until Expiration',
				name: 'minutesExpiration',
				type: 'number',
				default: 60,
				description: 'The time window (in minutes) the signed URL will remain usable (1-60)',
				displayOptions: {
					show: {
						resource: ['object'],
						operation: ['createSignedUrl'],
					},
				},
			},
			// Common options
			{
				displayName: 'Simplify Response',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description: 'Whether to simplify the response',
			},
			{
				displayName: 'Split Into Items',
				name: 'splitIntoItems',
				type: 'boolean',
				default: false,
				description: 'Whether to split the result into separate items',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const simplify = this.getNodeParameter('simplify', 0, true) as boolean;
		const splitIntoItems = this.getNodeParameter('splitIntoItems', 0, false) as boolean;

		const accessToken = await getAccessToken(this, 'apsClientCredentialsOAuth2Api');
		const client = createOssClient(accessToken);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'bucket') {
					if (operation === 'getAll') {
						const region = this.getNodeParameter('region', i) as Region;
						responseData = await client.bucketApi.getBuckets(accessToken, region);
					} else if (operation === 'get') {
						const bucketKey = this.getNodeParameter('bucketKey', i) as string;
						responseData = await client.bucketApi.getBucketDetails(accessToken, bucketKey);
					} else if (operation === 'create') {
						const region = this.getNodeParameter('region', i) as Region;
						const bucketKey = this.getNodeParameter('bucketKey', i) as string;
						const policyKey = this.getNodeParameter('policyKey', i) as string;
						responseData = await client.bucketApi.createBucket(
							accessToken,
							{
								bucketKey,
								policyKey: policyKey as 'persistent' | 'temporary' | 'transient',
							},
							region,
						);
					} else if (operation === 'delete') {
						const bucketKey = this.getNodeParameter('bucketKey', i) as string;
						responseData = await client.bucketApi.deleteBucket(accessToken, bucketKey);
					}
				} else if (resource === 'object') {
					const bucketKey = this.getNodeParameter('bucketKey', i) as string;

					if (operation === 'getAll') {
						responseData = await client.objectApi.getObjects(accessToken, bucketKey);
					} else if (operation === 'getDetails') {
						const objectKey = this.getNodeParameter('objectKey', i) as string;
						responseData = await client.objectApi.getObjectDetails(
							accessToken,
							bucketKey,
							objectKey,
						);
					} else if (operation === 'upload') {
						const objectKey = this.getNodeParameter('objectKey', i) as string;
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const item = items[i];

						if (!item.binary || !item.binary[binaryPropertyName]) {
							throw new NodeOperationError(
								this.getNode(),
								`No binary data found for property: ${binaryPropertyName}`,
							);
						}

						const binaryData = item.binary[binaryPropertyName];

						// Convert binary data to Buffer
						let fileBuffer: Buffer;
						if (binaryData.data) {
							// n8n binary data format
							fileBuffer = Buffer.from(binaryData.data, 'base64');
						} else {
							fileBuffer = binaryData as unknown as Buffer;
						}

						responseData = await client.ossFileTransfer.upload(
							bucketKey,
							objectKey,
							fileBuffer,
							accessToken,
							new AbortController(),
						);
					} else if (operation === 'download') {
						const objectKey = this.getNodeParameter('objectKey', i) as string;
						const downloadAsFile = this.getNodeParameter('downloadAsFile', i, false) as boolean;

						if (downloadAsFile) {
							const filePath = this.getNodeParameter('filePath', i) as string;
							await client.ossFileTransfer.download(bucketKey, objectKey, accessToken, filePath);
							responseData = { success: true, filePath };
						} else {
							const stream = await client.objectApi.signedS3Download(
								accessToken,
								bucketKey,
								objectKey,
							);
							responseData = { signedUrl: stream };
						}
					} else if (operation === 'copy') {
						const objectKey = this.getNodeParameter('objectKey', i) as string;
						const newObjectKey = this.getNodeParameter('newObjectKey', i) as string;
						responseData = await client.objectApi.copyTo(
							accessToken,
							bucketKey,
							objectKey,
							newObjectKey,
						);
					} else if (operation === 'delete') {
						const objectKey = this.getNodeParameter('objectKey', i) as string;
						responseData = await client.objectApi.deleteObject(accessToken, bucketKey, objectKey);
					} else if (operation === 'createSignedUrl') {
						const objectKey = this.getNodeParameter('objectKey', i) as string;
						const access = this.getNodeParameter('access', i) as string;
						const minutesExpiration = this.getNodeParameter('minutesExpiration', i) as number;
						responseData = await client.objectApi.createSignedResource(
							accessToken,
							bucketKey,
							objectKey,
							access as 'Read' | 'Write' | 'ReadWrite',
							false,
							{ minutesExpiration },
						);
					}
				}

				const processedData = handlePaginatedResponse(responseData, splitIntoItems, simplify);

				if (Array.isArray(processedData)) {
					for (const item of processedData) {
						returnData.push({ json: item });
					}
				} else {
					returnData.push({ json: processedData });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
