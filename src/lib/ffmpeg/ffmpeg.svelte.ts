import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
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

export function listen(listen: boolean, log_func: LogEventCallback, progress_func: ProgressEventCallback) {
    // add or remove ffmpeg listeners based on the action parameter
    let action: 'on' | 'off' = listen ? 'on' : 'off';
    ffmpeg[action]('log', log_func);
    ffmpeg[action]('progress', progress_func);
}
