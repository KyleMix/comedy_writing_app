// Client side Google Docs export. No backend. We use Google Identity Services
// for an OAuth 2.0 access token in the browser, then the Drive API to create
// a native Google Doc by uploading HTML, which Drive converts on import.
//
// The only scope requested is drive.file, which lets the app create and open
// the docs it makes and nothing else. The access token lives in memory for
// the session and is never persisted.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/drive.file";

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
  callback: (resp: TokenResponse) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (resp: TokenResponse) => void;
    error_callback?: (err: { type?: string; message?: string }) => void;
  }) => TokenClient;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in a browser."));
  }
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Could not load Google Identity Services.")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () =>
      reject(new Error("Could not load Google Identity Services."));
    document.head.appendChild(s);
  });
  return gisPromise;
}

// In memory token cache so repeated saves in one session do not re prompt.
let cachedToken: { value: string; expires: number } | null = null;

export async function getAccessToken(clientId: string): Promise<string> {
  if (!clientId.trim()) {
    throw new Error("Add your Google OAuth client ID in Settings first.");
  }
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) {
    return cachedToken.value;
  }

  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error("Google Identity Services unavailable.");

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(
            new Error(
              resp.error_description || resp.error || "Authorization failed.",
            ),
          );
          return;
        }
        // GIS access tokens last about an hour. Cache conservatively.
        cachedToken = {
          value: resp.access_token,
          expires: Date.now() + 50 * 60_000,
        };
        resolve(resp.access_token);
      },
      error_callback: (err) =>
        reject(new Error(err.message || "Authorization was cancelled.")),
    });
    client.requestAccessToken();
  });
}

export interface CreatedDoc {
  id: string;
  webViewLink: string;
}

// Upload HTML as a native Google Doc via a multipart Drive request.
export async function createGoogleDoc(
  token: string,
  name: string,
  html: string,
): Promise<CreatedDoc> {
  const boundary = "jokeforge" + Math.random().toString(36).slice(2);
  const metadata = {
    name,
    mimeType: "application/vnd.google-apps.document",
  };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    "Content-Type: text/html; charset=UTF-8\r\n\r\n" +
    html +
    `\r\n--${boundary}--`;

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Drive error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as CreatedDoc;
  return data;
}

// Convenience: get a token and create the doc in one call.
export async function saveToGoogleDocs(
  clientId: string,
  name: string,
  html: string,
): Promise<CreatedDoc> {
  const token = await getAccessToken(clientId);
  return createGoogleDoc(token, name, html);
}
