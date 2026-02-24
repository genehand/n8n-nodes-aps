import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import {
	getAccessToken,
	createDataManagementClient,
	handlePaginatedResponse,
} from '../Aps/ApsHelpers';

export class ApsDataManagement implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Autodesk APS - Data Management',
		name: 'apsDataManagement',
		icon: 'file:aps.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with APS Data Management API',
		defaults: {
			name: 'APS Data Management',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'apsOAuth2Api',
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
						name: 'Folder',
						value: 'folder',
					},
					{
						name: 'Hub',
						value: 'hub',
					},
					{
						name: 'Item',
						value: 'item',
					},
					{
						name: 'Project',
						value: 'project',
					},
					{
						name: 'Version',
						value: 'version',
					},
				],
				default: 'folder',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['hub'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'List hubs',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a hub',
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
						resource: ['project'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get projects',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a project',
					},
					{
						name: 'Get Top Folders',
						value: 'getTopFolders',
						action: 'List top level project folders',
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
						resource: ['folder'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get a folder',
					},
					{
						name: 'Get Contents',
						value: 'getContents',
						action: 'List folder contents',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'List folder and subfolder contents',
					},
					{
						name: 'Create',
						value: 'create',
						action: 'Create a folder',
					},
				],
				default: 'getContents',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['item'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get an item',
					},
					{
						name: 'Get Versions',
						value: 'getVersions',
						action: 'Get item versions',
					},
					{
						name: 'Get Tip',
						value: 'getTip',
						action: 'Get item tip',
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
						resource: ['version'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get a version',
					},
				],
				default: 'get',
			},
			// Hub operations parameters
			{
				displayName: 'Hub ID',
				name: 'hubId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['hub'],
						operation: ['get'],
					},
				},
			},
			// Project operations parameters
			{
				displayName: 'Hub ID',
				name: 'hubId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
			},
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['get', 'getTopFolders'],
					},
				},
			},
			// Folder operations parameters
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['folder'],
					},
				},
			},
			{
				displayName: 'Folder ID',
				name: 'folderId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['get', 'getContents', 'search'],
					},
				},
			},
			{
				displayName: 'Filter Field Name',
				name: 'filterFieldName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Folder Name',
				name: 'folderName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Parent Folder ID',
				name: 'parentFolderId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['folder'],
						operation: ['create'],
					},
				},
			},
			// Item operations parameters
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['item'],
					},
				},
			},
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['item'],
					},
				},
			},
			// Version operations parameters
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['version'],
					},
				},
			},
			{
				displayName: 'Version ID',
				name: 'versionId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['version'],
					},
				},
			},
			// Common options
			{
				displayName: 'Simplify Response',
				name: 'simplify',
				type: 'boolean',
				default: true,
				description: 'Whether to simplify the JSON:API response',
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

		const accessToken = await getAccessToken(this, 'apsOAuth2Api');
		const client = createDataManagementClient(accessToken);

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'hub') {
					if (operation === 'getAll') {
						responseData = await client.hubsApi.getHubs(accessToken);
					} else if (operation === 'get') {
						const hubId = this.getNodeParameter('hubId', i) as string;
						responseData = await client.hubsApi.getHub(accessToken, hubId);
					}
				} else if (resource === 'project') {
					const hubId = this.getNodeParameter('hubId', i) as string;
					if (operation === 'getAll') {
						responseData = await client.projectsApi.getHubProjects(accessToken, hubId);
					} else if (operation === 'get') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						responseData = await client.projectsApi.getProject(accessToken, hubId, projectId);
					} else if (operation === 'getTopFolders') {
						const projectId = this.getNodeParameter('projectId', i) as string;
						responseData = await client.projectsApi.getProjectTopFolders(
							accessToken,
							hubId,
							projectId,
						);
					}
				} else if (resource === 'folder') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					if (operation === 'get') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						responseData = await client.foldersApi.getFolder(accessToken, projectId, folderId);
					} else if (operation === 'getContents') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						responseData = await client.foldersApi.getFolderContents(
							accessToken,
							projectId,
							folderId,
						);
					} else if (operation === 'search') {
						const folderId = this.getNodeParameter('folderId', i) as string;
						const filterFieldName = this.getNodeParameter('filterFieldName', i) as string;
						responseData = await client.foldersApi.getFolderSearch(
							accessToken,
							projectId,
							folderId,
							filterFieldName,
						);
					} else if (operation === 'create') {
						// Create folder uses folders API
						const folderName = this.getNodeParameter('folderName', i) as string;
						const parentFolderId = this.getNodeParameter('parentFolderId', i) as string;
						responseData = await client.foldersApi.createFolder(accessToken, projectId, undefined, {
							jsonapi: { version: '1.0' },
							data: {
								type: 'folders',
								attributes: {
									name: folderName,
									extension: {
										type: 'folders:autodesk.core:Folder',
										version: '1.0',
									},
								},
								relationships: {
									parent: {
										data: { type: 'folders', id: parentFolderId },
									},
								},
							},
						});
					}
				} else if (resource === 'item') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const itemId = this.getNodeParameter('itemId', i) as string;
					if (operation === 'get') {
						responseData = await client.itemsApi.getItem(accessToken, projectId, itemId);
					} else if (operation === 'getVersions') {
						responseData = await client.itemsApi.getItemVersions(accessToken, projectId, itemId);
					} else if (operation === 'getTip') {
						responseData = await client.itemsApi.getItemTip(accessToken, projectId, itemId);
					}
				} else if (resource === 'version') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const versionId = this.getNodeParameter('versionId', i) as string;
					if (operation === 'get') {
						responseData = await client.versionsApi.getVersion(accessToken, projectId, versionId);
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
