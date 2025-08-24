import type { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';
import { type LogEvent, type ProgressEvent } from '@ffmpeg/ffmpeg';

export type Message = {
    message: string;
    error: boolean;
};

export class MessageManager {

    /*
        Used to keep track of logs coming from ffmpeg, etc.
        A glorified dictionary but the id array helps to keep track of the order of messages.
        Messages that update (like progress) must use the same id to overwrite the previous message.
    */

    private current_id: number = 0;
    private ids: string[] = [];
    private ffmpeg_process_id: number = 0;
    public messages: Record<string, Message> = $state({});

    public log(message: string, id?: string): void {
        this.add_message({ message: message, error: false }, id);
    }

    public error(message: string, id?: string): void {
        this.add_message({ message: `Error: ${message}`, error: true }, id);
    }

    private add_message(message: Message, id?: string) {
        if (!id) {
            id = `message_${this.current_id}`;
            this.current_id += 1;
        }
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
        this.current_id = 0;
        this.ids = [];
        this.messages = {};
        this.ffmpeg_process_id = 0;
    }

    public bump_ffmpeg_process_id(): void {
        this.ffmpeg_process_id += 1;
    }

    private listen_ffmpeg_message = (event: LogEvent) => {
        let formatted_message = `FFmpeg [${event.type}]: ${event.message}`;
        this.log(formatted_message, `ffmpeg_message_${this.ffmpeg_process_id}`);
    }
    private listen_ffmpeg_progress = (event: ProgressEvent) => {
        const progress = event.progress * 100; // Convert to percentage
        this.log(
            `FFmpeg [progress]: ${progress.toFixed(2)}%`,
            `ffmpeg_progress_${this.ffmpeg_process_id}`
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
