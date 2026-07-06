/**
 * Direct-to-Supabase-Storage upload via raw XHR instead of the supabase-js
 * client. supabase-js's storage upload is fetch-based, and fetch has no
 * upload-progress event — XHR's `upload.onprogress` is the only way to get
 * real percent-complete for a browser upload, which is what powers every
 * progress bar/spinner in the editor.
 */
export function uploadToSupabaseStorage(
  supabaseUrl: string,
  anonKey: string,
  bucket: string,
  path: string,
  payload: Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`);
    xhr.setRequestHeader("Authorization", `Bearer ${anonKey}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.message) message = body.message;
      } catch {
        /* non-JSON error body — keep the generic message */
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again."));
    xhr.send(payload);
  });
}

export function publicStorageUrl(supabaseUrl: string, bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURI(path)}`;
}
