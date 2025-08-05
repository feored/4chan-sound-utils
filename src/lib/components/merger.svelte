<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import byteSize from 'byte-size';
	import {
		ffmpeg,
		type Stream,
		get_ffmepg_mp4_parameters,
		get_ffmpeg_webm_parameters,
		type mp4ExportSettings,
		type webmExportSettings
	} from '$lib/ffmpeg.svelte';
	import { onMount } from 'svelte';
	import { get_url, get_file_type, get_extension, get_file_name } from '$lib/utils';
	import { toast } from '@zerodevx/svelte-toast';
	import { fetchFile } from '@ffmpeg/util';

	let mp4_preset: 'veryslow' | 'slow' | 'medium' | 'fast' | 'veryfast' | 'ultrafast' =
		$state('fast'); // Default preset for ffmpeg
	let mp4_tune: 'none' | 'film' | 'animation' | 'stillimage' = $state('none'); // Default tune for ffmpeg

	let webm_bitrate: string = $state('1M'); // Default bitrate for webm encoding
	let output_format: 'webm' | 'mp4' = $state('mp4'); // Default output format

	let final_video: Blob = $state<Blob>(new Blob()); // Final merged video blob

	let loading_message = $state('');
	let is_loading = $state(false);
	let is_finished = $state(false);
	let current_file: File | null = $state(null);

	onMount(() => {
		ffmpeg.on('log', ({ message }) => {
			console.log(message);
		});
		ffmpeg.on('progress', ({ progress, time }) => {
			loading_message = 'Merging files... ' + (progress * 100).toFixed(2) + '%';
		});
	});

	$effect(() => {
		if (current_file) {
			// Reset states when a new file is selected
			final_video = new Blob();
			is_loading = false;
			is_finished = false;
			if (get_file_type(current_file.name) === 'image') {
				mp4_tune = 'stillimage'; // Set default tune for images
			} else {
				mp4_tune = 'none'; // Reset tune for videos
			}
		}
	});

	async function merge() {
		if (!current_file) {
			toast.push('No file selected.');
			return;
		}
		is_loading = true;
		loading_message = 'Downloading sound...';
		const sound = await download_sound(current_file.name);
		if (!sound || !sound.blob) {
			toast.push('Failed to extract sound from file.');
			is_loading = false;
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
			is_loading = false;
			return;
		}
		toast.push('FFmpeg finished.');
		is_loading = false;
		is_finished = true;
	}

	async function ffmpeg_merge(video: Stream, sound: Stream) {
		await ffmpeg.writeFile(video.name, await fetchFile(video.blob));
		await ffmpeg.writeFile(sound.name, await fetchFile(sound.blob));
		let base_command = [];
		if (output_format === 'webm') {
			let webm_settings: webmExportSettings = {
				bitrate: webm_bitrate
			};
			base_command = get_ffmpeg_webm_parameters(video, sound, webm_settings);
		} else {
			let mp4_settings: mp4ExportSettings = {
				preset: mp4_preset,
				tune: mp4_tune
			};
			base_command = get_ffmepg_mp4_parameters(video, sound, mp4_settings);
		}
		console.log('Running ffmpeg command:', 'ffmpeg ' + base_command.join(' '));
		await ffmpeg.exec(base_command);
		const data = await ffmpeg.readFile(`output.${output_format}`);
		const data_array = data as Uint8Array;
		final_video = new Blob([data_array], { type: `video/${output_format}` });
	}

	async function download_sound(file_name: string) {
		let url = get_url(file_name);
		if (!url) {
			toast.push('Invalid sound URL.');
			return;
		}
		console.log('Downloading sound from URL:', url);
		let sound_blob = null;
		await fetch(url)
			.then((response) => {
				if (!response.ok) {
					toast.push('Failed to download sound.');
					return;
				}
				return response.blob();
			})
			.then((blob) => {
				sound_blob = blob;
			})
			.catch((error) => {
				console.error('Error downloading sound:', error);
				toast.push('Error downloading sound.');
			});
		let sound: Stream = {
			name: 'sound.' + get_extension(url),
			blob: sound_blob
		};
		return sound;
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
		<form>
			<label><b>FFmpeg settings</b></label>
			<fieldset>
				<legend>Output format</legend>
				<p>MP4 highly recommended.</p>
				<div class="options">
					<label>
						<input type="radio" name="output_format" value="mp4" bind:group={output_format} />
						MP4 (H.264)
					</label>
					<label>
						<input type="radio" name="output_format" value="webm" bind:group={output_format} />
						WebM (VP8 + 256k Vorbis)
					</label>
				</div>
			</fieldset>
			{#if output_format === 'webm'}
				<fieldset>
					<legend>Target Bitrate</legend>
					<div class="options">
						{#each ['500k', '1M', '2M', '4M'] as bitrate}
							<label>
								<input type="radio" name="webm_bitrate" value={bitrate} bind:group={webm_bitrate} />
								{bitrate}
							</label>
						{/each}
					</div>
				</fieldset>
			{:else}
				<fieldset>
					<legend>Preset</legend>
					<p>Slower will yield higher quality encodes.</p>
					<div class="options">
						{#each ['veryslow', 'slow', 'medium', 'fast', 'veryfast', 'ultrafast'] as p}
							<label>
								<input type="radio" name="preset" value={p} bind:group={mp4_preset} />
								{p.charAt(0).toUpperCase() + p.slice(1)}
							</label>
						{/each}
					</div>
				</fieldset>
				<fieldset>
					<legend>Tune</legend>
					<p>Optimize the output for specific content types.</p>
					<div class="options">
						{#each ['none', 'film', 'animation', 'stillimage'] as t}
							<label>
								<input type="radio" name="tune" value={t} bind:group={mp4_tune} />
								{t.charAt(0).toUpperCase() + t.slice(1)}
							</label>
						{/each}
					</div>
				</fieldset>
			{/if}
		</form>
		<br />
		{#if !is_loading}
			<button onclick={() => merge()}>Merge</button>
		{:else}
			<p>{loading_message} <span class="loader"></span></p>
		{/if}
		<div style="display: {is_finished ? 'blocks' : 'none'}">
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

	.options {
		display: flex;
		gap: 1rem;
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

	button {
		width: fit-content;
	}
</style>
