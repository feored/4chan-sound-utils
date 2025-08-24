<script lang="ts">
	import type { ExportSettings, VideoData } from '$lib/types';
	import byteSize from 'byte-size';
	import { X } from '@lucide/svelte';

	interface RestrictionsProps {
		video_data: VideoData;
		export_settings: ExportSettings;
	}

	let { video_data, export_settings }: RestrictionsProps = $props();

	const MAX_DURATION = 120; // Maximum duration in seconds
	const MAX_FILESIZE = 4096 * 1024; // Maximum file size in bytes (4096 KB)

	let approx_filesize = $derived.by(() => {
		if (!export_settings.settings || !export_settings.settings.bitrate) {
			return 0; // Cannot calculate size without bitrate
		}
		const bitrate = export_settings.settings.bitrate;
		const duration = (video_data.end_progress - video_data.start_progress) * video_data.duration;
		return (duration * bitrate * 1000) / 8; // Approximate size in KB
	});
</script>

{#if (video_data.end_progress - video_data.start_progress) * video_data.duration > MAX_DURATION}
	<div class="flash danger">
		<p>
			<X style="vertical-align:text-bottom;" /> Duration too long: Current: {(
				(video_data.end_progress - video_data.start_progress) *
				video_data.duration
			).toFixed(2)} seconds, Limit: {MAX_DURATION} seconds
		</p>
	</div>
{/if}

{#if approx_filesize > MAX_FILESIZE}
	<div class="flash danger">
		<p>
			<X style="vertical-align:text-bottom;" />
			Estimated file size too large:
			<code>{byteSize(approx_filesize)}/{byteSize(MAX_FILESIZE)}</code>. Reduce either duration or
			bitrate.
		</p>
	</div>
{/if}
