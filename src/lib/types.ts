export interface VideoData {
    progress: number;
    current_time: number;
    duration: number;
    start_progress: number;
    end_progress: number;
}

export interface ExportSettings {
    output_format: 'mp4' | 'webm' | 'ogg';
    settings?: x264ExportSettings | VP8ExportSettings;
    crop: CropSettings;
    trim?: TrimSettings;
    remove_audio?: boolean;
    scale_down?: boolean
}

export type ScaleSettings = {
    width: number; // in pixels
    height: number; // in pixels
    force?: boolean; // If true, will force the output to the specified dimensions, potentially changing the aspect ratio
}
export type CropSettings = {
    enabled: boolean; // If true, cropping will be applied
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
    bitrate: number; // Always in kbits per second
}

export type VP8ExportSettings = {
    bitrate: number; // Always in kbits per second
}
export const x264TuneOptions = ['none', 'film', 'animation', 'stillimage', 'zerolatency'] as const;
export const x264TuneOptionsFormatted = ['None', 'Film', 'Animation', 'Still Image', 'Zero Latency'] as const;
export type x264Tune = typeof x264TuneOptions[number];

export const x264PresetOptions = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'] as const;
export const x264PresetOptionsFormatted = ['Ultra Fast', 'Super Fast', 'Very Fast', 'Faster', 'Fast', 'Medium', 'Slow', 'Slower', 'Very Slow'] as const;
export type x264Preset = typeof x264PresetOptions[number];

export type OutputFormat = 'mp4' | 'webm';