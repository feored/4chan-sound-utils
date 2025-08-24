import type { Stream, ExportSettings, x264ExportSettings, VP8ExportSettings } from '../../types';
import { get_mp4_parameters } from './mp4_parameters';
import { get_webm_parameters } from './webm_parameters';
import { get_ogg_parameters } from './ogg_parameters';

export function get_ffmpeg_parameters(
    settings: ExportSettings,
    video_input: Stream,
    audio_input?: Stream,
): string[] {
    switch (settings.output_format) {
        case 'mp4':
            return get_mp4_parameters(
                settings,
                video_input,
                audio_input

            );
        case 'webm':
            return get_webm_parameters(
                settings,
                video_input,
                audio_input,
            );
        case 'ogg':
            return get_ogg_parameters(
                settings,
                video_input,
            );
        default:
            throw new Error(`Unsupported output format: ${settings.output_format}`);
    }
}