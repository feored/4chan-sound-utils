import { fetchFile } from '@ffmpeg/util';
import type { ExportSettings, Stream } from '../../types';
import type { FFmpeg } from '@ffmpeg/ffmpeg';
import { get_ffmpeg_parameters } from '../parameters/parameter_generator';
import type { MessageManager } from '$lib/utils/message_manager.svelte';

export async function merge(ffmpeg: FFmpeg, video: Stream, sound: Stream, export_settings: ExportSettings, message_manager: MessageManager): Promise<Blob> {
    message_manager.log("Merging video and audio...");
    message_manager.log("Writing input files to ffmpeg...");
    await ffmpeg.writeFile(video.name, await fetchFile(video.blob));
    await ffmpeg.writeFile(sound.name, await fetchFile(sound.blob));

    const command = get_ffmpeg_parameters(export_settings, video, sound);
    message_manager.log('ffmpeg ' + command.join(' '));
    await ffmpeg.exec(command);
    message_manager.bump_ffmpeg_process_id();

    message_manager.log("Reading output...");
    const data = await ffmpeg.readFile(`output.${export_settings.output_format}`);
    const data_array = data as Uint8Array;
    return new Blob([data_array], { type: `video/${export_settings.output_format}` });
}
