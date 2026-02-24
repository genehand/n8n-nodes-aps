import type { ICredentialType, INodeProperties, Icon } from 'n8n-workflow';

export class ApsClientCredentialsOAuth2Api implements ICredentialType {
	name = 'apsClientCredentialsOAuth2Api';

	displayName = 'APS Client Credentials OAuth2 API';

	documentationUrl = 'https://aps.autodesk.com/en/docs/oauth/v2/developers_guide/overview/';

	icon: Icon = 'file:aps.svg';

	extends = ['oAuth2Api'];

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'clientCredentials',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://developer.api.autodesk.com/authentication/v2/token',
			required: true,
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'data:read data:write data:create bucket:read bucket:create',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
