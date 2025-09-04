<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import FfmpegExportSettings from '../ffmpeg_export_settings.svelte';
	import Preview from './preview.svelte';
	import Log from '../log.svelte';
	import byteSize from 'byte-size';

	import type { Stream, ExportSettings } from '$lib/types';

	import { onMount } from 'svelte';

	import { get_url, get_file_name } from '$lib/utils/files';
	import { download_blob } from '$lib/utils/downloads';
	import { merge } from '$lib/ffmpeg/scripts/merge';
	import { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';
	import { MessageManager } from '$lib/utils/message_manager.svelte';
	import { CircleAlert } from '@lucide/svelte';

	let final_video: Blob = $state<Blob>(new Blob()); // Final merged video blob

	const message_manager = new MessageManager();
	const ffmpeg_manager = new FFmpegManager();
	let merge_state: 'ready' | 'loading' | 'finished' = $state('ready'); // State of the merge process
	let current_file: File | null = $state(null);
	let export_settings: ExportSettings = $state({
		output_format: 'mp4',
		settings: {
			preset: 'fast',
			tune: 'none',
			bitrate: 2048
		},
		crop: {
			enabled: false,
			x: 0,
			y: 0,
			width: 0,
			height: 0
		}
	});

	onMount(() => {
		ffmpeg_manager.init();
	});

	$effect(() => {
		if (current_file) {
			// Reset states when a new file is selected
			reset();
		}
	});

	function reset() {
		final_video = new Blob();
		message_manager.reset();
		merge_state = 'ready';
	}

	async function on_merge() {
		if (!current_file) {
			message_manager.error('No file selected for merging.');
			return;
		}
		merge_state = 'loading';
		const sound = await download_sound(current_file.name);
		if (!sound || !sound.blob) {
			message_manager.error('Failed to download sound from file name.');
			return;
		}
		let video: Stream = {
			name: current_file.name,
			blob: current_file
		};
		const ffmpeg = ffmpeg_manager.get_instance();
		if (!ffmpeg) {
			message_manager.error('FFmpeg instance is not available.');
			return;
		}
		try {
			final_video = await merge(ffmpeg, video, sound, export_settings, message_manager);
		} catch (error) {
			message_manager.error(`FFmpeg error: ${error}`);
			return;
		}
		merge_state = 'finished';
	}

	async function download_sound(file_name: string): Promise<Stream | null> {
		const url = get_url(file_name);
		if (!url) {
			message_manager.error('Invalid sound URL.');
			return null;
		}
		try {
			const response = await download_blob(url, (progress: number) => {
				message_manager.log(`Downloading sound... ${progress.toFixed(2)}%`, `download_sound`);
			});
			const sound: Stream = { blob: response, name: `${encodeURIComponent(url)}` };
			return sound;
		} catch (error) {
			message_manager.error(`Failed to download sound: ${error}`);
			return null;
		}
	}
</script>

<Filepicker bind:current_file />
{#if current_file}
	{#if get_url(current_file.name)}
		{#if merge_state === 'ready'}
			<Preview {current_file} />
			<div>
				<FfmpegExportSettings file_name={current_file.name} bind:export_settings />
				<button type="submit" onclick={() => on_merge()}>Merge</button>
			</div>
		{:else}
			<Log {message_manager} {ffmpeg_manager} />

			{#if merge_state === 'finished'}
				<div class="flash bd-accent">
					<p><b>Output</b></p>
					<p><code>Final size: {byteSize(final_video.size, { units: 'iec' })}</code></p>
					<video src={URL.createObjectURL(final_video)} controls />
					<p class="centered">
						<a
							href={URL.createObjectURL(final_video)}
							download="{get_file_name(current_file.name)}.webm"><button>Download</button></a
						>
					</p>
				</div>
			{/if}
		{/if}
	{:else}
		<p class="flash danger icon">
			<CircleAlert /> Cannot find sound URL / invalid sound URL in file
			<code class="bd-danger">{current_file.name}</code>.
		</p>
		<Preview {current_file} />
	{/if}
{:else}
	<div class="flash bg-muted bd-muted">
		<p><b>Instructions</b></p>
		<p>
			Upload a video file containing a [sound=URL] link in the filename.<br />
			Example: <code> video[sound=https://example.com/sound.mp3].webm</code><br /> This tool
			downloads the linked sound file and merges it back into the video file using ffmpeg-wasm,
			entirely client-side<br />
			This is useful for archival in case the file host goes down, or just to view the combined file
			locally.
		</p>
	</div>
{/if}
