<template>
	<table class="family-tree-table" :class="'level-' + level">
		<tr class="person-spouses-row">
			<td class="person-cell">
				<div class="person-card">
					<div class="person-name">{{ getPersonName(person) }}</div>
				</div>
			</td>
			<td v-for="spouse in getSpouses(person)" :key="spouse.id" class="spouse-cell">
				<FamilyTreeNode :person="spouse" :level="level + 1" />
			</td>
		</tr>
		<tr v-if="getChildren(person).length > 0" class="children-row">
			<td :colspan="getSpouses(person).length + 1" class="children-cell">
				<table class="children-table">
					<tr>
						<td v-for="child in getChildren(person)" :key="child.id" class="child-cell">
							<FamilyTreeNode :person="child" :level="level + 1" />
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
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

const props = defineProps({
	person: {
		type: Object as PropType<Person>,
		required: true,
	},
	level: {
		type: Number,
		default: 0,
	},
});

function getPersonName(person: Person | null): string {
	if (!person) return 'Unknown';
	return (
		person.name ||
		`${person.first_name || ''} ${person.last_name || ''}`.trim() ||
		`Person ${person.id}`
	);
}

function getSpouses(person: Person): Person[] {
	const spouses: Person[] = [];
	if (person.marriages && Array.isArray(person.marriages)) {
		person.marriages.forEach((marriage: any) => {
			if (marriage.spouses && Array.isArray(marriage.spouses)) {
				marriage.spouses.forEach((spouse: any) => {
					// Skip if already visited or if it's the same person
					if (spouse && spouse.id && 
						String(spouse.id) !== String(person.id) &&
						!(spouse._loaded === false && spouse._reason === 'already_visited')) {
						spouses.push(spouse);
					}
				});
			}
		});
	}
	return spouses;
}

function getChildren(person: Person): Person[] {
	const children: Person[] = [];
	const visited = new Set<string>();

	// Get children from _all_children if available
	if (person._all_children && Array.isArray(person._all_children)) {
		person._all_children.forEach((child: any) => {
			// Skip if already visited
			if (child && child.id && 
				!(child._loaded === false && child._reason === 'already_visited')) {
				const childId = String(child.id);
				if (!visited.has(childId)) {
					visited.add(childId);
					children.push(child);
				}
			}
		});
	}

	// Also check children_father and children_mother
	if (children.length === 0) {
		const fatherChildren = person.children_father || [];
		const motherChildren = person.children_mother || [];
		
		[...fatherChildren, ...motherChildren].forEach((child: any) => {
			const childId = String(child?.id || child);
			// Skip if already visited
			if (childId && !visited.has(childId) && 
				!(child?._loaded === false && child?._reason === 'already_visited')) {
				visited.add(childId);
				children.push(child);
			}
		});
	}

	return children;
}
</script>

<style scoped>
.family-tree-table {
	border-collapse: separate;
  border: 1px solid;
}

.person-cell {
	text-align: center;
	vertical-align: top;
}

.spouses-row {
	vertical-align: top;
}

.spouse-cell {
	text-align: center;
	vertical-align: top;
}

.children-cell {
	text-align: center;
	vertical-align: top;
}

.children-table {
	width: 100%;
	border-collapse: separate;
}

.child-cell {
	text-align: center;
	vertical-align: top;
}
</style>
