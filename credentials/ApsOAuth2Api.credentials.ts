import type { ICredentialType, INodeProperties, Icon, ICredentialTestRequest } from 'n8n-workflow';

export class ApsOAuth2Api implements ICredentialType {
	name = 'apsOAuth2Api';

	displayName = 'Autodesk APS - OAuth2 API';

	documentationUrl = 'https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/';

	icon: Icon = 'file:aps.svg';

	extends = ['oAuth2Api'];

	properties: INodeProperties[] = [
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://developer.api.autodesk.com/authentication/v2/authorize',
			required: true,
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://developer.api.autodesk.com/authentication/v2/token',
			required: true,
		},
		{
			displayName: 'Token Type',
			name: 'tokenType',
			type: 'hidden',
			default: 'Bearer',
			typeOptions: { password: true },
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'data:read data:write data:create account:read',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'header',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://developer.api.autodesk.com',
			url: '/oss/v2/buckets',
		},
	};
}
