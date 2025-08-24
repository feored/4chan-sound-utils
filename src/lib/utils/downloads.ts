
export async function download_blob(
    url: string,
    on_progress: (progress: number) => void
): Promise<Blob> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const content_length = response.headers.get('Content-Length');
    if (!content_length) {
        throw new Error('Unable to determine file size for progress tracking.');
    }

    const total_size = parseInt(content_length, 10);
    let downloaded_size = 0;

    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];

    if (!reader) {
        throw new Error('Failed to read response body.');
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
            chunks.push(value);
            downloaded_size += value.length;

            // Calculate progress percentage
            const progress = (downloaded_size / total_size) * 100;
            on_progress(progress);
        }
    }

    // Combine all chunks into a single Blob
    const blob = new Blob(chunks);
    return blob;
}