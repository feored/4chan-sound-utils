// ffmpeg/webmParameters.ts
import type { Stream, VP8ExportSettings } from '$lib/ffmpeg/types';

export function get_webm_parameters(
    video_input: Stream,
    audio_input: Stream,
    settings: VP8ExportSettings
): string[] {
    return [
        '-i',
        video_input.name,
        '-i',
        audio_input.name,
        '-c:v',
        'libvpx',
        '-b:v',
        settings.bitrate,
        '-c:a',
        'libvorbis',
        '-b:a',
        '256k',
        'output.webm'
    ];
}