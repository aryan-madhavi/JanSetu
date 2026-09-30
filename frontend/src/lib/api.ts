export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export async function fetchJson<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    ...options,
    credentials: options.credentials || 'include',
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    let errMessage = `API error: ${res.statusText} (${res.status})`;
    try {
      const errData = await res.json();
      if (errData && errData.detail) errMessage = errData.detail;
      else if (errData && errData.error) errMessage = errData.error;
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export async function downloadFile(endpoint: string, filename: string): Promise<void> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);
  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export function exportCsv(headers: string[], rows: any[][], filename: string): void {
  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(","), ...rows.map(e => e.map(x => `"${String(x ?? '').replace(/"/g, '""')}"`).join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
