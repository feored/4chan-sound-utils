<script lang="ts">
	type SeekbarProps = {
		master_progress?: number;
		current_time?: number;
		on_seek?: (progress: number) => void;
	};

	let { master_progress, current_time, on_seek }: SeekbarProps = $props();

	let seekbar: HTMLDivElement | null = $state(null);
	let handle: HTMLDivElement | null = $state(null);
	let seeking: boolean = $state(false);

	function format_time(seconds: number | undefined): string {
		if (seconds === undefined || isNaN(seconds)) {
			return '0:00.000';
		}
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		const milliseconds = Math.floor((seconds % 1) * 100);
		return `${minutes}:${secs < 10 ? '0' : ''}${secs}.${milliseconds < 10 ? '0' : ''}${milliseconds}`;
	}

	$effect(() => {
		if (master_progress !== undefined && seekbar && handle) {
			const progress = master_progress * 100; // Convert to percentage
			handle.style.left = `${progress}%`;
		}
	});

	function mousedown(event: MouseEvent) {
		if (!seekbar || !handle) return;
		seeking = true;
		drag(event);
	}

	export function force_seek(progress: number) {
		if (!seekbar || !handle) return;
		handle.style.left = `${progress}%`;
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
		<div bind:this={handle} id="handle">
			<div id="timer" class="flash">{format_time(current_time)}</div>
		</div>
	</div>
</div>

<style>
	#parent {
		width: 100%;
		position: relative;
	}

	#handle {
		width: 0.25rem;
		transform: translate(-0.125rem);
		background-color: var(--accent);
		cursor: ew-resize;
		height: 100%;
		position: absolute;
	}

	#seekbar {
		border: 1px solid var(--bg-contrast);
		width: 100%;
		background-color: var(--bg-accent);
		height: 100%;
		border-radius: 0.25rem;
	}
</style>
