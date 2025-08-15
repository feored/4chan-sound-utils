<script lang="ts">
	import ProgressDrag from './progress_drag.svelte';

	type SeekbarProps = {
		master_progress?: number;
		current_time?: number;
		duration?: number;
		start_percentage?: number;
		end_percentage?: number;
		on_seek?: (progress: number) => void;
	};

	let {
		master_progress,
		current_time,
		start_percentage,
		end_percentage,
		duration,
		on_seek
	}: SeekbarProps = $props();

	let start: HTMLDivElement | null = $state(null);
	let end: HTMLDivElement | null = $state(null);

	let seekbar: HTMLDivElement | null = $state(null);
	let seeking: boolean = $state(false);

	function format_time(seconds: number | undefined): string {
		if (seconds === undefined || isNaN(seconds)) {
			return '0:00.000';
		}
		const minutes = Math.floor(seconds / 60)
			.toString()
			.padStart(2, '0');
		const secs = Math.round(seconds % 60)
			.toString()
			.padStart(2, '0');
		const milliseconds = Math.round((seconds % 1) * 1000)
			.toString()
			.padStart(3, '0');
		return `${minutes}:${secs}.${milliseconds}`;
	}

	$inspect(master_progress);

	// function mousedown(event: MouseEvent) {
	// 	if (!seekbar || !handle) return;
	// 	seeking = true;
	// 	drag(event);
	// }

	// export function force_seek(progress: number) {
	// 	if (!seekbar || !handle) return;
	// 	handle.style.left = `${progress}%`;
	// }

	// function drag(event: MouseEvent) {
	// 	if (!seekbar || !handle || !seeking) return;
	// 	const seekbar_rect = seekbar.getBoundingClientRect();
	// 	const handle_width = handle.getBoundingClientRect().width;
	// 	const seekbar_width = seekbar_rect.width - handle_width;

	// 	let progress = (event.clientX - seekbar_rect.left) / seekbar_width;
	// 	let bar_progress = Math.max(0, Math.min(100, progress * 100)); // Clamp between 0 and 100
	// 	handle.style.left = `${bar_progress}%`;
	// 	on_seek?.(progress);
	// }

	$effect(() => {
		set_bracket_percentage(true, start_percentage ?? 0);
		set_bracket_percentage(false, end_percentage ?? 100);
	});

	function set_bracket_percentage(isLeft: boolean, percentage: number) {
		if (!seekbar || !start || !end) return;
		const bracket = isLeft ? start : end;
		bracket.style.left = `${percentage}%`;
	}
</script>

<div id="parent">
	<div id="seekbar" bind:this={seekbar}>
		<ProgressDrag progress={master_progress ?? 0} drag_object={handle} {seekbar} {on_seek}
		></ProgressDrag>
		<div class="flex width">
			<div class="timer-text static width unselectable">{format_time(0)}</div>
			<div class="timer-text static width unselectable end">{format_time(duration)}</div>
		</div>
	</div>
	<div class="left-bracket" bind:this={start}></div>
	<div class="right-bracket" bind:this={end}></div>
</div>

{#snippet handle()}
	<div class="handle">
		<div class="timer-text dynamic-drag unselectable">{format_time(current_time)}</div>
	</div>
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
		transform: translate(-0.5rem, -0.25rem);
	}
	:global(.left_bracket) {
		left: 0;
		top: 0;
		width: 0.5rem;
		height: 100%;
		border-left: 0.25rem solid var(--subtle);
		border-top: 0.25rem solid var(--subtle);
		border-bottom: 0.25rem solid var(--subtle);
		border-top-left-radius: 0.25rem;
		border-bottom-left-radius: 0.25rem;
		transform: translate(0rem, -0.25rem);
	}
	:global(.handle) {
		width: 0.25rem;
		transform: translate(-0.125rem);
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
		border: 1px solid var(--bg-contrast);
		width: 100%;
		background-color: var(--bg-accent);
		height: 100%;
		border-radius: 0.25rem;
	}
</style>
