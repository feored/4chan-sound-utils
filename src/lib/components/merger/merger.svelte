<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import FfmpegExportSettings from './ffmpeg_export_settings.svelte';
	import Preview from './preview.svelte';
	import Log from '../log.svelte';
	import { dialog_open } from '$lib/components/dialog.svelte';
	import byteSize from 'byte-size';

	import type { Stream, ExportSettings } from '$lib/ffmpeg/types';

	import { onMount } from 'svelte';

	import { get_url, get_file_name } from '$lib/utils/files';
	import { download_blob } from '$lib/utils/downloads';
	import { get_ffmpeg_parameters } from '$lib/ffmpeg/parameters/parameter_generator';
	import { merge } from '$lib/ffmpeg/merge';
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
			tune: 'none'
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
	}

	async function on_merge() {
		if (!current_file) {
			dialog_open('No File Selected', 'Please select a file to merge.', reset);
			return;
		}
		merge_state = 'loading';
		const sound = await download_sound(current_file.name);
		if (!sound || !sound.blob) {
			message_manager.log('error', 'Failed to download sound from file name.');
			return;
		}
		message_manager.log('launch', 'Launching ffmpeg...');
		let video: Stream = {
			name: current_file.name,
			blob: current_file
		};
		const ffmpeg = ffmpeg_manager.get_instance();
		if (!ffmpeg) {
			message_manager.log('error', 'FFmpeg instance is not available.');
			return;
		}
		const command = get_ffmpeg_parameters(video, sound, export_settings);
		message_manager.log('ffmpeg_run', 'ffmpeg ' + command.join(' '));
		try {
			final_video = await merge(ffmpeg, video, sound, command, export_settings);
		} catch (error) {
			message_manager.log('error', `FFmpeg error: ${error}`);
			return;
		}
		merge_state = 'finished';
	}

	async function download_sound(file_name: string): Promise<Stream | null> {
		const url = get_url(file_name);
		if (!url) {
			message_manager.log('error', 'Invalid sound URL.');
			return null;
		}
		try {
			const response = await download_blob(url, (progress: number) => {
				message_manager.log('download', `Downloading sound... ${progress.toFixed(2)}%`);
			});
			const sound: Stream = { blob: response, name: `${encodeURIComponent(url)}` };
			return sound;
		} catch (error) {
			message_manager.log('error', `Failed to download sound: ${error}`);
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
				<button onclick={() => on_merge()}>Merge</button>
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
			<CircleAlert /> Cannot find sound URL / invalid sound URL in file `{current_file.name}`.
		</p>
		<Preview {current_file} />
	{/if}
{:else}
	<div class="flash bg-muted bd-muted">
		<p><b>Instructions</b></p>
		<p>
			Upload a .webm file containing a [sound=URL] link in the filename.<br />
			Example: <code> video[sound=https://example.com/sound.mp3].webm</code><br /> This tool
			downloads the linked sound file and merges it back into the video file for easy viewing.<br
			/>This is also useful for archival in case the file hosts go down.
		</p>
	</div>
{/if}
