<script lang="ts">
	import { Play, Pause, Square, Volume2, VolumeOff, Infinity, Repeat1 } from '@lucide/svelte';
	import { format_ffmpeg_time } from '$lib/utils';

	interface VideoControlsProps {
		video: HTMLVideoElement | null;
		duration: number;
		stop: () => void;
	}

	let { video, duration, stop }: VideoControlsProps = $props();

	$effect(() => {
		if (video) {
			video.addEventListener('play', () => (playing = true));
			video.addEventListener('pause', () => (playing = false));
			video.addEventListener('ended', () => (playing = false));
			video.addEventListener('timeupdate', () => {
				current_time = video.currentTime;
			});
		}
	});

	let playing = $state(false);
	let looping = $state(false);
	let sound_enabled = $state(true);

	let current_time = $state(0);

	function toggle_play() {
		if (!video) return;
		if (!playing) {
			video.play();
		} else {
			video.pause();
		}
	}

	$effect(() => {
		if (video) {
			video.loop = looping;
			video.muted = !sound_enabled;
		}
	});
</script>

<div class="controls-container">
	<div class="controls">
		<button onclick={stop}><Square /></button>
		<button onclick={toggle_play}
			>{#if playing}<Pause />
			{:else}
				<Play />
			{/if}
		</button>
		<div class="timer-text flash accent">
			{format_ffmpeg_time(current_time, false)} / {format_ffmpeg_time(duration, false)}
		</div>
	</div>
	<div class="controls">
		<button class:bd-accent={looping} onclick={() => (looping = !looping)}>
			{#if looping}<Infinity />{:else}<Repeat1 />
			{/if}</button
		>
		<button class:bd-accent={sound_enabled} onclick={() => (sound_enabled = !sound_enabled)}>
			{#if sound_enabled}<Volume2 />{:else}<VolumeOff />
			{/if}
		</button>
	</div>
</div>

<style>
	.controls-container {
		display: flex;
		justify-content: space-between;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
	}
	.timer-text {
		font-family: var(--ft-mono);
		font-size: 0.85rem;
	}

	.controls > button {
		margin: 1rem 0;
	}
</style>
