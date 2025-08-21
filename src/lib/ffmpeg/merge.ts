import { fetchFile } from '@ffmpeg/util';
import type { ExportSettings, Stream } from './types';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

export async function merge(ffmpeg: FFmpeg, video: Stream, sound: Stream, command: string[], export_settings: ExportSettings): Promise<Blob> {
    await ffmpeg.writeFile(video.name, await fetchFile(video.blob));
    await ffmpeg.writeFile(sound.name, await fetchFile(sound.blob));
    await ffmpeg.exec(command);
    const data = await ffmpeg.readFile(`output.${export_settings.output_format}`);

    const data_array = data as Uint8Array;
    return new Blob([data_array], { type: `video/${export_settings.output_format}` });
}
