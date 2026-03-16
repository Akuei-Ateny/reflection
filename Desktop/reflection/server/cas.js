/**
 * Princeton CAS (Central Authentication Service) client.
 * Uses https://fed.princeton.edu/cas/ per Princeton COS333 documentation.
 */

const PRINCETON_CAS_BASE = 'https://fed.princeton.edu/cas';

export function getLoginUrl(serviceUrl) {
  const encoded = encodeURIComponent(serviceUrl);
  return `${PRINCETON_CAS_BASE}/login?service=${encoded}`;
}

export function getLogoutUrl(optionalRedirectUrl) {
  if (optionalRedirectUrl) {
    return `${PRINCETON_CAS_BASE}/logout?url=${encodeURIComponent(optionalRedirectUrl)}`;
  }
  return `${PRINCETON_CAS_BASE}/logout`;
}

/**
 * Validate a CAS service ticket and return the NetID, or null if invalid.
 * Princeton CAS /validate returns two lines: "yes" and the netid.
 */
export async function validateTicket(serviceUrl, ticket) {
  const url = `${PRINCETON_CAS_BASE}/validate?service=${encodeURIComponent(serviceUrl)}&ticket=${encodeURIComponent(ticket)}`;
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  const lines = text.trim().split('\n');
  if (lines.length >= 2 && lines[0].trim().toLowerCase() === 'yes') {
    return lines[1].trim();
  }
  return null;
}
