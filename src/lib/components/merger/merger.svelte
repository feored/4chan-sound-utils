<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import FfmpegExportSettings from './ffmpeg_export_settings.svelte';
	import byteSize from 'byte-size';
	import { get_ffmpeg_parameters } from '$lib/ffmpeg/parameters/parameter_generator';
	import { ffmpeg, set_ffmpeg_busy, is_ffmpeg_busy, listen } from '$lib/ffmpeg/ffmpeg.svelte';
	import type { Stream, ExportSettings } from '$lib/ffmpeg/types';
	import { get_url, get_file_name } from '$lib/utils';
	import { toast } from '@zerodevx/svelte-toast';
	import { fetchFile } from '@ffmpeg/util';
	import { type LogEvent, type ProgressEvent } from '@ffmpeg/ffmpeg';

	let final_video: Blob = $state<Blob>(new Blob()); // Final merged video blob

	let loading_message = $state('');
	let ffmpeg_message = $state('');
	let merge_state: 'ready' | 'loading' | 'finished' = $state('ready'); // State of the merge process
	let current_file: File | null = $state(null);
	let export_settings: ExportSettings = $state({
		output_format: 'mp4',
		settings: {
			preset: 'fast',
			tune: 'none'
		}
	});

	$effect(() => {
		if (current_file) {
			// Reset states when a new file is selected
			final_video = new Blob();
			merge_state = 'ready';
			loading_message = '';
			ffmpeg_message = '';
		}
	});

	function listen_ffmpeg_message(event: LogEvent) {
		let formatted_message = `[${event.type}]: ${event.message}`;
		console.log(formatted_message);
		ffmpeg_message = formatted_message;
	}

	function listen_ffmpeg_progress(event: ProgressEvent) {
		const progress = event.progress * 100; // Convert to percentage
		loading_message = `Merging files... ${progress.toFixed(2)}%`;
	}

	function reset() {
		final_video = new Blob();
		loading_message = '';
		ffmpeg_message = '';
		merge_state = 'ready';
		current_file = null;
		listen(false, listen_ffmpeg_message, listen_ffmpeg_progress);
	}

	async function merge() {
		if (!current_file) {
			toast.push('No file selected.');
			reset();
			return;
		}
		merge_state = 'loading';
		listen(true, listen_ffmpeg_message, listen_ffmpeg_progress);
		loading_message = 'Downloading sound...';
		const sound = await download_sound(current_file.name);
		if (!sound || !sound.blob) {
			toast.push('Failed to extract sound from file.');
			reset();
			return;
		}
		loading_message = 'Launching ffmpeg...';
		let video: Stream = {
			name: current_file.name,
			blob: current_file
		};
		try {
			await ffmpeg_merge(video, sound);
		} catch (error) {
			toast.push(`FFmpeg error: ${error}`);
			reset();
			return;
		}
		toast.push('FFmpeg finished.');
		listen(false, listen_ffmpeg_message, listen_ffmpeg_progress);
		merge_state = 'finished';
	}

	async function ffmpeg_merge(video: Stream, sound: Stream) {
		set_ffmpeg_busy(true);
		await ffmpeg.writeFile(video.name, await fetchFile(video.blob));
		await ffmpeg.writeFile(sound.name, await fetchFile(sound.blob));
		let command = get_ffmpeg_parameters(video, sound, export_settings);
		console.log('Running ffmpeg command:', 'ffmpeg ' + command.join(' '));
		await ffmpeg.exec(command);
		const data = await ffmpeg.readFile(`output.${export_settings.output_format}`);
		set_ffmpeg_busy(false);

		const data_array = data as Uint8Array;
		final_video = new Blob([data_array], { type: `video/${export_settings.output_format}` });
	}

	async function download_sound(file_name: string): Promise<Stream | null> {
		const url = get_url(file_name);
		if (!url) {
			toast.push('Invalid sound URL.');
			return null;
		}
		try {
			console.log('Downloading sound from URL:', url);
			const response = await fetch(url);
			if (!response.ok) {
				toast.push('Failed to download sound.');
				return null;
			}
			const blob = await response.blob();
			if (!blob) {
				toast.push('No sound data received.');
				return null;
			}
			return { blob, name: `${get_file_name(file_name)}.webm` };
		} catch (error) {
			console.error('Error downloading sound:', error);
			toast.push(`Error downloading sound: ${error}`);
			return null;
		}
	}
</script>

<article>
	<header>
		<h3>Merger</h3>
		<small>
			Downloads the linked sound file and merges it back into the video (or image). Useful for
			archiving.
		</small>
	</header>
	<Filepicker bind:current_file />
	{#if current_file}
		<br />
		{#if merge_state === 'ready'}
			<FfmpegExportSettings bind:export_settings />
			{#if is_ffmpeg_busy()}
				<p>FFmpeg is busy. Please wait...</p>
			{:else}
				<button onclick={() => merge()}>Merge</button>
			{/if}
		{:else if merge_state === 'loading'}
			<article>
				<p>{loading_message} <span class="loader"></span></p>
				<code>{ffmpeg_message}</code>
			</article>
		{:else if merge_state === 'finished'}
			<div>
				<p>Final size: {byteSize(final_video.size, { units: 'iec' })}</p>
				<video src={URL.createObjectURL(final_video)} controls />
				<p>
					<a
						href={URL.createObjectURL(final_video)}
						download="{get_file_name(current_file.name)}.webm"><button>Download</button></a
					>
				</p>
			</div>
		{/if}
	{/if}
</article>

<style>
	.loader {
		width: 24px;
		height: 24px;
		border: 2px solid #fff;
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	video {
		max-width: 50%;
	}
</style>
