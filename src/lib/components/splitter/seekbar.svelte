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

<div id="parent">
	<div id="seekbar" bind:this={seekbar}>
		<ProgressDrag
			progress={start_progress ?? 0}
			drag_object={left_bracket}
			{seekbar}
			on_seek={on_start_seek}
		/>
		<ProgressDrag
			progress={end_progress ?? 100}
			drag_object={right_bracket}
			{seekbar}
			on_seek={on_end_seek}
		/>
		<ProgressDrag progress={progress ?? 0} drag_object={handle} {seekbar} {on_seek} />
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
	:global(.right_bracket) {
		left: 100%;
		top: 0;
		width: 0.5rem;
		height: 100%;
		border-right: 0.25rem solid var(--subtle);
		border-top: 0.25rem solid var(--subtle);
		border-bottom: 0.25rem solid var(--subtle);
		border-top-right-radius: 0.25rem;
		border-bottom-right-radius: 0.25rem;
		transform: translate(0.5rem, -0.25rem);
		cursor: ew-resize;
	}
	:global(.left_bracket) {
		left: 0;
		width: 0.5rem;
		height: 100%;
		border-left: 0.25rem solid var(--subtle);
		border-top: 0.25rem solid var(--subtle);
		border-bottom: 0.25rem solid var(--subtle);
		border-top-left-radius: 0.25rem;
		border-bottom-left-radius: 0.25rem;
		transform: translate(-0.25rem, -0.25rem);
		cursor: ew-resize;
	}
	:global(.handle) {
		width: 0.4rem;
		background-color: var(--accent);
		cursor: ew-resize;
		height: 100%;
	}
	.end {
		text-align: end;
	}
	.static {
		transform: translate(0rem, 3rem);
	}

	:static(.dynamic-drag) {
		transform: translate(0.5rem, 1rem);
	}

	:global(.timer-text) {
		font-family: var(--ft-mono);
		font-size: 0.85rem;
	}

	#parent {
		width: 100%;
		position: relative;
		height: 3rem;
	}

	:global(.unselectable) {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	#seekbar {
		/* border: 1px solid var(--bg-contrast); */
		width: 100%;
		background-color: var(--bg-accent);
		height: 100%;
		border-radius: 0.25rem;
	}
</style>
