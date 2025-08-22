export interface ExportSettings {
    output_format: 'mp4' | 'webm' | 'ogg';
    settings?: x264ExportSettings | VP8ExportSettings;
    crop?: CropSettings;
    trim?: TrimSettings;
    remove_audio?: boolean;
}

export type CropSettings = {
    width: number;
    height: number;
    x: number;
    y: number;
}

export type TrimSettings = {
    start: number; // in seconds
    end: number;
}

export type Stream = {
    name: string;
    blob: Blob;
}

export type x264ExportSettings = {
    preset: x264Preset;
    tune: x264Tune;
    bitrate: Bitrate;
}

export type VP8ExportSettings = {
    bitrate: Bitrate;
}
export const x264TuneOptions = ['none', 'film', 'animation', 'stillimage', 'zerolatency'] as const;
export const x264TuneOptionsFormatted = ['None', 'Film', 'Animation', 'Still Image', 'Zero Latency'] as const;
export type x264Tune = typeof x264TuneOptions[number];

export const x264PresetOptions = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'] as const;
export const x264PresetOptionsFormatted = ['Ultra Fast', 'Super Fast', 'Very Fast', 'Faster', 'Fast', 'Medium', 'Slow', 'Slower', 'Very Slow'] as const;
export type x264Preset = typeof x264PresetOptions[number];

export const BitrateOptions = ['32k', '64k', '128k', '256k', '512k', '1M', '2M', '4M', '8M'] as const;
export const BitrateOptionsFormatted = ['32  Kb/s', '64  Kb/s', '128 Kb/s', '256 Kb/s', '512 Kb/s', '1 Mb/s', '2 Mb/s', '4 Mb/s', '8 Mb/s'] as const;
export type Bitrate = typeof BitrateOptions[number];

export type OutputFormat = 'mp4' | 'webm';