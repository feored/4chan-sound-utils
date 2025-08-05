import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { get_file_type } from './utils';

export type Stream = {
    name: string;
    blob: Blob;
}

export type mp4ExportSettings = {
    preset: string;
    tune: string;
}

export type webmExportSettings = {
    bitrate: string;
}

export let ffmpeg: FFmpeg;
let ffmpeg_ready: boolean = $state(false);

export function is_ffmpeg_ready(): boolean {
    return ffmpeg_ready;
}

export async function init_ffmpeg() {
    if (ffmpeg_ready) return;
    ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL });
    console.log('FFmpeg loaded successfully.');
    ffmpeg_ready = true;
}


export function get_ffmepg_mp4_parameters(video_input: Stream, audio_input: Stream, settings: mp4ExportSettings): string[] {
    let base_command = ['-i', video_input.name, '-i', audio_input.name];
    if (get_file_type(video_input.name) == 'image') {
        base_command.unshift('-loop', '1', '-r', '1');
        base_command.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2'); // fix images where width or height is odd
        base_command.push('-shortest', '-r', '1');
    }
    base_command.push('-map', '0:v', '-map', '1:a');
    base_command.push('-c:v', 'libx264');
    base_command.push('-preset', settings.preset);
    if (settings.tune !== 'none') {
        base_command.push('-tune', settings.tune);
    }
    base_command.push('-pix_fmt:v', 'yuv420p');
    base_command.push('output.mp4');
    return base_command;
}

export function get_ffmpeg_webm_parameters(video_input: Stream, audio_input: Stream, settings: webmExportSettings): string[] {
    let base_command = ['-i', video_input.name, '-i', audio_input.name,
        '-c:v', 'libvpx', '-b:v', settings.bitrate, '-c:a', 'libvorbis', '-b:a', '256k'];
    base_command.push('output.webm');
    return base_command;

}