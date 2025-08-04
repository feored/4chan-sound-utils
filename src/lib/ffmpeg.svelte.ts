import { FFmpeg } from '@ffmpeg/ffmpeg';

export let ffmpeg: FFmpeg;
let ffmpeg_ready: boolean = $state(false);

export function is_ffmpeg_ready(): boolean {
    return ffmpeg_ready;
}

export async function init_ffmpeg(multithreaded: boolean = false) {
    if (ffmpeg_ready) return;
    ffmpeg = new FFmpeg();
    const version = multithreaded ? 'ffmpeg-mt' : 'ffmpeg';
    console.log(`Loading FFmpeg ${version}...`);
    await ffmpeg.load({
        coreURL: `http://localhost:5173/${version}/ffmpeg-core.js`,
        wasmURL: `http://localhost:5173/${version}/ffmpeg-core.wasm`
    });
    console.log('FFmpeg loaded successfully.');
    ffmpeg_ready = true;
}
