<script lang="ts">
	import type { Snippet } from 'svelte';

	interface DraggableProps {
		progress: number;
		drag_object: Snippet;
		seekbar: HTMLDivElement;
	}
	let { progress = $bindable(), drag_object, seekbar }: DraggableProps = $props();

	let dragging = $state(false);
	let self: HTMLDivElement | null = $state(null);

	let seekbar_rect = $derived.by(() => seekbar.getBoundingClientRect());
	let self_width = $derived.by(() => (self ? self.getBoundingClientRect().width : 0));
	let seekbar_width = $derived(seekbar_rect.width - self_width);

	function onmouseenter() {
		document.body.style.cursor = 'ew-resize;';
	}

	function onmouseleave() {
		document.body.style.cursor = 'auto';
		dragging = false;
	}

	function onmousedown() {
		dragging = true;
		//onclick?.();
	}

	function onmouseup() {
		dragging = false;
	}

	function onmousemove(event: MouseEvent) {
		let progress = (event.clientX - seekbar_rect.left) / seekbar_width;
		let bar_progress = Math.max(0, Math.min(100, progress * 100)); // Clamp between 0 and 100
		self?.style.left = `${bar_progress}%`;
	}
</script>

<div
	bind:this={self}
	class="draggable"
	style="left: {progress * 100}%"
	{onmouseenter}
	{onmouseleave}
	{onmousedown}
	{onmouseup}
	{onmousemove}
>
	{@render drag_object()}
</div>
