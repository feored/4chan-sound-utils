<script module>
	const BitrateOptionsAsNumbers: Record<Bitrate, number> = {
		'32k': 32 * 1000,
		'64k': 64 * 1000,
		'128k': 128 * 1000,
		'256k': 256 * 1000,
		'512k': 512 * 1000,
		'1M': 1000 * 1000,
		'2M': 2000 * 1000,
		'4M': 4000 * 1000,
		'8M': 8000 * 1000
	};
</script>

<script lang="ts">
	import type { VideoData } from '$lib/components/splitter/splitter.svelte';
	import { type Bitrate, type ExportSettings } from '$lib/ffmpeg/types';
	import byteSize from 'byte-size';
	import { Check, X } from '@lucide/svelte';

	interface RestrictionsProps {
		video_data: VideoData;
		dimensions: { width: number; height: number };
		export_settings: ExportSettings;
		valid: boolean;
	}

	let {
		video_data,
		export_settings,
		dimensions,
		valid = $bindable()
	}: RestrictionsProps = $props();

	$inspect(video_data);

	const MAX_DURATION = 120; // Maximum duration in seconds
	const MAX_WIDTH = 2048; // Maximum width in pixels
	const MAX_HEIGHT = 2048; // Maximum height in pixels
	const MAX_FILESIZE = 4096 * 1024; // Maximum file size in bits (4096 KB)

	let approx_filesize = $derived.by(() => {
		if (!export_settings.settings || !export_settings.settings.bitrate) {
			return 0; // Cannot calculate size without bitrate
		}
		const bitrate = BitrateOptionsAsNumbers[export_settings.settings.bitrate];
		console.log('Bitrate:', bitrate, 'bits/s');
		const duration = (video_data.end_progress - video_data.start_progress) * video_data.duration;
		return (duration * bitrate) / 8; // Approximate size in bytes
	});
</script>

<p>{byteSize(approx_filesize)}</p>
<div class="flash muted">
	<p><b>Restrictions</b></p>
	<ul>
		<li>
			Maximum duration: {MAX_DURATION} seconds
			{#if (video_data.end_progress - video_data.start_progress) * video_data.duration > MAX_DURATION}
				<span class="error">
					<X />
					<span>
						Currently: {(
							(video_data.end_progress - video_data.start_progress) *
							video_data.duration
						).toFixed(2)} seconds
					</span>
				</span>
			{:else}
				<span class="success">
					<Check />
				</span>
			{/if}
		</li>

		<li>
			Maximum height: {MAX_HEIGHT} pixels
			{#if dimensions.height > MAX_HEIGHT}
				<span class="error">
					<X />
					<span>Currently: {dimensions.height} pixels</span>
				</span>
			{:else}
				<span class="success">
					<Check />
				</span>
			{/if}
		</li>
		<li>
			Maximum width: {MAX_WIDTH} pixels
			{#if dimensions.width > MAX_WIDTH}
				<span class="error">
					<X />
					<span>Currently: {dimensions.width} pixels</span>
				</span>
			{:else}
				<span class="success">
					<Check />
				</span>
			{/if}
		</li>
		<li>
			Maximum file size: 4096KB
			{#if approx_filesize > MAX_FILESIZE}
				<span class="error">
					<X />
					<span>Approximate size: {byteSize(approx_filesize)}</span>
				</span>
			{:else}
				<span class="success">
					<Check />
				</span>
			{/if}
		</li>
	</ul>
</div>

<style>
	.error {
		color: var(--danger);
	}

	.success {
		color: var(--success);
	}
	li {
		display: flex;
	}
</style>
