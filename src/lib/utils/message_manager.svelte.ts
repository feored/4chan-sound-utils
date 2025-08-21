import type { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';
import { type LogEvent, type ProgressEvent } from '@ffmpeg/ffmpeg';

export type Message = {
    message: string;
    error: boolean;
};

export class MessageManager {

    private ids: string[] = [];
    private ffmpeg_process_id: number = 0;
    public messages: Record<string, Message> = $state({});


    public log(id: string, message: string): void {
        this.add_message(id, { message: message, error: false });
    }

    public error(id: string, message: string): void {
        this.add_message(id, { message: `Error: ${message}`, error: true });
    }

    private add_message(id: string, message: Message) {
        if (!this.ids.includes(id)) {
            this.ids.push(id);
        }
        this.messages = { ...this.messages, [id]: message };
        if (message.error) {
            console.error(`${message.message} (${id})`);
        } else {
            console.log(`${message.message} (${id})`);
        }
    }


    public reset(): void {
        this.ids = [];
        this.messages = {};
        this.ffmpeg_process_id = 0;
    }

    public bump_ffmpeg_process_id(): void {
        this.ffmpeg_process_id += 1;
    }

    private listen_ffmpeg_message = (event: LogEvent) => {
        let formatted_message = `FFmpeg [${event.type}]: ${event.message}`;
        this.log(`ffmpeg_message_${this.ffmpeg_process_id}`, formatted_message);
    }
    private listen_ffmpeg_progress = (event: ProgressEvent) => {
        const progress = event.progress * 100; // Convert to percentage
        this.log(
            `ffmpeg_progress_${this.ffmpeg_process_id}`,
            `FFmpeg [progress]: ${progress.toFixed(2)}%`
        );
    }

    public toggle_ffmpeg_listen(listen: boolean, ffmpeg_manager: FFmpegManager) {
        ffmpeg_manager.manage_listeners(
            listen,
            this.listen_ffmpeg_message,
            this.listen_ffmpeg_progress
        );
    }
}
