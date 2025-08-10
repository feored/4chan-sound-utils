<script lang="ts">
	import {
		type ExportSettings,
		type OutputFormat,
		type x264Preset,
		type x264Tune,
		type VP8Bitrate,
		x264PresetOptions,
		x264TuneOptions,
		vp8BitrateOptions
	} from '$lib/ffmpeg/ffmpeg_types';

	type SettingsProps = {
		export_settings?: ExportSettings;
	};
	let { export_settings = $bindable() } = $props();

	let x264_preset: x264Preset = $state('fast'); // Default preset for x264 encoding
	let x264_tune: x264Tune = $state('none'); // Default tune for x264 encoding

	let webm_bitrate: VP8Bitrate = $state('1M'); // Default bitrate for webm encoding
	let output_format: OutputFormat = $state('mp4'); // Default output format

	$effect(() => {
		if (output_format === 'mp4') {
			export_settings = {
				output_format: output_format,
				settings: {
					preset: x264_preset,
					tune: x264_tune
				}
			};
		} else if (output_format === 'webm') {
			export_settings = {
				output_format: output_format,
				settings: {
					bitrate: webm_bitrate
				}
			};
		}
	});
</script>

<form>
	<label><b>FFmpeg settings</b></label>
	<fieldset>
		<legend>Output format</legend>
		<p>MP4 highly recommended.</p>
		<div class="options">
			<label>
				<input type="radio" name="output_format" value="mp4" bind:group={output_format} />
				MP4 (H.264)
			</label>
			<label>
				<input type="radio" name="output_format" value="webm" bind:group={output_format} />
				WebM (VP8 + 256k Vorbis)
			</label>
		</div>
	</fieldset>
	{#if output_format === 'webm'}
		<fieldset>
			<legend>Target Bitrate</legend>
			<div class="options">
				{#each vp8BitrateOptions as bitrate}
					<label>
						<input type="radio" name="webm_bitrate" value={bitrate} bind:group={webm_bitrate} />
						{bitrate}
					</label>
				{/each}
			</div>
		</fieldset>
	{:else}
		<fieldset>
			<legend>Preset</legend>
			<p>Slower will yield higher quality encodes.</p>
			<div class="options">
				{#each x264PresetOptions as p}
					<label>
						<input type="radio" name="preset" value={p} bind:group={x264_preset} />
						{p.charAt(0).toUpperCase() + p.slice(1)}
					</label>
				{/each}
			</div>
		</fieldset>
		<fieldset>
			<legend>Tune</legend>
			<p>
				Optimize the output for specific content types. <br />Pick 'stillimage' if your input is an
				image rather than a video.
			</p>
			<div class="options">
				{#each x264TuneOptions as t}
					<label>
						<input type="radio" name="tune" value={t} bind:group={x264_tune} />
						{t.charAt(0).toUpperCase() + t.slice(1)}
					</label>
				{/each}
			</div>
		</fieldset>
	{/if}
</form>

<style>
	.options {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
	}
</style>
