import type { Stream, x264ExportSettings, ExportSettings } from '../types';
import { is_image } from '$lib/utils/files';

export function get_mp4_parameters(
    settings: ExportSettings,
    video_input: Stream,
    audio_input?: Stream,

): string[] {
    const x264_settings = settings.settings as x264ExportSettings;
    const base_command = create_base_command(video_input, audio_input);
    if (is_image(video_input.name)) {
        handle_image_input(base_command);
    }
    add_video_settings(base_command, x264_settings);
    finalize_command(base_command);

    return base_command;
}

function create_base_command(video_input: Stream, audio_input?: Stream): string[] {
    const base_command: string[] = ['-i', video_input.name];
    if (audio_input) {
        base_command.push('-i', audio_input.name);
        base_command.push('-map', '1:a:0');
    }
    base_command.push('-map', '0:v:0');
    return base_command;
}

function handle_image_input(command: string[]): void {
    command.unshift('-loop', '1', '-r', '1');
    command.push(
        '-vf',
        'pad=ceil(iw/2)*2:ceil(ih/2)*2', // Fix odd dimensions
        '-shortest',
        '-r',
        '1'
    );
}

function add_video_settings(command: string[], x264_settings: x264ExportSettings): void {
    command.push(
        '-c:v',
        'libx264',
        '-preset',
        x264_settings.preset
    );
    if (x264_settings.tune !== 'none') {
        command.push('-tune', x264_settings.tune);
    }
    if (x264_settings.bitrate) {
        command.push('-b:v', `${x264_settings.bitrate}k`);
    }
}

function finalize_command(command: string[]): void {
    command.push('-pix_fmt:v', 'yuv420p', 'output.mp4');
}