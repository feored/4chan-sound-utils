<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import byteSize from 'byte-size';
	import { ffmpeg } from '$lib/ffmpeg.svelte';
	import { onMount } from 'svelte';
	import { get_url, get_file_type, get_extension, get_file_name } from '$lib/utils';
	import { toast } from '@zerodevx/svelte-toast';
	import { fetchFile } from '@ffmpeg/util';

	type Stream = {
		name: string;
		blob: Blob;
	};

	let preset: 'veryslow' | 'slow' | 'medium' | 'fast' | 'veryfast' | 'ultrafast' = $state('fast'); // Default preset for ffmpeg
	let tune: 'none' | 'film' | 'animation' | 'stillimage' = $state('none'); // Default tune for ffmpeg

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
			is_loading = false;
			is_finished = false;
			if (get_file_type(current_file.name) === 'image') {
				tune = 'stillimage'; // Set default tune for images
			} else {
				tune = 'none'; // Reset tune for videos
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
		let base_command = ['-i', video.name, '-i', sound.name];
		if (get_file_type(video.name) == 'image') {
			base_command.unshift('-loop', '1', '-r', '1');
			base_command.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2'); // fix images where width or height is odd
			base_command.push('-shortest', '-r', '1');
		}
		base_command.push('-map', '0:v', '-map', '1:a'); // Map video from the first input and audio from the second input
		base_command.push('-preset', preset);
		if (tune !== 'none') {
			base_command.push('-tune', tune);
		}
		base_command.push('-pix_fmt:v', 'yuv420p');
		base_command.push('output.mp4');
		console.log('Running ffmpeg command:', 'ffmpeg ' + base_command.join(' '));
		await ffmpeg.exec(base_command);
		const data = await ffmpeg.readFile('output.mp4');
		const dataArray = data as Uint8Array;
		final_video = new Blob([dataArray], { type: 'video/mp4' });
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
				<legend>Preset</legend>
				<p>Slower will yield higher quality encodes.</p>
				<div class="options">
					{#each ['veryslow', 'slow', 'medium', 'fast', 'veryfast', 'ultrafast'] as p}
						<label>
							<input type="radio" name="preset" value={p} bind:group={preset} />
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
							<input type="radio" name="tune" value={t} bind:group={tune} />
							{t.charAt(0).toUpperCase() + t.slice(1)}
						</label>
					{/each}
				</div>
			</fieldset>
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
				<a href={URL.createObjectURL(final_video)} download="{get_file_name(current_file.name)}.mp4"
					><button>Download</button></a
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
