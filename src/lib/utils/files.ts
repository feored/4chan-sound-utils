const sound_re = /\[sound=(?<url>.*)]/;
const image_extensions = ['jpg', 'jpeg', 'png', 'gif'];
const video_extensions = ['mp4', 'webm', 'mkv'];
const audio_extensions = ['mp3', 'wav', 'ogg'];

export function get_url(file_name: String): string | null {
    // Check if the file name contains 'sound'
    const found = file_name.match(sound_re);
    let url = null;
    if (found && found.groups && found.groups.url) {
        url = decodeURIComponent(found.groups.url);
        if (!url.startsWith('http')) {
            url = 'https://' + url; // Ensure URL starts with http
        }
    }
    return url;
}

export function get_file_type(file_name: String): "image" | "video" | "audio" | "unknown" {
    const extension = file_name.split('.').pop()?.toLowerCase();
    if (extension) {
        if (image_extensions.includes(extension)) {
            return "image";
        } else if (video_extensions.includes(extension)) {
            return "video";
        } else if (audio_extensions.includes(extension)) {
            return "audio";
        }
    }
    return "unknown";
}

export function is_image(fileName: string): boolean {
    return get_file_type(fileName) === 'image';
}

export function get_file_name(file_name: String): string {
    let sound_removed = file_name.replaceAll(/\[.+?\]/g, "");
    let extension_removed = sound_removed.split('.')[0]
    return extension_removed.trim()
}

export function get_extension(file_name: String): string | null {
    const parts = file_name.split('.');
    if (parts.length > 1) {
        return parts.pop()?.toLowerCase() || null;
    }
    return null;
}
