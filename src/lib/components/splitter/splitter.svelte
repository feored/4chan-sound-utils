<script module lang="ts">
	export interface VideoData {
		progress: number;
		current_time: number;
		duration: number;
		start_progress: number;
		end_progress: number;
	}
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
	import type { ExportSettings, Stream } from '$lib/ffmpeg/types';
	import { FFmpegManager } from '$lib/ffmpeg/ffmpeg.svelte';
	import { extract } from '$lib/ffmpeg/scripts/extract';
	import { onMount } from 'svelte';

	let current_file: File | null = $state(null);
	let video: HTMLVideoElement | null = $state(null);
	let video_data: VideoData = $state(default_video_data);
	let last_seek_preview: boolean = $state(false); // if the last seek was previewing the image (not actually seeking to that time)
	const message_manager = new MessageManager();
	const ffmpeg_manager = new FFmpegManager();
	let current_state: 'ready' | 'loading' | 'finished' = $state('ready');
	let valid: boolean = $state(false); // Valid video uploadable to 4chan
	let export_settings: ExportSettings = $state({
		output_format: 'mp4',
		settings: {
			preset: 'fast',
			tune: 'none',
			bitrate: 2048 // Default bitrate in Kbits/s
		}
	});

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

	let final_stream: Stream = $state({
		name: '',
		blob: new Blob()
	});

	function on_start_seek(progress: number, preview = false) {
		video_data.start_progress = progress;
		if (video_data.start_progress > video_data.end_progress) {
			video_data.end_progress = video_data.start_progress + 0.05;
		}
		if (!video) return;
		if (preview) {
			video.currentTime = progress * video.duration;
			last_seek_preview = true;
		}
		if (video_data.progress < video_data.start_progress) {
			video_data.progress = video_data.start_progress;
		}
	}

	function on_end_seek(progress: number, preview = false) {
		video_data.end_progress = progress;
		if (video_data.end_progress < video_data.start_progress) {
			video_data.start_progress = video_data.end_progress - 0.05;
		}
		if (!video) return;
		if (preview) {
			video.currentTime = progress * video.duration;
			last_seek_preview = true;
		}
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
		last_seek_preview = false;
	}

	function ondurationchange() {
		if (!video) return;
		video_data.duration = video.duration;
	}

	function ontimeupdate(_event: Event) {
		if (!video) return;
		if (last_seek_preview) {
			last_seek_preview = false;
			return;
		}
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

	async function upload_file(file: File): Promise<string | null> {
		const form_data = new FormData();
		form_data.append('reqtype', 'fileupload');
		form_data.append('fileToUpload', file);
		message_manager.log(`Uploading audio: ${file.name}...`);

		try {
			const response = await fetch('https://catbox.moe/user/api.php', {
				method: 'POST',
				// Set the FormData instance as the request body
				body: form_data
			});
			let resp = await response.text();
			message_manager.log(resp, 'upload_audio_response');
			return resp;
		} catch (e) {
			console.error(e);
			return null;
		}
	}

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
				}
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
		let audio_url = await upload_file(new File([audio_stream], 'extracted_audio.ogg'));
		//let audio_url = 'https://files.catbox.moe/ijpeep.mp3';
		if (!audio_url) {
			message_manager.error('Failed to upload audio file.');
			return;
		}
		audio_url = encodeURIComponent(audio_url);
		const export_settings: ExportSettings = {
			output_format: 'webm',
			trim: {
				start: video_data.start_progress * video_data.duration,
				end: video_data.end_progress * video_data.duration
			},
			settings: {
				bitrate: 2048
			}
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
			export_settings,
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

		final_stream = {
			name: current_file.name.replace(/\.[^/.]+$/, '') + `[sound=${audio_url}].webm`,
			blob: video_blob
		};
		message_manager.log('Audio and video split successfully.');
		message_manager.log(`Final video: ${final_stream.name} (${final_stream.blob.size} bytes)`);
		current_state = 'finished';

		//let extension = await get_sound_extension({ name: current_file.name, blob: current_file });
		//console.log('Sound extension:', extension);
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
				<Seekbar {video_data} {on_seek} {on_start_seek} {on_end_seek} />
				<VideoControls {video} {video_data} />
			</section>
		</section>
		<Restrictions
			{video_data}
			{valid}
			{export_settings}
			dimensions={{ width: get_crop()?.width || 0, height: get_crop()?.height || 0 }}
		/>
		<FfmpegExportSettings file_name={current_file.name} bind:export_settings />
		<button
			onclick={() => {
				split();
			}}>Split</button
		>
	{:else}
		<Log {message_manager} {ffmpeg_manager} />
		{#if current_state === 'finished'}
			<a
				href={URL.createObjectURL(final_stream.blob)}
				download={final_stream.name}
				title="Download processedvideo"><button>Download</button></a
			>
		{/if}
	{/if}
{:else}
	<div class="flash bg-muted bd-muted">
		<p><b class="default">Instructions</b></p>
		<p>
			Upload a video, trim it and crop it.<br />This tool will then split the audio and video into
			separate files.<br />
			The audio file will automatically be uploaded to one of several hosts, with the URL embedded in
			the video's filename.
		</p>
	</div>
{/if}

<style>
</style>
