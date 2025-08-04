<script lang="ts">
	import { is_ffmpeg_ready } from '$lib/ffmpeg.svelte';
	import { init_ffmpeg } from '$lib/ffmpeg.svelte';
	import Merger from '$lib/components/merger.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		init_ffmpeg();
	});
</script>

<main>
	{#if is_ffmpeg_ready()}
		<Merger />
	{:else}
		<p>Loading FFmpeg...</p>
	{/if}
</main>
