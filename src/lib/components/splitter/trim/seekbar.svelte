<script lang="ts">
	import ProgressDrag from '$lib/components/splitter/trim/progress_drag.svelte';
	import type { VideoData } from '$lib/types';

	type SeekbarProps = {
		video_data: VideoData;
		on_seek?: (progress: number, preview?: boolean) => void;
		on_start_seek?: (start: number, preview?: boolean) => void;
		on_end_seek?: (end: number, preview?: boolean) => void;
	};

	let { video_data, on_seek, on_start_seek, on_end_seek }: SeekbarProps = $props();

	let seekbar: HTMLDivElement | null = $state(null);
</script>

<div class="parent">
	<div class="seekbar" bind:this={seekbar}>
		<ProgressDrag
			progress={video_data.start_progress ?? 0}
			seek_type="left_bracket"
			{seekbar}
			on_seek={on_start_seek}
			duration={video_data.duration}
		/>
		<ProgressDrag
			progress={video_data.end_progress ?? 100}
			seek_type="right_bracket"
			{seekbar}
			on_seek={on_end_seek}
			duration={video_data.duration}
		/>
		<ProgressDrag
			progress={video_data.progress ?? 0}
			seek_type="handle"
			{seekbar}
			{on_seek}
			duration={video_data.duration}
		/>
	</div>
</div>

<style>
	.parent {
		width: 100%;
		position: relative;
		height: 2rem;
	}

	.seekbar {
		/* border: 1px solid var(--bg-contrast); */
		width: 100%;
		background: var(--accent);
		background: radial-gradient(circle, var(--accent) 0%, var(--bg-accent) 150%);
		height: 100%;
		border-radius: var(--bd-radius);
	}
</style>
