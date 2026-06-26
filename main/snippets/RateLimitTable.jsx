// Pure render component — no client state needed.

const ENDPOINT_LINKS = {
  // Authentication API
  'User Info': 'https://auth0.com/docs/api/authentication#get-user-info',
  'Change Password / Reset Password': 'https://auth0.com/docs/api/authentication#change-password',
  'Get Passwordless Code or Link': 'https://auth0.com/docs/api/authentication#passwordless',
  'Native Social Login (Apple / Facebook)': 'https://auth0.com/docs/api/authentication#verify-with-one-time-password-otp-',
  'Dynamic Application (Client) Registration': 'https://auth0.com/docs/api/authentication#dynamic-application-client-registration',
  'Universal Logout': 'https://auth0.com/docs/api/authentication#global-token-revocation',
  'On-Behalf-Of Token Exchange': '/docs/secure/call-apis-on-users-behalf/on-behalf-of-token-exchange',
  'Custom Token Exchange': '/docs/authenticate/custom-token-exchange',
  'Get Token': 'https://auth0.com/docs/api/authentication#get-token',
  'Cross-Origin Authentication': 'https://auth0.com/docs/api/authentication#cross-origin-authentication',
  'JSON Web Token Keys': 'https://auth0.com/docs/api/authentication#get-json-web-key-sets',
  'Pushed Authorization Requests (PAR)': 'https://auth0.com/docs/api/authentication#pushed-authorization-requests',
  'Back-Channel Authorize (CIBA)': 'https://auth0.com/docs/api/authentication#back-channel-authentication',
  'Device Code Activation (no prompt)': 'https://auth0.com/docs/api/authentication#get-device-code',
  'Device Code Authorization': 'https://auth0.com/docs/api/authentication#get-device-code',
  'MFA OOB Token Exchange': 'https://auth0.com/docs/api/authentication#multifactor-authentication',
  'Token Vault': '/docs/secure/call-apis-on-users-behalf/token-vault',
  // Management API
  'Read Organizations': 'https://auth0.com/docs/api/management/v2/organizations/get-organizations',
  'Read Organizations by ID': 'https://auth0.com/docs/api/management/v2/organizations/get-organizations-by-id',
  'Read Organizations by Name': 'https://auth0.com/docs/api/management/v2/organizations/get-name-by-name',
  'Write Organizations': 'https://auth0.com/docs/api/management/v2/organizations/post-organizations',
  'Write an Organization': 'https://auth0.com/docs/api/management/v2/organizations/post-organizations',
  'Read Organization Members': 'https://auth0.com/docs/api/management/v2/organizations/get-members',
  'Write Organization Members': 'https://auth0.com/docs/api/management/v2/organizations/post-members',
  'Read Members of an Organization': 'https://auth0.com/docs/api/management/v2/organizations/get-members',
  'Read Organization Member Roles': 'https://auth0.com/docs/api/management/v2/organizations/get-organization-member-roles',
  'Write Organization Member Roles': 'https://auth0.com/docs/api/management/v2/organizations/post-organization-member-roles',
  'Read Organization Connections': 'https://auth0.com/docs/api/management/v2/organizations/get-enabled-connections',
  'Write Organization Connections': 'https://auth0.com/docs/api/management/v2/organizations/post-enabled-connections',
  'Read Organization Client Grants': 'https://auth0.com/docs/api/management/v2/organizations/get-organization-client-grants',
  'Write Organization Client Grants': 'https://auth0.com/docs/api/management/v2/organizations/create-organization-client-grants',
  'Read Users': 'https://auth0.com/docs/api/management/v2/users/get-users',
  'Write Users': 'https://auth0.com/docs/api/management/v2/users/post-users',
  'Delete Users': 'https://auth0.com/docs/api/management/v2/users/delete-users-by-id',
  'Read Logs': 'https://auth0.com/docs/api/management/v2/logs/get-logs',
  'Read Clients': 'https://auth0.com/docs/api/management/v2/clients/get-clients',
  'Read Clients (q parameter)': 'https://auth0.com/docs/api/management/v2/clients/get-clients',
  'Read Connections': 'https://auth0.com/docs/api/management/v2/connections/get-connections',
  'Write Custom Domain': 'https://auth0.com/docs/api/management/v2/custom-domains/post-verify',
  'Write Custom Domains': 'https://auth0.com/docs/api/management/v2/custom-domains/post-verify',
  'Verify Custom Domain': 'https://auth0.com/docs/api/management/v2/custom-domains/post-verify',
  'Read Status Connection': 'https://auth0.com/docs/api/management/v2/connections/get-status',
  'Write Signing Keys': 'https://auth0.com/docs/api/management/v2/keys/post-signing-keys',
  'Rotate Signing Keys': 'https://auth0.com/docs/api/management/v2/keys/post-signing-keys',
  'Read Partials for a Prompt': 'https://auth0.com/docs/api/management/v2/prompts/get-partials',
  'Write Partials for a Prompt': 'https://auth0.com/docs/api/management/v2/prompts/put-partials',
  'Write Email Templates': 'https://auth0.com/docs/api/management/v2/email-templates/post-email-templates',
  'Read Email Templates': 'https://auth0.com/docs/api/management/v2/email-templates/get-email-templates-by-template-name',
  'Write Email Provider': 'https://auth0.com/docs/api/management/v2/emails/patch-provider',
  'Read Email Provider': 'https://auth0.com/docs/api/management/v2/emails/get-provider',
  'Write Token Exchange Profiles': '/docs/authenticate/custom-token-exchange/configure-custom-token-exchange#create-custom-token-exchange-profile',
  'Read Token Exchange Profiles': '/docs/authenticate/custom-token-exchange/configure-custom-token-exchange#manage-custom-token-exchange-profile',
  'Write Device Credentials': 'https://auth0.com/docs/api/management/v2/device-credentials/post-device-credentials',
};

