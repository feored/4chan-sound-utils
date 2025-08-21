<script lang="ts">
	import type { MessageManager } from '$lib/utils/message_manager.svelte';
	import type { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';

	import type { Attachment } from 'svelte/attachments';

	interface LogProps {
		message_manager: MessageManager;
		ffmpeg_manager: FFmpegManager;
	}

	let { message_manager, ffmpeg_manager }: LogProps = $props();

	const attach_listeners: Attachment = () => {
		if (ffmpeg_manager.is_loaded()) {
			message_manager.toggle_ffmpeg_listen(true, ffmpeg_manager);
		}
		return () => {
			message_manager.toggle_ffmpeg_listen(false, ffmpeg_manager);
		};
	};
</script>

<div class="flash muted" {@attach attach_listeners}>
	<ul>
		<p><b>Log</b></p>
		{#each Object.values(message_manager.messages) as message, i}
			<li class:error={message.error}>
				{message.message}
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
	li.error {
		color: var(--danger);
	}
</style>
