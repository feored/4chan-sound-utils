<script lang="ts">
	import type { Snippet } from 'svelte';

	interface DraggableProps {
		progress: number;
		seek_type: 'handle' | 'left_bracket' | 'right_bracket';
		seekbar: HTMLDivElement;
		on_seek?: (progress: number) => void;
	}
	let { progress, seek_type, seekbar, on_seek }: DraggableProps = $props();

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
		if (seek_type === 'handle' || seek_type === 'right_bracket') {
			return `clamp(0%, ${progress * 100}%, calc(100% - ${self ? self.getBoundingClientRect().width : 0}px))`;
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
></div>

<style>
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
	}
	.handle {
		width: 0.4rem;
		background-color: var(--accent);
	}
</style>
