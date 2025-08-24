export function format_ffmpeg_time(seconds: number, show_hours = true): string {
    const hours = Math.floor(seconds / 3600).toString()
        .padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString()
        .padStart(2, '0');
    const secs = Math.floor(seconds % 60).toString()
        .padStart(2, '0');
    const milliseconds = Math.floor((seconds % 1) * 1000).toString()
        .padStart(3, '0');

    const formatted_time = `${minutes}:${secs}.${milliseconds}`;
    if (!show_hours) {
        return formatted_time;
    }
    return `${hours}:${formatted_time}`;
}

export function approximately_equal(a: number, b: number, epsilon = 0.0001): boolean {
    return Math.abs(a - b) < epsilon;
}

