import type { Stream, ExportSettings, x264ExportSettings, VP8ExportSettings } from '../types';
import { get_mp4_parameters } from './mp4_parameters';
import { get_webm_parameters } from './webm_parameters';

export function get_ffmpeg_parameters(
    video_input: Stream,
    audio_input: Stream,
    settings: ExportSettings
): string[] {
    switch (settings.output_format) {
        case 'mp4':
            return get_mp4_parameters(
                video_input,
                audio_input,
                settings.settings as x264ExportSettings
            );
        case 'webm':
            return get_webm_parameters(
                video_input,
                audio_input,
                settings.settings as VP8ExportSettings
            );
        default:
            throw new Error(`Unsupported output format: ${settings.output_format}`);
    }
}