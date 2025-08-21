<script module lang="ts">
	export type DialogState = {
		open: boolean;
		title: string;
		content: string;
		on_close?: () => void;
	};

	let dialog_state: DialogState = $state({
		open: false,
		title: '',
		content: '',
		on_close: undefined
	});

	export function dialog_open(title: string, content: string, on_close?: () => void): void {
		dialog_state = {
			open: true,
			title: title,
			content: content,
			on_close: on_close
		};
	}
</script>

<script lang="ts">
	let dialog = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (dialog && dialog_state.open) {
			dialog.showModal();
		}
	});
</script>

<dialog bind:this={dialog}>
	<header>
		<h2>{dialog_state.title}</h2>
	</header>

	<p>
		{dialog_state.content}
	</p>
	<footer>
		<form method="dialog">
			<button onclick={() => dialog_state.on_close?.()} type="submit">Close</button>
		</form>
	</footer>
</dialog>

<style>
	dialog {
		min-width: min(calc(100% - 4rem), 640px);
	}
</style>
