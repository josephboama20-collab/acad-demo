/** Shared CORS helper — restricts origins instead of wildcard '*'. */

const ALLOWED_ORIGINS = [
  'http://localhost:8888',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return 'null';
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  // In deployed environments, allow matching the deploy URL
  const deployedUrl = Deno.env.get('DEPLOY_URL') ?? Deno.env.get('URL');
  if (deployedUrl && requestOrigin === deployedUrl) return requestOrigin;
  return 'null';
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = req.headers.get('Origin');
  const origin = getAllowedOrigin(requestOrigin);
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  };
}
