<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import { ffmpeg } from '$lib/ffmpeg.svelte';
	import { onMount } from 'svelte';
	import { get_url, get_file_type, get_extension, get_file_name } from '$lib/utils';
	import { toast } from '@zerodevx/svelte-toast';
	import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
		}
	});

	async function merge() {
		if (!current_file) {
			toast.push('No file selected to merge with.');
			return;
		}
		is_loading = true;
		loading_message = 'Downloading sound...';
		const sound_blob = await download_sound(current_file.name);
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
