<script lang="ts">
	import type { MessageManager } from '$lib/utils/message_manager.svelte';
	import type { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';

	import { type LogEvent, type ProgressEvent } from '@ffmpeg/ffmpeg';
	import type { Attachment } from 'svelte/attachments';

	interface LogProps {
		message_manager: MessageManager;
		ffmpeg_manager: FFmpegManager;
	}

	let { message_manager, ffmpeg_manager }: LogProps = $props();

	const attach_listeners: Attachment = () => {
		if (ffmpeg_manager.is_loaded()) {
			ffmpeg_manager.manage_listeners(true, listen_ffmpeg_message, listen_ffmpeg_progress);
		}
		return () => {
			ffmpeg_manager.manage_listeners(false, listen_ffmpeg_message, listen_ffmpeg_progress);
		};
	};

	function listen_ffmpeg_message(event: LogEvent) {
		let formatted_message = `FFmpeg [${event.type}]: ${event.message}`;
		message_manager.add('ffmpeg', formatted_message);
		console.log(formatted_message);
	}

	function listen_ffmpeg_progress(event: ProgressEvent) {
		const progress = event.progress * 100; // Convert to percentage
		message_manager.add('progress', `FFmpeg progress: ${progress.toFixed(2)}%`);
	}
</script>

<div class="flash muted" {@attach attach_listeners}>
	<p class="default"><b>Log</b></p>
	<ul>
		{#each Object.values(message_manager.messages) as value, i}
			<li>
				{value}
			</li>
		{/each}
	</ul>
</div>

<style>
	li {
		font-family: var(--ft-mono);
		font-size: 0.85rem;
		list-style: none;
	}

	li:last-child {
		color: var(--accent);
	}
</style>
