<script lang="ts">
	import type { VideoData } from '$lib/components/splitter/splitter.svelte';
	import { type ExportSettings } from '$lib/ffmpeg/types';
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
	const MAX_FILESIZE = 4096 * 1024; // Maximum file size in bytes (4096 KB)

	let approx_filesize = $derived.by(() => {
		if (!export_settings.settings || !export_settings.settings.bitrate) {
			return 0; // Cannot calculate size without bitrate
		}
		const bitrate = export_settings.settings.bitrate;
		console.log('Bitrate:', bitrate, 'Kbits/s');
		const duration = (video_data.end_progress - video_data.start_progress) * video_data.duration;
		return (duration * bitrate * 1000) / 8; // Approximate size in KB
	});

	$effect(() => {
		valid =
			(video_data.end_progress - video_data.start_progress) * video_data.duration <= MAX_DURATION &&
			dimensions.height <= MAX_HEIGHT &&
			dimensions.width <= MAX_WIDTH &&
			approx_filesize <= MAX_FILESIZE;
	});
</script>

<details>
	<summary class:danger={!valid}>{valid ? 'Valid Settings' : 'Invalid Settings'}</summary>
	<table>
		<thead>
			<tr>
				<th>Restriction</th>
				<th style="width:50%">Current</th>
				<th>Limit</th>
				<th>Status</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Maximum duration</td>
				<td>
					{((video_data.end_progress - video_data.start_progress) * video_data.duration).toFixed(2)}
					seconds
				</td>
				<td>{MAX_DURATION} seconds</td>
				<td>
					{#if (video_data.end_progress - video_data.start_progress) * video_data.duration > MAX_DURATION}
						<span class="valid">
							<X />
						</span>
					{:else}
						<span class="invalid">
							<Check />
						</span>
					{/if}
				</td>
			</tr>
			<tr>
				<td>Maximum height</td>
				<td>{dimensions.height}px</td>
				<td>{MAX_HEIGHT}px</td>
				<td>
					{#if dimensions.height > MAX_HEIGHT}
						<span class="valid">
							<X />
						</span>
					{:else}
						<span class="invalid">
							<Check />
						</span>
					{/if}
				</td>
			</tr>
			<tr>
				<td>Maximum width</td>
				<td>{dimensions.width}px</td>
				<td>{MAX_WIDTH}px</td>
				<td>
					{#if dimensions.width > MAX_WIDTH}
						<span class="valid">
							<X />
						</span>
					{:else}
						<span class="invalid">
							<Check />
						</span>
					{/if}
				</td>
			</tr>
			<tr>
				<td>Maximum file size</td>
				<td>{byteSize(approx_filesize)} (Estimated)</td>
				<td>{byteSize(MAX_FILESIZE)}</td>
				<td>
					{#if approx_filesize > MAX_FILESIZE}
						<span class="valid">
							<X />
						</span>
					{:else}
						<span class="invalid">
							<Check />
						</span>
					{/if}
				</td>
			</tr>
		</tbody>
	</table>
</details>

<style>
	.valid {
		color: var(--danger);
		display: flex;
		align-items: center;
	}

	table {
		width: 100%;
		display: table;
	}

	.invalid {
		color: var(--success);
		display: flex;
		align-items: center;
	}

	th {
		text-align: left;
	}

	th,
	td {
		font-family: var(--ft-mono);
	}
</style>
