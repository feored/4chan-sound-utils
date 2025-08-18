import { FFmpeg } from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { type LogEventCallback, type ProgressEventCallback } from '@ffmpeg/ffmpeg';
import type { get_extension } from '$lib/utils';

export class ffmpeg_manager {
    private ffmpeg_instance: FFmpeg | null = null;
    private ffmpeg_loaded: boolean = false;

    public get_instance(): FFmpeg | null {
        return this.ffmpeg_instance;
    }

    // Check if FFmpeg is loaded
    public is_loaded(): boolean {
        return this.ffmpeg_loaded;
    }

    // Initialize FFmpeg
    public async init(): Promise<void> {
        if (this.ffmpeg_loaded) return;

        try {
            this.ffmpeg_instance = new FFmpeg();
            await this.ffmpeg_instance.load({ coreURL, wasmURL });
            console.log('FFmpeg loaded successfully.');
            this.ffmpeg_loaded = true;
        } catch (error) {
            console.error('Failed to load FFmpeg:', error);
            throw error;
        }
    }

    // Add or remove event listeners
    public manage_listeners(
        listen: boolean,
        log_callback: LogEventCallback,
        progress_callback: ProgressEventCallback
    ): void {
        if (!this.ffmpeg_instance) {
            console.error('FFmpeg is not initialized.');
            return;
        }

        const action: 'on' | 'off' = listen ? 'on' : 'off';
        this.ffmpeg_instance[action]('log', log_callback);
        this.ffmpeg_instance[action]('progress', progress_callback);
    }
}