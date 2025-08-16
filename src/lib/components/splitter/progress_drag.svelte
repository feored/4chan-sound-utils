<script lang="ts">
	import { format_ffmpeg_time } from '$lib/utils';
	interface DraggableProps {
		progress: number;
		duration: number;
		seek_type: 'handle' | 'left_bracket' | 'right_bracket';
		seekbar: HTMLDivElement;
		on_seek?: (progress: number) => void;
	}
	let { progress, seek_type, duration, seekbar, on_seek }: DraggableProps = $props();

	let dragging = $state(false);
	let self: HTMLDivElement | null = $state(null);

	function onmousedown(event: MouseEvent) {
		dragging = true;
		document.body.style.cursor = 'ew-resize';
	}

	function onmouseup(event: MouseEvent) {
		if (!dragging || !self || !seekbar) return;
		dragging = false;
		document.body.style.cursor = 'default';
	}

	function onmousemove(event: MouseEvent) {
		if (!dragging || !self || !seekbar) return;
		const seekbar_rect = seekbar.getBoundingClientRect();
		let bar_progress =
			(event.clientX - seekbar_rect.left) /
			(seekbar_rect.width - self.getBoundingClientRect().width);
		progress = Math.max(0, Math.min(1, bar_progress)); // Clamp between 0 and 1
		on_seek?.(progress);
	}

	function display_progress() {
		if (!self || !seekbar) return '0%';
		const seekbar_rect = seekbar.getBoundingClientRect();
		let ratio = (seekbar_rect.width - self.getBoundingClientRect().width) / seekbar_rect.width;
		if (seek_type === 'handle' || seek_type === 'right_bracket') {
			return `${progress * 100 * ratio}%`;
		}
		return `${progress * 100}%`;
	}
</script>

<svelte:document {onmouseup} {onmousemove} />
<div
	bind:this={self}
	class="draggable {seek_type}"
	style:left={display_progress()}
	{onmouseenter}
	{onmousedown}
	{onmousemove}
>
	{#if dragging}
		<div class="p-.5 timer-display timer-text flash accent unselectable">
			{format_ffmpeg_time(progress * duration, false)}
		</div>
	{/if}
</div>

<style>
	.unselectable {
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
		cursor: default;
	}
	.timer-display {
		position: absolute;
		top: 100%;
		font-family: var(--ft-mono);
		font-size: 0.85rem;
		transform: translate(-50%);
	}
	.draggable {
		position: absolute;
		height: 100%;
		cursor: ew-resize;
	}

	.right_bracket {
		left: 100%;
		width: 0.5rem;
		border-right: 0.25rem solid var(--subtle);
		border-top: 0.25rem solid var(--subtle);
		border-bottom: 0.25rem solid var(--subtle);
		border-top-right-radius: var(--bd-radius);
		border-bottom-right-radius: var(--bd-radius);
		transform: translate(0rem, -0.25rem);
		border-color: var(--accent);
	}
	.left_bracket {
		left: 0;
		width: 0.5rem;
		border-left: 0.25rem solid var(--subtle);
		border-top: 0.25rem solid var(--subtle);
		border-bottom: 0.25rem solid var(--subtle);
		border-top-left-radius: var(--bd-radius);
		border-bottom-left-radius: var(--bd-radius);
		transform: translate(-0.25rem, -0.25rem);
		border-color: var(--accent);
	}
	.handle {
		width: 0.4rem;
		background-color: var(--dark-danger);
	}
</style>
