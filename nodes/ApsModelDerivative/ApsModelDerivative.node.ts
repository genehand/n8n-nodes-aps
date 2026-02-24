import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import {
	getAccessToken,
	createModelDerivativeClient,
	handlePaginatedResponse,
} from '../Aps/ApsHelpers';
import { Region } from '@aps_sdk/model-derivative';

export class ApsModelDerivative implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'APS Model Derivative',
		name: 'apsModelDerivative',
		icon: 'file:aps.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with APS Model Derivative API',
		defaults: {
			name: 'APS Model Derivative',
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
						name: 'Derivative',
						value: 'derivative',
					},
					{
						name: 'Informational',
						value: 'informational',
					},
					{
						name: 'Job',
						value: 'job',
					},
					{
						name: 'Manifest',
						value: 'manifest',
					},
					{
						name: 'Metadata',
						value: 'metadata',
					},
					{
						name: 'Thumbnail',
						value: 'thumbnail',
					},
				],
				default: 'derivative',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
				options: [
					{
						name: 'Start Translation',
						value: 'startTranslation',
						action: 'Start translation job',
					},
				],
				default: 'startTranslation',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['manifest'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get manifest',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete manifest',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['metadata'],
					},
				},
				options: [
					{
						name: 'Get Model Views',
						value: 'getModelViews',
						action: 'Get model views',
					},
					{
						name: 'Get Object Tree',
						value: 'getObjectTree',
						action: 'Get object tree',
					},
					{
						name: 'Get All Properties',
						value: 'getAllProperties',
						action: 'Get all properties',
					},
					{
						name: 'Fetch Specific Properties',
						value: 'fetchSpecificProperties',
						action: 'Fetch specific properties',
					},
				],
				default: 'getModelViews',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['derivative'],
					},
				},
				options: [
					{
						name: 'Get Download URL',
						value: 'getDownloadUrl',
						action: 'Get derivative download URL',
					},
				],
				default: 'getDownloadUrl',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['thumbnail'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get thumbnail',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['informational'],
					},
				},
				options: [
					{
						name: 'Get Supported Formats',
						value: 'getFormats',
						action: 'Get supported formats',
					},
				],
				default: 'getFormats',
			},
			// Job parameters
			{
				displayName: 'URN',
				name: 'urn',
				type: 'string',
				default: '',
				required: true,
				description: 'The unique identifier of the object to translate',
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
			},
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{ name: 'DWG', value: 'dwg' },
					{ name: 'IFC', value: 'ifc' },
					{ name: 'IGES', value: 'iges' },
					{ name: 'OBJ', value: 'obj' },
					{ name: 'STEP', value: 'step' },
					{ name: 'STL', value: 'stl' },
					{ name: 'SVF', value: 'svf' },
					{ name: 'SVF2', value: 'svf2' },
					{ name: 'Thumbnail', value: 'thumbnail' },
				],
				default: 'dwg',
				required: true,
				displayOptions: {
					show: {
						resource: ['job'],
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
				],
				default: 'US',
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
			},
			// Manifest parameters
			{
				displayName: 'URN',
				name: 'urn',
				type: 'string',
				default: '',
				required: true,
				description: 'The unique identifier of the translated object',
				displayOptions: {
					show: {
						resource: ['manifest'],
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
				],
				default: 'US',
				displayOptions: {
					show: {
						resource: ['manifest'],
					},
				},
			},
			// Metadata parameters
			{
				displayName: 'URN',
				name: 'urn',
				type: 'string',
				default: '',
				required: true,
				description: 'The unique identifier of the translated object',
				displayOptions: {
					show: {
						resource: ['metadata'],
					},
				},
			},
			{
				displayName: 'Model GUID',
				name: 'modelGuid',
				type: 'string',
				default: '',
				required: true,
				description: 'The model view GUID',
				displayOptions: {
					show: {
						resource: ['metadata'],
						operation: ['getObjectTree', 'getAllProperties', 'fetchSpecificProperties'],
					},
				},
			},
			{
				displayName: 'Force Get',
				name: 'forceget',
				type: 'boolean',
				default: false,
				description: 'Whether to force getting metadata even if it is not ready',
				displayOptions: {
					show: {
						resource: ['metadata'],
						operation: ['getObjectTree', 'getAllProperties'],
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
				],
				default: 'US',
				displayOptions: {
					show: {
						resource: ['metadata'],
					},
				},
			},
			// Derivative parameters
			{
				displayName: 'URN',
				name: 'urn',
				type: 'string',
				default: '',
				required: true,
				description: 'The unique identifier of the translated object',
				displayOptions: {
					show: {
						resource: ['derivative'],
					},
				},
			},
			{
				displayName: 'Derivative URN',
				name: 'derivativeUrn',
				type: 'string',
				default: '',
				required: true,
				description: 'The URN of the derivative',
				displayOptions: {
					show: {
						resource: ['derivative'],
						operation: ['getDownloadUrl'],
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
				],
				default: 'US',
				displayOptions: {
					show: {
						resource: ['derivative'],
					},
				},
			},
			// Thumbnail parameters
			{
				displayName: 'URN',
				name: 'urn',
				type: 'string',
				default: '',
				required: true,
				description: 'The unique identifier of the translated object',
				displayOptions: {
					show: {
						resource: ['thumbnail'],
					},
				},
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'options',
				options: [
					{ name: '100', value: 100 },
					{ name: '200', value: 200 },
					{ name: '400', value: 400 },
					{ name: '800', value: 800 },
				],
				default: 400,
				displayOptions: {
					show: {
						resource: ['thumbnail'],
					},
				},
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'options',
				options: [
					{ name: '100', value: 100 },
					{ name: '200', value: 200 },
					{ name: '400', value: 400 },
					{ name: '800', value: 800 },
				],
				default: 400,
				displayOptions: {
					show: {
						resource: ['thumbnail'],
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
				],
				default: 'US',
				displayOptions: {
					show: {
						resource: ['thumbnail'],
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
		const client = createModelDerivativeClient(accessToken);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'job') {
					if (operation === 'startTranslation') {
						const urn = this.getNodeParameter('urn', i) as string;
						const outputFormat = this.getNodeParameter('outputFormat', i) as string;
						const region = this.getNodeParameter('region', i) as Region;

						responseData = await client.jobsApi.startJob(
							accessToken,
							undefined,
							undefined,
							region,
							{
								input: { urn },
								output: {
									formats: [
										{
											type: outputFormat as
												| 'svf'
												| 'svf2'
												| 'dwg'
												| 'ifc'
												| 'iges'
												| 'obj'
												| 'step'
												| 'stl'
												| 'thumbnail',
											views: ['2d', '3d'],
										},
									],
								},
							},
						);
					}
				} else if (resource === 'manifest') {
					const urn = this.getNodeParameter('urn', i) as string;
					const region = this.getNodeParameter('region', i) as Region;

					if (operation === 'get') {
						responseData = await client.manifestApi.getManifest(
							accessToken,
							urn,
							undefined,
							region,
						);
					} else if (operation === 'delete') {
						responseData = await client.manifestApi.deleteManifest(accessToken, urn, region);
					}
				} else if (resource === 'metadata') {
					const urn = this.getNodeParameter('urn', i) as string;
					const region = this.getNodeParameter('region', i) as Region;

					if (operation === 'getModelViews') {
						responseData = await client.metadataApi.getModelViews(
							accessToken,
							urn,
							undefined,
							region,
						);
					} else if (operation === 'getObjectTree') {
						const modelGuid = this.getNodeParameter('modelGuid', i) as string;
						const forceget = this.getNodeParameter('forceget', i, false) as boolean;
						responseData = await client.metadataApi.getObjectTree(
							accessToken,
							urn,
							modelGuid,
							undefined,
							region,
							undefined,
							undefined,
							forceget ? 'true' : undefined,
						);
					} else if (operation === 'getAllProperties') {
						const modelGuid = this.getNodeParameter('modelGuid', i) as string;
						const forceget = this.getNodeParameter('forceget', i, false) as boolean;
						responseData = await client.metadataApi.getAllProperties(
							accessToken,
							urn,
							modelGuid,
							undefined,
							undefined,
							undefined,
							region,
							undefined,
							forceget ? 'true' : undefined,
						);
					} else if (operation === 'fetchSpecificProperties') {
						const modelGuid = this.getNodeParameter('modelGuid', i) as string;
						responseData = await client.metadataApi.fetchSpecificProperties(
							accessToken,
							urn,
							modelGuid,
							undefined,
							region,
						);
					}
				} else if (resource === 'derivative') {
					if (operation === 'getDownloadUrl') {
						const urn = this.getNodeParameter('urn', i) as string;
						const derivativeUrn = this.getNodeParameter('derivativeUrn', i) as string;
						const region = this.getNodeParameter('region', i) as Region;
						responseData = await client.derivativesApi.getDerivativeUrl(
							accessToken,
							derivativeUrn,
							urn,
							undefined,
							undefined,
							region,
						);
					}
				} else if (resource === 'thumbnail') {
					if (operation === 'get') {
						const urn = this.getNodeParameter('urn', i) as string;
						const width = this.getNodeParameter('width', i) as number;
						const height = this.getNodeParameter('height', i) as number;
						const region = this.getNodeParameter('region', i) as Region;
						responseData = await client.thumbnailsApi.getThumbnail(
							accessToken,
							urn,
							region,
							width as 100 | 200 | 400,
							height as 100 | 200 | 400,
						);
					}
				} else if (resource === 'informational') {
					if (operation === 'getFormats') {
						responseData = await client.informationalApi.getFormats(accessToken);
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
