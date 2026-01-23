<template>
	<div class="family-tree-chart">
		<FamilyTreeNode :person="personData" :level="0" />
	</div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import FamilyTreeNode from './FamilyTreeNode.vue';

interface Person {
	id: string;
	first_name?: string;
	last_name?: string;
	name?: string;
	marriages?: any[];
	children_father?: any[];
	children_mother?: any[];
	_all_children?: any[];
	[key: string]: any;
}

defineProps({
	personData: {
		type: Object as PropType<Person>,
		required: true,
	},
});
</script>

<style scoped>
.family-tree-chart {
	width: 100%;
	overflow-x: auto;
	padding: 20px;
}
</style>
