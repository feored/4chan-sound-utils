<script>
	import { is_ffmpeg_loaded, init_ffmpeg } from '$lib/ffmpeg/ffmpeg.svelte';
	import Splitter from '$lib/components/splitter/splitter.svelte';
	import Merger from '$lib/components/merger/merger.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		init_ffmpeg();
	});
</script>

<main>
	{#if is_ffmpeg_loaded()}
		<small><i>FFmpeg loaded.</i></small>
		<hr />
		<Splitter />
		<hr />
		<Merger />
	{:else}
		<p>Loading FFmpeg...</p>
	{/if}
</main>
