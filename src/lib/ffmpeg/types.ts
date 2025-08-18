export type ExportSettings = {
    output_format: 'mp4' | 'webm';
    settings: x264ExportSettings | VP8ExportSettings;
}

export type Stream = {
    name: string;
    blob: Blob;
}

export type x264ExportSettings = {
    preset: x264Preset;
    tune: x264Tune;
}

export type VP8ExportSettings = {
    bitrate: VP8Bitrate;
}
export const x264TuneOptions = ['none', 'film', 'animation', 'stillimage', 'zerolatency'] as const;
export type x264Tune = typeof x264TuneOptions[number];

export const x264PresetOptions = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'] as const;
export type x264Preset = typeof x264PresetOptions[number];

export const vp8BitrateOptions = ['256k', '512k', '1M', '2M', '4M', '8M'] as const;
export type VP8Bitrate = typeof vp8BitrateOptions[number];

export type OutputFormat = 'mp4' | 'webm';