import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { get_file_type } from '../utils';
import type { ExportSettings, Stream, x264ExportSettings, VP8ExportSettings } from './ffmpeg_types';
import { type LogEventCallback, type ProgressEventCallback } from '@ffmpeg/ffmpeg';

export let ffmpeg: FFmpeg;
let ffmpeg_loaded: boolean = $state(false);
let ffmpeg_busy: boolean = $state(false);

export function is_ffmpeg_loaded(): boolean {
    return ffmpeg_loaded;
}

export function set_ffmpeg_busy(busy: boolean) {
    ffmpeg_busy = busy;
}

export function is_ffmpeg_busy(): boolean {
    return ffmpeg_busy;
}

export async function init_ffmpeg() {
    if (ffmpeg_loaded) return;
    ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL });
    console.log('FFmpeg loaded successfully.');
    ffmpeg_loaded = true;
}


export function get_ffmepg_mp4_parameters(video_input: Stream, audio_input: Stream, settings: x264ExportSettings): string[] {
    let base_command = ['-i', `"${video_input.name}"`, '-i', `"${audio_input.name}"`];
    if (get_file_type(video_input.name) == 'image') {
        base_command.unshift('-loop', '1', '-r', '1');
        base_command.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2'); // fix images where width or height is odd
        base_command.push('-shortest', '-r', '1');
    }
    base_command.push('-map', '0:v', '-map', '1:a');
    base_command.push('-c:v', 'libx264');
    base_command.push('-preset', settings.preset);
    if (settings.tune !== 'none') {
        console.log('Using tune:', settings.tune);
        base_command.push('-tune', settings.tune);
    }
    base_command.push('-pix_fmt:v', 'yuv420p');
    base_command.push('output.mp4');
    return base_command;
}

export function get_ffmpeg_webm_parameters(video_input: Stream, audio_input: Stream, settings: VP8ExportSettings): string[] {
    let base_command = ['-i', `"${video_input.name}"`, '-i', `"${audio_input.name}"`,
        '-c:v', 'libvpx', '-b:v', settings.bitrate, '-c:a', 'libvorbis', '-b:a', '256k'];
    base_command.push('output.webm');
    return base_command;
}

export function get_ffmpeg_parameters(video_input: Stream, audio_input: Stream, settings: ExportSettings): string[] {
    if (settings.output_format === 'mp4') {
        return get_ffmepg_mp4_parameters(video_input, audio_input, settings.settings as x264ExportSettings);
    } else if (settings.output_format === 'webm') {
        return get_ffmpeg_webm_parameters(video_input, audio_input, settings.settings as VP8ExportSettings);
    } else {
        throw new Error(`Unsupported output format: ${settings.output_format}`);
    }
}

export function listen(listen: boolean, log_func: LogEventCallback, progress_func: ProgressEventCallback) {
    // add or remove ffmpeg listeners based on the action parameter
    let action: 'on' | 'off' = listen ? 'on' : 'off';
    ffmpeg[action]('log', log_func);
    ffmpeg[action]('progress', progress_func);
}
