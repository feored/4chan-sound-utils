// ffmpeg/webmParameters.ts
import type { Stream, VP8ExportSettings, ExportSettings, TrimSettings, CropSettings } from '$lib/ffmpeg/types';
import { format_ffmpeg_time } from '$lib/utils/utils';

export function get_webm_parameters(
    settings: ExportSettings,
    video_input: Stream,
    audio_input?: Stream,
): string[] {
    const vp8_settings = settings.settings as VP8ExportSettings;
    const has_audio = audio_input && settings.remove_audio === false;
    const command = create_base_command(video_input);
    if (has_audio) {
        add_audio_input(command, audio_input);
    }
    if (settings.trim) {
        add_trim(command, settings.trim);
    }
    if (settings.crop && settings.crop.width > 0 && settings.crop.height > 0) {
        add_crop(command, settings.crop);
    }
    add_video_settings(command, vp8_settings);
    if (has_audio) {
        add_audio_settings(command);
    }
    finalize_command(command);
    return command;
}

function create_base_command(video_input: Stream): string[] {
    const command = [`-i`, video_input.name, `-map`, `0:v:0`];
    return command;
}

function add_audio_input(command: string[], audio_input: Stream): void {
    command.push(`-i`, audio_input.name, `-map`, `1:a:0`);
}

function add_trim(command: string[], trim_settings: TrimSettings): void {
    // https://superuser.com/a/704118
    const fast_skip_start = Math.floor(0.9 * trim_settings.start); // Skip 90% of the start time quickly but approximately,
    const rest_skip_start = trim_settings.start - fast_skip_start; // then seek to the exact start time
    command.unshift(`-ss`, format_ffmpeg_time(fast_skip_start));
    command.push(`-ss`, format_ffmpeg_time(rest_skip_start));
    command.push(`-t`, format_ffmpeg_time(trim_settings.end - trim_settings.start));
}

function add_crop(command: string[], crop_settings: CropSettings): void {
    command.push(`-vf`, `crop=${crop_settings.width}:${crop_settings.height}:${crop_settings.x}:${crop_settings.y}`);
}

function add_video_settings(command: string[], vp8_settings: VP8ExportSettings): void {
    command.push(`-c:v`, `libvpx`, `-crf`, `10`, `-b:v`, vp8_settings.bitrate);
}

function add_audio_settings(command: string[]): void {
    command.push(`-c:a`, `libvorbis`, `-b:a`, `256k`);
}

function finalize_command(command: string[]): void {
    command.push(`output.webm`);
}
