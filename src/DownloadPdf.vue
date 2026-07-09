<template>
	<div ref="actionsRef" class="pdf-actions">
		<button type="button" class="button button-secondary" :disabled="downloading" @click="downloadPdf">
			{{ downloading ? 'Generating PDF…' : 'Download PDF' }}
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import html2pdf from 'html2pdf.js';

const props = withDefaults(
	defineProps<{
		selector?: string;
		filename?: string;
	}>(),
	{
		selector: 'main',
		filename: 'family-tree.pdf',
	}
);

const actionsRef = ref<HTMLElement | null>(null);
const downloading = ref(false);

function prepareMainForPdf(main: Element): () => void {
	const restores: Array<() => void> = [];

	const contentSplit = main.querySelector<HTMLElement>('.content-split');
	if (contentSplit) {
		const previousBlockSize = contentSplit.style.blockSize;
		contentSplit.style.blockSize = 'auto';
		restores.push(() => {
			contentSplit.style.blockSize = previousBlockSize;
		});
	}

	main.querySelectorAll<HTMLElement>('.button').forEach((button) => {
		const previousDisplay = button.style.display;
		button.style.display = 'none';
		restores.push(() => {
			button.style.display = previousDisplay;
		});
	});

	return () => {
		for (const restore of restores.reverse()) {
			restore();
		}
	};
}

async function downloadPdf() {
	const target = actionsRef.value?.closest(props.selector);
	if (!target || downloading.value) return;

	downloading.value = true;
	const restoreMain = prepareMainForPdf(target);

	try {
		await html2pdf()
			.set({
				margin: 10,
				filename: props.filename,
				image: { type: 'jpeg', quality: 0.98 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { format: 'letter', orientation: 'portrait' },
			})
			.from(target as HTMLElement)
			.save();
	} finally {
		restoreMain();
		downloading.value = false;
	}
}
</script>

<style scoped>
.pdf-actions {
	margin-top: 16px;
}
</style>
