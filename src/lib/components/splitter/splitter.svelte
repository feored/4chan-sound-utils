<script module lang="ts">
	import type { VideoData } from '$lib/types';
	const default_video_data: VideoData = {
		progress: 0,
		current_time: 0,
		duration: 0,
		start_progress: 0,
		end_progress: 1
	};
</script>

<script lang="ts">
	import Filepicker from '$lib/components/filepicker.svelte';
	import Seekbar from '$lib/components/splitter/trim/seekbar.svelte';
	import VideoControls from '$lib/components/splitter/video_controls.svelte';
	import CanvasController, {
		get_crop
	} from '$lib/components/splitter/crop/canvas_controller.svelte';
	import Log from '../log.svelte';
	import Restrictions from './restrictions.svelte';
	import FfmpegExportSettings from '../ffmpeg_export_settings.svelte';

	import { MessageManager } from '$lib/utils/message_manager.svelte';
	import type { ExportSettings, Stream } from '$lib/types';
	import { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';
	import { extract } from '$lib/ffmpeg/scripts/extract';
	import { onMount } from 'svelte';
	import { Info } from '@lucide/svelte';

	let current_file: File | null = $state(null);
	let video: HTMLVideoElement | null = $state(null);
	let video_data: VideoData = $state(default_video_data);
	let previewing: boolean = $state(false);
	const message_manager = new MessageManager();
	const ffmpeg_manager = new FFmpegManager();
	let current_state: 'ready' | 'loading' | 'finished' = $state('ready');
	let export_settings: ExportSettings = $state({
		output_format: 'mp4',
		settings: {
			preset: 'fast',
			tune: 'none',
			bitrate: 2048 // Default bitrate in Kbits/s
		},
		crop: get_crop()
	});

	let export_result: Stream = $state({
		name: '',
		blob: new Blob()
	});

	let extracted_audio: Stream = $state({
		name: '',
		blob: new Blob()
	});

	let audio_url: string = $state('');

	onMount(() => {
		// Default video ontimeupdate evemt fires too slowly, makes it choppy
		setInterval(
			function () {
				ontimeupdate(new Event('ontimeupdate'));
			},
			(1 / 24) * 1000 // 24 FPS
		);

		ffmpeg_manager.init();
	});

	$effect(() => {
		// Reset video data when a new file is selected
		if (current_file) {
			video_data = default_video_data;
			current_state = 'ready';
		}
	});

	function on_start_seek(progress: number) {
		video_data.start_progress = progress;
		if (video_data.start_progress > video_data.end_progress) {
			video_data.end_progress = video_data.start_progress + 0.05;
		}
		if (!video) return;
		previewing = true;
		video.currentTime = progress * video.duration;
		if (video_data.progress < video_data.start_progress) {
			video_data.progress = video_data.start_progress;
		}
	}

	function on_end_seek(progress: number) {
		video_data.end_progress = progress;
		if (video_data.end_progress < video_data.start_progress) {
			video_data.start_progress = video_data.end_progress - 0.05;
		}
		if (!video) return;
		previewing = true;
		video.currentTime = progress * video.duration;
		if (video_data.progress > video_data.end_progress) {
			video_data.progress = video_data.end_progress;
		}
	}

	function on_seek(progress: number) {
		if (!video) return;
		if (isNaN(video.duration)) return;
		if (progress < video_data.start_progress) {
			video_data.progress = video_data.start_progress;
		} else if (progress > video_data.end_progress) {
			video_data.progress = video_data.end_progress;
		}
		video.currentTime = progress * video.duration;
	}

	function ondurationchange() {
		if (!video) return;
		video_data.duration = video.duration;
	}

	function ontimeupdate(_event: Event) {
		if (!video) return;
		if (previewing) return;
		video_data.progress = video.currentTime / video.duration;
		video_data.current_time = video.currentTime;
		if (video_data.progress < video_data.start_progress - 0.01) {
			// Epsilon to avoid floating point issues
			video.currentTime = video_data.start_progress * video.duration;
		} else if (video_data.progress > video_data.end_progress) {
			if (!video.loop) {
				video.pause();
				video.currentTime = video_data.end_progress * video.duration;
			} else {
				video.currentTime = video_data.start_progress * video.duration;
			}
		}
	}

	function on_release() {
		previewing = false;
		if (!video) return;
		video.currentTime = video_data.progress * video.duration;
	}

	// async function get_sound_extension(stream: Stream): Promise<string | null> {
	// 	set_ffmpeg_busy(true);
	// 	await ffmpeg.writeFile(stream.name, await fetchFile(stream.blob));
	// 	let command = `-select_streams a:0 -show_entries stream=codec_name -of csv=p=0 ${stream.name} -o output.txt`;
	// 	await ffmpeg.ffprobe(command.split(' '));
	// 	const data = await ffmpeg.readFile('output.txt');
	// 	set_ffmpeg_busy(false);
	// 	if (!data) {
	// 		toast.push('Failed to get sound extension.');
	// 		return null;
	// 	}
	// 	const data_array = data as Uint8Array;
	// 	const utf8_decoder = new TextDecoder(); // utf8 is the default
	// 	return utf8_decoder.decode(data_array).trim();
	// }

	async function split() {
		message_manager.reset();
		current_state = 'loading';
		message_manager.log('Splitting audio and video...');
		const ffmpeg = ffmpeg_manager.get_instance();
		if (!ffmpeg) {
			message_manager.error('FFmpeg instance is not available.');
			return;
		}
		if (!current_file) {
			message_manager.error('No file selected.');
			return;
		}
		const audio_stream = await extract(
			ffmpeg,
			{
				name: current_file.name,
				blob: current_file
			},
			{
				output_format: 'ogg',
				trim: {
					start: video_data.start_progress * video_data.duration,
					end: video_data.end_progress * video_data.duration
				},
				crop: get_crop()
			},
			message_manager,
			'audio'
		).catch((error) => {
			message_manager.error(error.message);
			return null;
		});
		if (!audio_stream) {
			message_manager.error('Failed to extract audio from video file.');
			return;
		}
		extracted_audio = {
			name: 'sound.ogg',
			blob: audio_stream
		};
		const crop = get_crop();
		if (crop) {
			export_settings.crop = crop;
		}
		const video_blob = await extract(
			ffmpeg,
			{
				name: current_file.name,
				blob: current_file
			},
			{
				...export_settings,
				trim: {
					start: video_data.start_progress * video_data.duration,
					end: video_data.end_progress * video_data.duration
				},
				crop: get_crop()
			},
			message_manager,
			'video'
		).catch((error) => {
			message_manager.error(error.message);
			return null;
		});
		if (!video_blob) {
			message_manager.error('Failed to process video file.');
			return;
		}
		const filename = current_file.name.replace(/\.[^/.]+$/, '');
		export_result = {
			name: filename,
			blob: video_blob
		};
		message_manager.log('Audio and video split successfully.');
		message_manager.log(`Final video: ${export_result.name} (${export_result.blob.size} bytes)`);
		current_state = 'finished';
	}

	function get_complete_filename(): string {
		try {
			new URL(audio_url);
			return `${export_result.name}[sound=${encodeURIComponent(audio_url)}].${export_settings.output_format}`;
		} catch (_) {
			return `${export_result.name}.${export_settings.output_format}`;
		}
	}
</script>

<Filepicker bind:current_file accept_image={false} show_preview={false} />

{#if current_file}
	{#if current_state === 'ready'}
		<section class="flash px-2 bd-muted">
			<div class="media-container">
				<video
					bind:this={video}
					src={URL.createObjectURL(current_file)}
					{ondurationchange}
					{onresize}
				>
					Your browser does not support the video tag.
				</video>
				<CanvasController {video} />
			</div>
			<section>
				<Seekbar {video_data} {on_seek} {on_start_seek} {on_end_seek} {on_release} />
				<VideoControls {video} {video_data} />
			</section>
		</section>
		{#if get_crop().width > 2048 || get_crop().height > 2048}
			<div class="flash accent">
				<p>
					<Info /> The cropped video exceeds the maximum resolution of 2048x2048 pixels and will be scaled
					down.
				</p>
			</div>
		{/if}
		<Restrictions {video_data} {export_settings} />
		<FfmpegExportSettings file_name={current_file.name} bind:export_settings />
		<button
			onclick={() => {
				split();
			}}
			type="submit">Split</button
		>
	{:else}
		<Log {message_manager} {ffmpeg_manager} />
		{#if current_state === 'finished'}
			<div class="flash bd-muted">
				<p><b>Extracted audio</b></p>
				<audio src={URL.createObjectURL(extracted_audio.blob)} controls />
				<div class="flash muted">
					<p>
						Optional: Upload the audio file to a hosting service and paste the link here to generate
						the video filename with [sound=URL] tag.
					</p>
					<input type="text" placeholder="https://example.com/sound.ogg" bind:value={audio_url} />
				</div>
				<p><b>Video result</b></p>
				<video src={URL.createObjectURL(export_result.blob)} controls />
				{#if audio_url != ''}
					<div class="flash muted">
						<p>Complete filename</p>
						<div class="flex" style="gap:1rem">
							<input type="text" value={get_complete_filename()} />
							<input
								type="button"
								style="flex-basis:max-content"
								onclick={() => {
									navigator.clipboard.writeText(get_complete_filename());
								}}
								value="Copy"
							/>
						</div>
					</div>
				{/if}
				<p>
					<a
						href={URL.createObjectURL(export_result.blob)}
						download={get_complete_filename()}
						title="Download processed video"><button>Download</button></a
					>
				</p>
			</div>
		{/if}
	{/if}
{:else}
	<div class="flash bg-muted bd-muted">
		<p><b class="default">Instructions</b></p>
		<p>
			Upload a video, trim it and crop it.<br />Click on 'split' to split the audio and video into
			separate files.<br />
			The video file will be resized to fit within the 2048x2048 requirements if it's too large.<br
			/>
		</p>
	</div>
{/if}

<style>
</style>
