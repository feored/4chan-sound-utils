<script lang="ts">
	import { init_ffmpeg } from '$lib/ffmpeg.svelte';
	let ffmpeg_version: 'mt' | 'st' = $state('mt'); // Default to multithreaded version
	let ffmpeg_loading = $state(false);

	async function load_ffmpeg() {
		ffmpeg_loading = true;
		let version = ffmpeg_version == 'mt';
		await init_ffmpeg(version);
		ffmpeg_loading = false;
	}
</script>

{#if !ffmpeg_loading}
	<form>
		<label><b>Choose which version of FFmpeg to use</b></label>
		<p>
			The multithreaded version is faster but only recommended on firefox as it seems to hang on
			chromium-based browsers.
		</p>
		<label>
			<input type="radio" name="ffmpeg-version" value="mt" bind:group={ffmpeg_version} />
			Multi-thread
		</label>
		<label>
			<input type="radio" name="ffmpeg-version" value="st" bind:group={ffmpeg_version} />
			Single-thread
		</label>
		<button onclick={() => load_ffmpeg()}>Load FFmpeg</button>
	</form>
{:else}
	<p>Loading FFmpeg... <span class="loader"></span></p>
{/if}

<style>
	.loader {
		width: 24px;
		height: 24px;
		border: 2px solid #fff;
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
