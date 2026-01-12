export interface McpResponse {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
}

export function mcpSuccess<T>(data: T): McpResponse {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
  };
}

export function mcpError(message: string): McpResponse {
  return {
    content: [{ type: "text", text: `Error: ${message}` }]
  };
}

export type AuthResult =
  | { authenticated: false; response: McpResponse }
  | { authenticated: true; userId: string };

export function requireAuth(userId: string | null): AuthResult {
  if (!userId) {
    return {
      authenticated: false,
      response: mcpError(
        `Authentication required. Please provide an API token.

To get your API token:
1. Go to https://startup-hub.space/dashboard/settings/tokens
2. Create a new API token
3. Add it to your MCP config as STARTUP_HUB_API_TOKEN`
      )
    };
  }
  return { authenticated: true, userId };
}
