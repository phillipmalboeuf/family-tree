<template>
	<div class="test-page scroll-container">
		<main>
			<div class="content-split">
			<h1>Family Tree Test Page</h1>
			<p class="test-meta">{{ generationCount }} generations (root → deepest descendant)</p>
			<FamilyTreeChart :person-data="testData" />
			<DownloadPdf />
		</div>
		</main>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FamilyTreeChart from './FamilyTreeChart.vue';
import DownloadPdf from './DownloadPdf.vue';

const GENERATION_COUNT = 20;

function buildDeepFamilyTree(generations: number) {
	const persons: Record<number, Record<string, unknown>> = {};

	for (let n = 1; n <= generations; n++) {
		persons[n] = {
			id: `gen-${n}`,
			first_name: `Generation ${n}`,
			last_name: 'Test',
			father: n > 1 ? `gen-${n - 1}` : null,
			mother: null,
			marriages: [],
			children_father: [],
			children_mother: [],
			_all_children: [],
		};
	}

	for (let n = 1; n < generations; n++) {
		const child = persons[n + 1];
		persons[n].children_father = [child];
		persons[n]._all_children = [child];
	}

	return persons[1];
}

export default defineComponent({
	name: 'TestPage',
	components: {
		FamilyTreeChart,
		DownloadPdf,
	},
	setup() {
		const testData = buildDeepFamilyTree(GENERATION_COUNT);

		return {
			testData,
			generationCount: GENERATION_COUNT,
		};
	},
});
</script>

<style scoped>
.test-page {
	padding: 20px;
	width: 100%;
	height: 100vh;
}

.content-split,
.scroll-container {
	overflow: auto;
	block-size: 300px;
	inline-size: 100%;
	position: relative;
}

.test-page h1 {
	margin-bottom: 20px;
}

.test-meta {
	margin: 0 0 20px;
	color: var(--theme--foreground-subdued, #666);
}
</style>
