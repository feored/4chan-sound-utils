<script lang="ts">
	import { Play, Pause, Square, Volume2, VolumeOff, Infinity, Repeat1 } from '@lucide/svelte';
	import { type VideoData } from '$lib/components/splitter/splitter.svelte';
	import { format_ffmpeg_time, approximately_equal } from '$lib/utils/utils';

	interface VideoControlsProps {
		video: HTMLVideoElement | null;
		video_data: VideoData;
	}

	let { video, video_data }: VideoControlsProps = $props();

	$effect(() => {
		if (video) {
			video.addEventListener('play', () => (playing = true));
			video.addEventListener('pause', () => (playing = false));
			video.addEventListener('ended', () => (playing = false));
			video.addEventListener('loadstart', () => (playing = false)); //loading a new video
		}
	});

	let playing = $state(false);
	let looping = $state(true);
	let sound_enabled = $state(true);

	function set_video_to_start() {
		if (!video || !video_data) return;
		video.currentTime = video_data.start_progress * video_data.duration;
	}

	function stop() {
		if (!video) return;
		video.pause();
		set_video_to_start();
	}

	function play() {
		if (!video) return;
		if (video.ended || approximately_equal(video_data.progress, video_data.end_progress)) {
			set_video_to_start();
		}
		video.play();
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
		{#if playing}
			<button class="bd-accent" onclick={() => video?.pause()}><Pause /></button>
		{:else}
			<button onclick={play}>
				<Play />
			</button>
		{/if}
		<button onclick={stop}><Square /></button>
		<div class="timer-text flash accent">
			{format_ffmpeg_time(video_data.current_time, false)} / {format_ffmpeg_time(
				video_data.duration,
				false
			)}
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
