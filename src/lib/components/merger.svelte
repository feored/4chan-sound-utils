<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import { ffmpeg } from '$lib/ffmpeg.svelte';
	import { onMount } from 'svelte';
	import { get_url, get_file_type, get_extension, get_file_name } from '$lib/utils';
	import { toast } from '@zerodevx/svelte-toast';
	import { fetchFile, toBlobURL } from '@ffmpeg/util';
	import { get } from 'svelte/store';

	type Stream = {
		name: string;
		blob: Blob;
	};

	let preset: 'veryslow' | 'slow' | 'medium' | 'fast' | 'veryfast' | 'ultrafast' = $state('fast'); // Default preset for ffmpeg
	let tune: 'none' | 'film' | 'animation' | 'stillimage' = $state('none'); // Default tune for ffmpeg

	let videoEl = $state<HTMLVideoElement | null>(null);
	let dlLink = $state<HTMLAnchorElement | null>(null);

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
		await ffmpeg_merge(video, sound);
		is_loading = false;
		is_finished = true;
	}

	async function ffmpeg_merge(video: Stream, sound: Stream) {
		await ffmpeg.writeFile(video.name, await fetchFile(video.blob));
		await ffmpeg.writeFile(sound.name, await fetchFile(sound.blob));
		let base_command = ['-i', video.name, '-i', sound.name];
		if (get_file_type(video.name) == 'image') {
			base_command.unshift('-loop', '1', '-r', '1');
			base_command.push('-shortest', '-r', '1');
		}
		base_command.push('-map', '0:v', '-map', '1:a');
		base_command.push('-preset', preset);
		if (tune !== 'none') {
			base_command.push('-tune', tune);
		}
		base_command.push('output.mp4');
		console.log('Running ffmpeg command:', 'ffmpeg ' + base_command.join(' '));
		await ffmpeg.exec(base_command);
		const data = await ffmpeg.readFile('output.mp4');
		const dataA = data as Uint8Array;
		if (videoEl && dlLink) {
			videoEl.src = URL.createObjectURL(new Blob([dataA], { type: 'video/mp4' }));
			dlLink.href = videoEl.src;
		} else {
			toast.push('Error: Video element or download link not found.');
		}
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
	<h3>Merger</h3>
	<Filepicker bind:current_file />
	{#if current_file}
		<form>
			<label><b>FFmpeg settings</b></label>
			<fieldset>
				<legend>Preset</legend>
				<p>Slower will yield higher quality encodes. Warning: May run out of memory.</p>
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
			<p>Output</p>
			<video bind:this={videoEl} controls />
			<p>
				<a bind:this={dlLink} download="{get_file_name(current_file.name) + '_merged'}.mp4"
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
