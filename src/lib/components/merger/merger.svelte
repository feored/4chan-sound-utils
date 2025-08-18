<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import FfmpegExportSettings from './ffmpeg_export_settings.svelte';
	import Preview from './preview.svelte';
	import MessageViewer from '../message_viewer.svelte';
	import byteSize from 'byte-size';
	import { get_ffmpeg_parameters } from '$lib/ffmpeg/parameters/parameter_generator';
	import type { Stream, ExportSettings } from '$lib/ffmpeg/types';
	import { get_url, get_file_name, is_image } from '$lib/utils/files';
	import { download_blob } from '$lib/utils/downloads';
	import { toast } from '@zerodevx/svelte-toast';
	import { fetchFile } from '@ffmpeg/util';
	import { onMount } from 'svelte';
	import { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';
	import { CircleAlert } from '@lucide/svelte';
	import { MessageManager } from '$lib/utils/message_manager.svelte';

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
		merge_state = 'ready';
	}

	async function merge() {
		if (!current_file) {
			toast.push('No file selected.');
			reset();
			return;
		}
		merge_state = 'loading';
		const sound = await download_sound(current_file.name);
		if (!sound || !sound.blob) {
			toast.push('Failed to extract sound from file.');
			reset();
			return;
		}
		message_manager.add('launch', 'Launching ffmpeg...');
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
		merge_state = 'finished';
	}

	async function ffmpeg_merge(video: Stream, sound: Stream) {
		const ffmpeg = ffmpeg_manager.get_instance();
		if (!ffmpeg) {
			return;
		}
		await ffmpeg.writeFile(video.name, await fetchFile(video.blob));
		await ffmpeg.writeFile(sound.name, await fetchFile(sound.blob));
		let command = get_ffmpeg_parameters(video, sound, export_settings);
		message_manager.add('ffmpeg_run', 'ffmpeg ' + command.join(' '));
		await ffmpeg.exec(command);
		const data = await ffmpeg.readFile(`output.${export_settings.output_format}`);

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
			const response = await download_blob(url, (progress: number) => {
				message_manager.add('download', `Downloading sound... ${progress.toFixed(2)}%`);
			});
			const sound: Stream = { blob: response, name: `${encodeURIComponent(url)}` };
			return sound;
		} catch (error) {
			console.error('Error downloading sound:', error);
			toast.push(`Error downloading sound: ${error}`);
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
				<FfmpegExportSettings is_image={is_image(current_file.name)} bind:export_settings />
				<button onclick={() => merge()}>Merge</button>
			</div>
		{:else}
			<MessageViewer {message_manager} {ffmpeg_manager} />

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
			<CircleAlert /> Cannot find sound URL in file `{current_file.name}`.
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
