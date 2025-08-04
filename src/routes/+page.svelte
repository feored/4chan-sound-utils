<script lang="ts">
	import { is_ffmpeg_ready } from '$lib/ffmpeg.svelte';
	import FFmpeg_loader from '$lib/components/ffmpeg_loader.svelte';
	import Merger from '$lib/components/merger.svelte';
</script>

<main>
	{#if is_ffmpeg_ready()}
		<Merger />
	{:else}
		<FFmpeg_loader />
	{/if}
</main>