// Tier data is embedded here for rendering.
// The canonical source of truth is main/data/rate-limits/*.json (used by CI validation).
// When you update a value in the JSON files, update the matching entry here too.

const TIER_DATA = {
  'free-public': {
    label: 'Free',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [
          { environment: 'production', burstRps: 300, sustainedUnit: '5/minute' },
        ],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Change Password / Reset Password', paths: ['/dbconnections/change_password'], methods: ['POST'], burstLimit: 10, sustainedLimit: '1/minute', limitKey: 'From an IP address to a unique email address' },
          { name: 'Get Passwordless Code or Link', paths: ['/passwordless/start'], methods: ['GET', 'POST'], burstLimit: 50, sustainedLimit: '50/hour', limitKey: 'From an IP address' },
          { name: 'Get Token', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 30, sustainedLimit: '30/second', limitKey: 'Any request' },
          { name: 'Cross-Origin Authentication', paths: ['/co/authenticate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'Any request' },
          { name: 'JSON Web Token Keys', paths: ['/.well-known/jwks.json'], methods: ['GET'], burstLimit: 20, sustainedLimit: '20/second', limitKey: 'Any request' },
          { name: 'Native Social Login (Apple / Facebook)', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 50, sustainedLimit: '50/minute', limitKey: 'Any request', notes: 'Apple or Facebook Native Social Login only' },
          { name: 'Dynamic Application (Client) Registration', paths: ['/oidc/register'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 2, sustainedLimit: '2/second', limitKey: 'Any request' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [
          { environment: 'production', burstRps: 2, sustainedUnit: '2/second' },
        ],
        endpointPolicies: [
          { name: 'Verify Custom Domain', paths: ['/api/v2/custom-domains/{id}/verify'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/minute', limitKey: 'Any request' },
          { name: 'Read Status Connection', paths: ['/api/v2/connections/{id}/status'], methods: ['GET'], burstLimit: 100, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'Rotate Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Write Email Templates', paths: ['/api/v2/email-templates'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
          { name: 'Read Email Templates', paths: ['/api/v2/email-templates'], methods: ['GET'], burstLimit: 10, sustainedLimit: '50/minute', limitKey: 'Any request' },
          { name: 'Write Email Provider', paths: ['/api/v2/emails/provider'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
          { name: 'Read Email Provider', paths: ['/api/v2/emails/provider'], methods: ['GET'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'essentials-professional': {
    label: 'Essentials and Professional',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [
          { environment: 'production', burstRps: 25, sustainedUnit: '25/second' },
          { environment: 'non-production', burstRps: 25, sustainedUnit: '25/second' },
        ],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Change Password / Reset Password', paths: ['/dbconnections/change_password'], methods: ['POST'], burstLimit: 10, sustainedLimit: '1/minute', limitKey: 'From an IP address to a unique email address' },
          { name: 'Get Passwordless Code or Link', paths: ['/passwordless/start'], methods: ['GET', 'POST'], burstLimit: 50, sustainedLimit: '50/hour', limitKey: 'From an IP address' },
          { name: 'Native Social Login (Apple / Facebook)', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 50, sustainedLimit: '500/minute', limitKey: 'Any request', notes: 'Apple or Facebook Native Social Login only' },
          { name: 'Dynamic Application (Client) Registration', paths: ['/oidc/register'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'Any request' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 35, sustainedLimit: '35/second', limitKey: 'Any request' },
          { name: 'Pushed Authorization Requests (PAR)', paths: ['/oauth/par'], methods: ['POST'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'From an IP address' },
          { name: 'Back-Channel Authorize (CIBA)', paths: ['/bc-authorize'], methods: ['POST'], burstLimit: 500, sustainedLimit: '500/minute', limitKey: 'From an IP address' },
          { name: 'Device Code Activation (no prompt)', paths: ['/oauth/device/code'], methods: ['POST'], burstLimit: 30, sustainedLimit: '6/second', limitKey: 'From an IP address' },
          { name: 'Device Code Authorization', paths: ['/oauth/device/code'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'From an IP address' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 4, sustainedLimit: '4/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 8, sustainedLimit: '8/second', limitKey: 'Any request' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [
          { environment: 'production', burstRps: 10, sustainedUnit: '150/minute' },
          { environment: 'non-production', burstRps: 10, sustainedUnit: '150/minute' },
        ],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 5, sustainedLimit: '50/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by Name', paths: ['/api/v2/organizations/name/{name}'], methods: ['GET'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 40, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Write Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['POST', 'DELETE'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Organization Member Roles', paths: ['/api/v2/organizations/{id}/members/{user_id}/roles'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Write Organization Member Roles', paths: ['/api/v2/organizations/{id}/members/{user_id}/roles'], methods: ['POST', 'DELETE'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Organization Connections', paths: ['/api/v2/organizations/{id}/enabled_connections'], methods: ['GET'], burstLimit: 5, sustainedLimit: '50/minute', limitKey: 'Any request' },
          { name: 'Write Organization Connections', paths: ['/api/v2/organizations/{id}/enabled_connections'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
          { name: 'Read Users', paths: ['/api/v2/users'], methods: ['GET'], burstLimit: 40, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Write Users', paths: ['/api/v2/users'], methods: ['POST', 'PATCH'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Delete Users', paths: ['/api/v2/users/{id}'], methods: ['DELETE'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Logs', paths: ['/api/v2/logs'], methods: ['GET'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Clients', paths: ['/api/v2/clients'], methods: ['GET'], burstLimit: 5, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Clients (q parameter)', paths: ['/api/v2/clients'], methods: ['GET'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request', notes: 'Only applies to requests using the q query parameter' },
          { name: 'Read Connections', paths: ['/api/v2/connections'], methods: ['GET'], burstLimit: 5, sustainedLimit: '50/minute', limitKey: 'Any request' },
          { name: 'Write Custom Domain', paths: ['/api/v2/custom-domains/{id}/verify'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/minute', limitKey: 'Any request' },
          { name: 'Read Status Connection', paths: ['/api/v2/connections/{id}/status'], methods: ['GET'], burstLimit: 100, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Read Partials for a Prompt', paths: ['/api/v2/prompts/{prompt}/partials'], methods: ['GET'], burstLimit: 5, sustainedLimit: '5/minute', limitKey: 'Any request' },
          { name: 'Write Partials for a Prompt', paths: ['/api/v2/prompts/{prompt}/partials'], methods: ['PUT'], burstLimit: 5, sustainedLimit: '5/minute', limitKey: 'Any request' },
          { name: 'Read Organization Client Grants', paths: ['/api/v2/organizations/{id}/client-grants'], methods: ['GET'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Write Organization Client Grants', paths: ['/api/v2/organizations/{id}/client-grants'], methods: ['POST'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Write Email Templates', paths: ['/api/v2/email-templates'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
          { name: 'Read Email Templates', paths: ['/api/v2/email-templates/{templateName}'], methods: ['GET'], burstLimit: 10, sustainedLimit: '50/minute', limitKey: 'Any request' },
          { name: 'Write Email Provider', paths: ['/api/v2/emails/provider'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
          { name: 'Read Email Provider', paths: ['/api/v2/emails/provider'], methods: ['GET'], burstLimit: 5, sustainedLimit: '25/minute', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'All other endpoints combined', paths: [], methods: [], burstLimit: 10, sustainedLimit: '150/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'enterprise-public': {
    label: 'Enterprise',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [
          { environment: 'production', burstRps: 100, sustainedUnit: '100/second' },
          { environment: 'production (2x Burst)', burstRps: 200, sustainedUnit: '100/second', notes: 'Up to 48 hours/month' },
          { environment: 'production (3x Burst)', burstRps: 300, sustainedUnit: '100/second', notes: 'Up to 48 hours/month' },
          { environment: 'production (4x Burst)', burstRps: 400, sustainedUnit: '100/second', notes: 'Up to 48 hours/month' },
          { environment: 'non-production', burstRps: 100, sustainedUnit: '100/second' },
        ],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Change Password / Reset Password', paths: ['/dbconnections/change_password'], methods: ['POST'], burstLimit: 10, sustainedLimit: '1/minute', limitKey: 'From an IP address to a unique email address' },
          { name: 'Get Passwordless Code or Link', paths: ['/passwordless/start'], methods: ['GET', 'POST'], burstLimit: 50, sustainedLimit: '50/hour', limitKey: 'From an IP address' },
          { name: 'Native Social Login (Apple / Facebook)', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 50, sustainedLimit: '500/minute', limitKey: 'Any request', notes: 'Apple or Facebook Native Social Login only' },
          { name: 'Dynamic Application (Client) Registration', paths: ['/oidc/register'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'Any request' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 35, sustainedLimit: '35/second', limitKey: 'Any request' },
          { name: 'Pushed Authorization Requests (PAR)', paths: ['/oauth/par'], methods: ['POST'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'From an IP address' },
          { name: 'Back-Channel Authorize (CIBA)', paths: ['/bc-authorize'], methods: ['POST'], burstLimit: 500, sustainedLimit: '500/minute', limitKey: 'From an IP address' },
          { name: 'Device Code Activation (no prompt)', paths: ['/oauth/device/code'], methods: ['POST'], burstLimit: 30, sustainedLimit: '6/second', limitKey: 'From an IP address' },
          { name: 'Device Code Authorization', paths: ['/oauth/device/code'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'From an IP address' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 15, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 30, sustainedLimit: '30/second', limitKey: 'Any request' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [
          { environment: 'production', burstRps: 50, sustainedUnit: '16/second' },
          { environment: 'non-production', burstRps: 10, sustainedUnit: '2/second' },
        ],
        endpointPolicies: [
          { name: 'Read Organizations by Name', paths: ['/api/v2/organizations/name/{name}'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 40, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Write Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['POST', 'DELETE'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Organization Member Roles', paths: ['/api/v2/organizations/{id}/members/{user_id}/roles'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Write Organization Member Roles', paths: ['/api/v2/organizations/{id}/members/{user_id}/roles'], methods: ['POST', 'DELETE'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Organization Connections', paths: ['/api/v2/organizations/{id}/enabled_connections'], methods: ['GET'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Write Organization Connections', paths: ['/api/v2/organizations/{id}/enabled_connections'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Write Custom Domains', paths: ['/api/v2/custom-domains/{id}/verify'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/minute', limitKey: 'Any request' },
          { name: 'Read Status Connection', paths: ['/api/v2/connections/{id}/status'], methods: ['GET'], burstLimit: 100, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Read Partials for a Prompt', paths: ['/api/v2/prompts/{prompt}/partials'], methods: ['GET'], burstLimit: 5, sustainedLimit: '5/minute', limitKey: 'Any request' },
          { name: 'Write Partials for a Prompt', paths: ['/api/v2/prompts/{prompt}/partials'], methods: ['PUT'], burstLimit: 5, sustainedLimit: '5/minute', limitKey: 'Any request' },
          { name: 'Read Clients (q parameter)', paths: ['/api/v2/clients'], methods: ['GET'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request', notes: 'Only applies to requests using the q query parameter' },
          { name: 'Read Organization Client Grants', paths: ['/api/v2/organizations/{id}/client-grants'], methods: ['GET'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Write Organization Client Grants', paths: ['/api/v2/organizations/{id}/client-grants'], methods: ['POST'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Write Email Templates', paths: ['/api/v2/email-templates'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Email Templates', paths: ['/api/v2/email-templates/{templateName}'], methods: ['GET'], burstLimit: 15, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Write Email Provider', paths: ['/api/v2/emails/provider'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Email Provider', paths: ['/api/v2/emails/provider'], methods: ['GET'], burstLimit: 15, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'tier-dev-private-cloud': {
    label: 'Tier Dev Private Cloud',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 20, sustainedUnit: '20/second' }],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Change Password / Reset Password', paths: ['/dbconnections/change_password'], methods: ['POST'], burstLimit: 10, sustainedLimit: '1/minute', limitKey: 'From an IP address to a unique email address' },
          { name: 'Get Passwordless Code or Link', paths: ['/passwordless/start'], methods: ['GET', 'POST'], burstLimit: 50, sustainedLimit: '50/hour', limitKey: 'From an IP address' },
          { name: 'Native Social Login (Apple / Facebook)', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 50, sustainedLimit: '500/minute', limitKey: 'Any request', notes: 'Apple or Facebook only' },
          { name: 'Dynamic Application (Client) Registration', paths: ['/oidc/register'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'Any request' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 35, sustainedLimit: '35/second', limitKey: 'Any request' },
          { name: 'Pushed Authorization Requests (PAR)', paths: ['/oauth/par'], methods: ['POST'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'From an IP address' },
          { name: 'Back-Channel Authorize (CIBA)', paths: ['/bc-authorize'], methods: ['POST'], burstLimit: 500, sustainedLimit: '500/minute', limitKey: 'From an IP address' },
          { name: 'Device Code Activation (no prompt)', paths: ['/oauth/device/code'], methods: ['POST'], burstLimit: 30, sustainedLimit: '6/second', limitKey: 'From an IP address' },
          { name: 'Device Code Authorization', paths: ['/oauth/device/code'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/second', limitKey: 'From an IP address' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
          { name: 'Token Vault', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 10, sustainedLimit: '10/second', limitKey: 'Any request' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 20, sustainedUnit: '20/second' }],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 40, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by Name', paths: ['/api/v2/organizations/name/{name}'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 40, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Write Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['POST', 'DELETE'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Status Connection', paths: ['/api/v2/connections/{id}/status'], methods: ['GET'], burstLimit: 100, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'tier-100-rps': {
    label: 'Private Cloud Basic 100 RPS (1x)',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 100, sustainedUnit: '100/second' }],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Change Password / Reset Password', paths: ['/dbconnections/change_password'], methods: ['POST'], burstLimit: 10, sustainedLimit: '1/minute', limitKey: 'From an IP address to a unique email address' },
          { name: 'Get Passwordless Code or Link', paths: ['/passwordless/start'], methods: ['GET', 'POST'], burstLimit: 50, sustainedLimit: '50/hour', limitKey: 'From an IP address' },
          { name: 'Native Social Login (Apple / Facebook)', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 50, sustainedLimit: '500/minute', limitKey: 'Any request', notes: 'Apple or Facebook only' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 35, sustainedLimit: '35/second', limitKey: 'Any request' },
          { name: 'Pushed Authorization Requests (PAR)', paths: ['/oauth/par'], methods: ['POST'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'From an IP address' },
          { name: 'Back-Channel Authorize (CIBA)', paths: ['/bc-authorize'], methods: ['POST'], burstLimit: 500, sustainedLimit: '500/minute', limitKey: 'From an IP address' },
          { name: 'Device Code Activation (no prompt)', paths: ['/oauth/device/code'], methods: ['POST'], burstLimit: 30, sustainedLimit: '6/second', limitKey: 'From an IP address' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 15, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'Token Vault', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 50, sustainedLimit: '50/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 30, sustainedLimit: '30/second', limitKey: 'Any request' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 50, sustainedUnit: '50/second' }],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 10, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 40, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by Name', paths: ['/api/v2/organizations/name/{name}'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '150/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 40, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Write Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['POST', 'DELETE'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
          { name: 'Read Status Connection', paths: ['/api/v2/connections/{id}/status'], methods: ['GET'], burstLimit: 100, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 5, sustainedLimit: '100/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 20, sustainedLimit: '200/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 100, sustainedLimit: '100/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'tier-500-rps': {
    label: 'Private Cloud Performance 500 RPS (5x)',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 500, sustainedUnit: '500/second' }],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 125, sustainedLimit: '125/second', limitKey: 'Any request' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 75, sustainedLimit: '75/second', limitKey: 'Any request' },
          { name: 'Token Vault', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 240, sustainedLimit: '240/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 150, sustainedLimit: '150/second', limitKey: 'Any request' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
          { name: 'Back-Channel Authorize (CIBA)', paths: ['/bc-authorize'], methods: ['POST'], burstLimit: 500, sustainedLimit: '500/minute', limitKey: 'From an IP address' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 250, sustainedUnit: '250/second' }],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 50, sustainedLimit: '500/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 50, sustainedLimit: '2500/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by Name', paths: ['/api/v2/organizations/name/{name}'], methods: ['GET'], burstLimit: 100, sustainedLimit: '1000/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '750/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 200, sustainedLimit: '2500/minute', limitKey: 'Any request' },
          { name: 'Write Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['POST', 'DELETE'], burstLimit: 100, sustainedLimit: '1000/minute', limitKey: 'Any request' },
          { name: 'Read Status Connection', paths: ['/api/v2/connections/{id}/status'], methods: ['GET'], burstLimit: 100, sustainedLimit: '15/second', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 15, sustainedLimit: '300/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 100, sustainedLimit: '1000/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 250, sustainedLimit: '250/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'tier-1500-rps': {
    label: 'Private Cloud Performance 1,500 RPS (15x)',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 1500, sustainedUnit: '1500/second' }],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 375, sustainedLimit: '375/second', limitKey: 'Any request' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 225, sustainedLimit: '225/second', limitKey: 'Any request' },
          { name: 'Token Vault', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 700, sustainedLimit: '700/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 450, sustainedLimit: '450/second', limitKey: 'Any request' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 750, sustainedUnit: '750/second' }],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 150, sustainedLimit: '1500/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 150, sustainedLimit: '7500/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 75, sustainedLimit: '2250/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 600, sustainedLimit: '7500/minute', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 15, sustainedLimit: '300/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 300, sustainedLimit: '3000/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 750, sustainedLimit: '750/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'tier-3000-rps': {
    label: 'Private Cloud Performance 3,000 RPS (30x)',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [
          { environment: 'production (30x)', burstRps: 3000, sustainedUnit: '3000/second' },
          { environment: 'production (30x Burst base)', burstRps: 3000, sustainedUnit: '1500/second', notes: 'Base 1,500 RPS; burst to 3,000 RPS for up to 80 hours/month' },
        ],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 750, sustainedLimit: '750/second', limitKey: 'Any request' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 450, sustainedLimit: '450/second', limitKey: 'Any request' },
          { name: 'Token Vault', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 700, sustainedLimit: '700/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 900, sustainedLimit: '900/second', limitKey: 'Any request' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 1500, sustainedUnit: '1500/second' }],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 300, sustainedLimit: '3000/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 300, sustainedLimit: '15000/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 150, sustainedLimit: '4500/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 1200, sustainedLimit: '15000/minute', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 15, sustainedLimit: '300/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 600, sustainedLimit: '6000/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 1500, sustainedLimit: '1500/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'tier-6000-rps': {
    label: 'Private Cloud Performance 6,000 RPS (60x)',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [
          { environment: 'production (60x)', burstRps: 6000, sustainedUnit: '6000/second' },
          { environment: 'production (60x Burst base)', burstRps: 6000, sustainedUnit: '3000/second', notes: 'Base 3,000 RPS; burst to 6,000 RPS for up to 80 hours/month' },
        ],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 1500, sustainedLimit: '1500/second', limitKey: 'Any request' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 900, sustainedLimit: '900/second', limitKey: 'Any request' },
          { name: 'Token Vault', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 700, sustainedLimit: '700/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 1800, sustainedLimit: '1800/second', limitKey: 'Any request' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 3000, sustainedUnit: '3000/second' }],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 600, sustainedLimit: '6000/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 600, sustainedLimit: '30000/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 300, sustainedLimit: '9000/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 2400, sustainedLimit: '30000/minute', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 15, sustainedLimit: '300/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 1200, sustainedLimit: '12000/minute', limitKey: 'Any request' },
        ],
      },
      {
        name: 'SCIM API',
        globalLimits: [],
        endpointPolicies: [
          { name: 'Single SCIM connection endpoint', paths: ['/scim/v2/connections/{connection-id}'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 25, sustainedLimit: '25/second', limitKey: 'Any request' },
          { name: 'Global tenant limit (all SCIM connections)', paths: ['/scim/v2/connections/*'], methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], burstLimit: 3000, sustainedLimit: '3000/second', limitKey: 'Any request' },
        ],
      },
    ],
  },

  'tier-10000-rps': {
    label: 'Private Cloud Performance 10,000 RPS (100x)',
    apis: [
      {
        name: 'Authentication API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 10000, sustainedUnit: '10000/second' }],
        endpointPolicies: [
          { name: 'User Info', paths: ['/userinfo'], methods: ['GET', 'POST'], burstLimit: 10, sustainedLimit: '5/minute', limitKey: 'To a unique user ID' },
          { name: 'Universal Logout', paths: ['/oauth/logout'], methods: ['POST'], burstLimit: 2500, sustainedLimit: '2500/second', limitKey: 'Any request' },
          { name: 'Custom Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 1500, sustainedLimit: '1500/second', limitKey: 'Any request' },
          { name: 'Token Vault', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 700, sustainedLimit: '700/second', limitKey: 'Any request' },
          { name: 'On-Behalf-Of Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 3000, sustainedLimit: '3000/second', limitKey: 'Any request' },
          { name: 'MFA OOB Token Exchange', paths: ['/oauth/token'], methods: ['POST'], burstLimit: 12, sustainedLimit: '12/minute', limitKey: 'To a unique session' },
        ],
      },
      {
        name: 'Management API',
        globalLimits: [{ environment: 'production / non-production', burstRps: 5000, sustainedUnit: '5000/second' }],
        endpointPolicies: [
          { name: 'Read Organizations', paths: ['/api/v2/organizations'], methods: ['GET'], burstLimit: 1000, sustainedLimit: '10000/minute', limitKey: 'Any request' },
          { name: 'Read Organizations by ID', paths: ['/api/v2/organizations/{id}'], methods: ['GET'], burstLimit: 4000, sustainedLimit: '50000/minute', limitKey: 'Any request' },
          { name: 'Write Organizations', paths: ['/api/v2/organizations'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 500, sustainedLimit: '15000/minute', limitKey: 'Any request' },
          { name: 'Read Organization Members', paths: ['/api/v2/organizations/{id}/members'], methods: ['GET'], burstLimit: 4800, sustainedLimit: '60000/minute', limitKey: 'Any request' },
          { name: 'Write Signing Keys', paths: ['/api/v2/keys/signing/rotate'], methods: ['POST'], burstLimit: 5, sustainedLimit: '5/day', limitKey: 'Any request' },
          { name: 'Write Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['POST', 'PATCH', 'DELETE'], burstLimit: 15, sustainedLimit: '300/minute', limitKey: 'Any request' },
          { name: 'Read Token Exchange Profiles', paths: ['/api/v2/token-exchange-profiles'], methods: ['GET'], burstLimit: 2000, sustainedLimit: '20000/minute', limitKey: 'Any request' },
        ],
      },
    ],
  },
};

function GlobalLimitsTable({ limits }) {
  if (!limits || limits.length === 0) return null;
  const hasNotes = limits.some((l) => l.notes);
  return (
    <table>
      <thead>
        <tr>
          <th>Environment</th>
          <th>Burst (RPS)</th>
          <th>Sustained</th>
          {hasNotes && <th>Notes</th>}
        </tr>
      </thead>
      <tbody>
        {limits.map((limit, i) => (
          <tr key={i}>
            <td>{limit.environment}</td>
            <td>{limit.burstRps}</td>
            <td>{limit.sustainedUnit}</td>
            {hasNotes && <td>{limit.notes || '—'}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EndpointPoliciesTable({ policies }) {
  if (!policies || policies.length === 0) return null;
  return (
    <table>
      <thead>
        <tr>
          <th>Endpoint</th>
          <th>Method</th>
          <th>Path</th>
          <th>Burst Limit</th>
          <th>Sustained Limit</th>
          <th>Limit Key</th>
        </tr>
      </thead>
      <tbody>
        {policies.map((policy, i) => (
          <tr key={i}>
            <td>
              {ENDPOINT_LINKS[policy.name]
                ? <a href={ENDPOINT_LINKS[policy.name]} target="_blank" rel="noreferrer">{policy.name}</a>
                : policy.name}
              {policy.notes && <><br /><small style={{ color: '#6B7280' }}>{policy.notes}</small></>}
            </td>
            <td>{policy.methods.map((m) => <code key={m} style={{ marginRight: '4px' }}>{m}</code>)}</td>
            <td>{policy.paths.map((p) => <div key={p}><code>{p}</code></div>)}</td>
            <td>{policy.burstLimit}</td>
            <td>{policy.sustainedLimit}</td>
            <td>{policy.limitKey}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Accepts tier + optional api + optional environment props.
// environment: "production" → Prod tab, "non-production" → Dev/Staging tabs
export function RateLimitTable({ tier, api, environment }) {
  const data = TIER_DATA[tier];
  if (!data) return <p>Rate limit data not found for tier: <code>{tier}</code></p>;

  const apisToRender = api
    ? data.apis.filter((a) => a.name === api)
    : data.apis;

  return (
    <>
      {apisToRender.map((apiData) => {
        const globalLimits = environment
          ? (apiData.globalLimits || []).filter((l) =>
              l.environment === environment ||
              l.environment.startsWith(environment) ||
              l.environment.includes('/ ' + environment)
            )
          : (apiData.globalLimits || []);

        if (environment && globalLimits.length === 0) {
          return (
            <div key={apiData.name}>
              <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
                No specific rate limits defined for this environment. The <strong>production</strong> limits apply.
              </p>
            </div>
          );
        }

        return (
          <div key={apiData.name}>
            {globalLimits.length > 0 && (
              <>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>
                  Global limit — applies to all endpoints unless a specific endpoint policy overrides it.
                </p>
                <GlobalLimitsTable limits={globalLimits} />
              </>
            )}
            {apiData.endpointPolicies && apiData.endpointPolicies.length > 0 && (
              <>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '16px', marginBottom: '8px' }}>
                  Endpoint-specific limits — these override the global limit for the listed paths.
                </p>
                <EndpointPoliciesTable policies={apiData.endpointPolicies} />
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

const ENV_OPTIONS = ['Dev', 'Staging', 'Prod'];
const ENV_MAP = { Dev: 'non-production', Staging: 'non-production', Prod: 'production' };

export function RateLimitDropdownSelector({ tier, apis = DEFAULT_APIS }) {
  const [env, setEnv] = React.useState('Prod');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            style={{
              appearance: 'none', WebkitAppearance: 'none',
              padding: '5px 28px 5px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="Dev">Dev</option>
            <option value="Staging">Staging</option>
            <option value="Prod">Prod</option>
          </select>
          <span style={{
            position: 'absolute', right: '8px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '10px',
            color: 'var(--muted)', pointerEvents: 'none',
          }}>▾</span>
        </div>
      </div>
      {apis.map((api) => (
        <div key={api} style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>{api}</p>
          <RateLimitTable tier={tier} api={api} environment={ENV_MAP[env]} />
        </div>
      ))}
    </div>
  );
}
const DEFAULT_APIS = ['Authentication API', 'Management API', 'SCIM API'];

export function CapsuleEnvSelector({ tier, apis = DEFAULT_APIS }) {
  const [selected, setSelected] = React.useState('Prod');

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {ENV_OPTIONS.map((env) => (
          <button
            key={env}
            onClick={() => setSelected(env)}
            style={{
              padding: '4px 16px',
              borderRadius: '999px',
              border: selected === env ? 'none' : '1px solid var(--border)',
              background: selected === env ? 'rgb(var(--primary))' : 'transparent',
              color: selected === env ? '#fff' : 'var(--foreground)',
              fontSize: '13px',
              fontWeight: selected === env ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              lineHeight: '1.5',
            }}
          >
            {env}
          </button>
        ))}
      </div>
      {apis.map((api) => (
        <div key={api} style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{api}</p>
          <RateLimitTable tier={tier} api={api} environment={ENV_MAP[selected]} />
        </div>
      ))}
    </div>
  );
}
