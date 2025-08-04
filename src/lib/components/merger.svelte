<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import { onMount } from 'svelte';
	import { get_url, get_file_type, get_extension, get_file_name } from '$lib/utils';
	import { toast } from '@zerodevx/svelte-toast';
	import { FFmpeg } from '@ffmpeg/ffmpeg';

	import { fetchFile, toBlobURL } from '@ffmpeg/util';
	import { get } from 'svelte/store';

	let ffmpeg: FFmpeg;
	let ffmpeg_version: 'mt' | 'st' = $state('mt'); // Default to multithreaded version
	let ffmpeg_loaded = $state(false);
	let ffmpeg_loading = $state(false);

	let videoEl;
	let dlLink;

	let loading_message = $state('');
	let is_loading = $state(false);
	let is_finished = $state(false);
	let current_file: File | null = $state(null);

	$effect(() => {
		if (ffmpeg_loaded && current_file) {
			is_loading = false;
			is_finished = false;
		}
	});

	async function merge() {
		if (!current_file) {
			toast.push('No file selected to merge with.');
			return;
		}
		is_loading = true;
		loading_message = 'Downloading sound...';
		const sound_blob = await download_sound();
		if (!sound_blob) {
			toast.push('No sound blob to merge with.');
			is_loading = false;
			return;
		}
		loading_message = 'Launching ffmpeg...';
		let sound_name = 'test.' + get_extension(get_url(current_file.name));
		await ffmpeg_merge(current_file, current_file.name, sound_blob, sound_name);
		is_loading = false;
		is_finished = true;
	}

	async function load_ffmpeg() {
		ffmpeg_loading = true;
		const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
		ffmpeg = new FFmpeg();
		ffmpeg.on('log', ({ message }) => {
			console.log(message);
		});
		ffmpeg.on('progress', ({ progress, time }) => {
			loading_message = 'Merging files... ' + (progress * 100).toFixed(2) + '%';
		});
		let version = ffmpeg_version == 'mt' ? 'multithreaded' : 'singlethreaded';
		console.log(`Loading FFmpeg ${version}...`);
		await ffmpeg.load({
			coreURL: `http://localhost:5173/${version}/ffmpeg-core.js`,
			wasmURL: `http://localhost:5173/${version}/ffmpeg-core.wasm`
		});
		console.log('FFmpeg loaded successfully.');
		ffmpeg_loading = false;
		ffmpeg_loaded = true;
	}

	async function ffmpeg_merge(
		source_blob: Blob,
		source_name: string,
		sound_blob: Blob,
		sound_name: string
	) {
		await ffmpeg.writeFile(source_name, await fetchFile(source_blob));
		await ffmpeg.writeFile(sound_name, await fetchFile(sound_blob));
		await ffmpeg.exec(['-i', source_name, '-i', sound_name, '-preset', 'ultrafast', 'output.mp4']);
		const data = await ffmpeg.readFile('output.mp4');
		const dataA = data as Uint8Array;
		videoEl.src = URL.createObjectURL(new Blob([dataA], { type: 'video/mp4' }));
		dlLink.href = videoEl.src;
	}

	async function download_sound() {
		let url = get_url(current_file.name);
		if (!url) {
			toast.push('Invalid sound URL.');
			return;
		}
		if (get_file_type(url) !== 'audio') {
			toast.push('Sound URL file format is not supported.');
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
		return sound_blob;
	}
</script>

<article>
	<h3>Merger</h3>
	{#if !ffmpeg_loaded}
		{#if !ffmpeg_loading}
			<form>
				<label><b>Choose which version of FFmpeg to use</b></label>
				<p>
					The multithreaded version is an order of magnitude faster but only recommended on firefox
					as it seems to hang on chromium-based browsers.
				</p>
				<label>
					<input type="radio" name="ffmpeg-version" value="mt" bind:group={ffmpeg_version} />
					Multi-thread
				</label>
				<label>
					<input type="radio" name="ffmpeg-version" value="st" bind:group={ffmpeg_version} />
					Single-thread
				</label>
				<button onclick={() => load_ffmpeg()}>Load FFmpeg</button>
			</form>
		{:else}
			<p>Loading FFmpeg... <span class="loader"></span></p>
		{/if}
	{:else}
		<Filepicker bind:current_file />
		{#if current_file}
			{#if !is_loading}
				<button onclick={() => merge()}>Merge</button>
			{:else}
				<p>{loading_message} <span class="loader"></span></p>
			{/if}
			<div style="display: {is_finished ? 'contents' : 'none'}">
				<p>Output</p>
				<video bind:this={videoEl} controls />
				<p>
					<a bind:this={dlLink} download="{get_file_name(current_file.name) + '_merged'}.mp4"
						><button>Download</button></a
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

	button {
		width: fit-content;
	}
</style>
