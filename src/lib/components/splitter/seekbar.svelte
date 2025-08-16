<script lang="ts">
	import ProgressDrag from './progress_drag.svelte';

	type SeekbarProps = {
		progress?: number;
		current_time?: number;
		duration?: number;
		start_progress?: number;
		end_progress?: number;
		on_seek?: (progress: number) => void;
		on_start_seek?: (start: number) => void;
		on_end_seek?: (end: number) => void;
	};

	let {
		progress,
		current_time,
		start_progress,
		end_progress,
		duration,
		on_seek,
		on_start_seek,
		on_end_seek
	}: SeekbarProps = $props();

	let seekbar: HTMLDivElement | null = $state(null);
</script>

<div class="parent">
	<div class="seekbar" bind:this={seekbar}>
		<ProgressDrag
			progress={start_progress ?? 0}
			seek_type="left_bracket"
			{seekbar}
			on_seek={on_start_seek}
		/>
		<ProgressDrag
			progress={end_progress ?? 100}
			seek_type="right_bracket"
			{seekbar}
			on_seek={on_end_seek}
		/>
		<ProgressDrag progress={progress ?? 0} seek_type="handle" {seekbar} {on_seek} />
	</div>
</div>

{#snippet handle()}
	<div class="handle"></div>
{/snippet}

{#snippet left_bracket()}
	<div class="left_bracket"></div>
{/snippet}

{#snippet right_bracket()}
	<div class="right_bracket"></div>
{/snippet}

<style>
	.parent {
		width: 100%;
		position: relative;
		height: 3rem;
	}

	.seekbar {
		/* border: 1px solid var(--bg-contrast); */
		width: 100%;
		background-color: var(--bg-accent);
		height: 100%;
		border-radius: var(--bd-radius);
	}
</style>
