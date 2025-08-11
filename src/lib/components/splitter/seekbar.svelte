<script lang="ts">
	type SeekbarProps = {
		on_seek?: (progress: number) => void;
	};

	let { on_seek }: SeekbarProps = $props();

	let seekbar: HTMLDivElement | null = $state(null);
	let handle: HTMLDivElement | null = $state(null);
	let seeking: boolean = $state(false);

	function mousedown(event: MouseEvent) {
		if (!seekbar || !handle) return;
		seeking = true;
		drag(event);
	}

	function drag(event: MouseEvent) {
		if (!seekbar || !handle || !seeking) return;
		const seekbar_rect = seekbar.getBoundingClientRect();
		const handle_width = handle.getBoundingClientRect().width;
		const seekbar_width = seekbar_rect.width - handle_width;

		let progress = (event.clientX - seekbar_rect.left) / seekbar_width;
		let bar_progress = Math.max(0, Math.min(100, progress * 100)); // Clamp between 0 and 100
		handle.style.left = `${bar_progress}%`;
		on_seek?.(progress);
	}
</script>

<div id="parent">
	<div
		id="seekbar"
		bind:this={seekbar}
		onmousemove={drag}
		onmouseleave={() => {
			seeking = false;
		}}
		onmousedown={mousedown}
		onmouseup={() => {
			console.log('Seekbar released');
			seeking = false;
		}}
	>
		<div bind:this={handle} id="handle"></div>
	</div>
</div>

<style>
	#parent {
		position: relative;
	}

	#handle {
		width: 0.25rem;
		height: 2rem;
		transform: translate(-0.125rem);
		background-color: #007bff;
		cursor: ew-resize;
		position: absolute;
	}

	#seekbar {
		width: 100%;
		height: 2rem;
		background-color: #f0f0f0;
		border-radius: 0.25rem;
		margin-bottom: 2rem;
	}
</style>
