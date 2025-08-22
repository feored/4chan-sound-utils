// ffmpeg/webmParameters.ts
import type { Stream, ExportSettings, TrimSettings } from '$lib/ffmpeg/types';
import { format_ffmpeg_time } from '$lib/utils/utils';

// used to extract audio from a video file and save it as an OGG file
export function get_ogg_parameters(
    settings: ExportSettings,
    video_input: Stream
): string[] {
    const command = create_base_command(video_input);
    if (settings.trim) {
        add_trim(command, settings.trim);
    }
    add_audio_settings(command);
    finalize_command(command);
    return command;
}

function create_base_command(video_input: Stream): string[] {
    return [`-i`, video_input.name, `-map`, `0:a:0`];
}

function add_trim(command: string[], trim_settings: TrimSettings): void {
    const fast_skip_start = Math.floor(0.9 * trim_settings.start); // Skip 90% of the start time quickly but approximately,
    const rest_skip_start = trim_settings.start - fast_skip_start; // then seek to the exact start time
    command.unshift(`-ss`, format_ffmpeg_time(fast_skip_start));
    command.push(`-ss`, format_ffmpeg_time(rest_skip_start));
    command.push(`-t`, format_ffmpeg_time(trim_settings.end - trim_settings.start));
}

function add_audio_settings(command: string[]): void {
    command.push(`-c:a`, `libvorbis`, `-b:a`, `256k`);
}

function finalize_command(command: string[]): void {
    command.push(`output.ogg`);
}
