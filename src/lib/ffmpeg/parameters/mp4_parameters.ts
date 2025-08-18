import type { Stream, x264ExportSettings } from '../types';
import { is_image } from '$lib/utils';

export function get_mp4_parameters(
    video_input: Stream,
    audio_input: Stream,
    settings: x264ExportSettings
): string[] {
    const baseCommand = ['-i', video_input.name, '-i', audio_input.name];

    if (is_image(video_input.name)) {
        baseCommand.unshift('-loop', '1', '-r', '1');
        baseCommand.push(
            '-vf',
            'pad=ceil(iw/2)*2:ceil(ih/2)*2', // Fix odd dimensions
            '-shortest',
            '-r',
            '1'
        );
    }

    baseCommand.push(
        '-map',
        '0:v',
        '-map',
        '1:a',
        '-c:v',
        'libx264',
        '-preset',
        settings.preset
    );

    if (settings.tune !== 'none') {
        console.log('Using tune:', settings.tune);
        baseCommand.push('-tune', settings.tune);
    }

    baseCommand.push('-pix_fmt:v', 'yuv420p', 'output.mp4');
    return baseCommand;
}