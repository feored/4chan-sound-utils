import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';

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
