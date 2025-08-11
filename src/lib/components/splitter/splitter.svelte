<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import Seekbar from '$lib/components/splitter/seekbar.svelte';
	import { type Stream } from '$lib/ffmpeg/ffmpeg_types';
	import { ffmpeg, set_ffmpeg_busy, is_ffmpeg_busy, listen } from '$lib/ffmpeg/ffmpeg.svelte';
	import { fetchFile } from '@ffmpeg/util';
	import { toast } from '@zerodevx/svelte-toast';

	let current_file: File | null = $state(null);
	let video_progress = $state(0);
	let vid: HTMLVideoElement | null = null;

	$effect(() => {
		if (vid) {
			vid.currentTime = video_progress * vid.duration;
		}
	});
	async function get_sound_extension(stream: Stream): Promise<string | null> {
		set_ffmpeg_busy(true);
		await ffmpeg.writeFile(stream.name, await fetchFile(stream.blob));
		let command = `-loglevel error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 ${stream.name} -o output.txt`;
		await ffmpeg.ffprobe(command.split(' '));
		const data = await ffmpeg.readFile('output.txt');
		set_ffmpeg_busy(false);
		if (!data) {
			toast.push('Failed to get sound extension.');
			return null;
		}
		const data_array = data as Uint8Array;
		const utf8_decoder = new TextDecoder(); // utf8 is the default
		return utf8_decoder.decode(data_array).trim();
	}

	async function upload_file(): Promise<string | null> {
		// Placeholder for file upload logic
		// This should return the URL of the uploaded file
		if (!current_file) {
			toast.push('No file selected for upload.');
			return null;
		}
		const form_data = new FormData();
		form_data.append('reqtype', 'fileupload');
		form_data.append('fileToUpload', current_file);
		console.log('Uploading file:', current_file.name);

		try {
			const response = await fetch('https://catbox.moe/user/api.php', {
				method: 'POST',
				// Set the FormData instance as the request body
				body: form_data
			});
			let resp = await response.text();
			console.log('Upload response:', resp);
			return resp;
		} catch (e) {
			console.error(e);
			return null;
		}
	}

	async function split() {
		if (!current_file) {
			toast.push('No file selected.');
			return;
		}
		let extension = await get_sound_extension({ name: current_file.name, blob: current_file });
		console.log('Sound extension:', extension);
	}
</script>

<article>
	<header>
		<h3>Splitter (WebM Maker)</h3>
		<small>
			Splits the audio from a video file and uploads it to one of the approved hosts, then removes
			the audio from the video file.
		</small>
	</header>
	<Filepicker bind:current_file accept_image={false} show_preview={false} />

	{#if current_file}
		<Seekbar bind:progress={video_progress} />
		<video bind:this={vid} controls src={URL.createObjectURL(current_file)}>
			Your browser does not support the video tag.
		</video>
		{#if is_ffmpeg_busy()}
			<p>FFmpeg is busy processing another task.</p>
		{:else}
			<button
				onclick={() => {
					split();
				}}>Split</button
			>
			<button onclick={() => upload_file()}> Upload</button>
		{/if}
	{/if}
</article>

<style>
	video {
		width: 100%;
		height: auto;
		max-height: 75vh;
	}
</style>
