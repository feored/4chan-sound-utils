<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';

	let current_file: File | null = $state(null);
</script>

<article>
	<header>
		<h3>Splitter (WebM Maker)</h3>
		<small>
			Splits the audio from a video file and uploads it to one of the approved hosts, then removes
			the audio from the video file.
		</small>
	</header>
	<Filepicker bind:current_file />
</article>
