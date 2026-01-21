<template>
	<div class="family-tree-interface">
		<div v-if="loading" class="loading">
			Loading family tree...
		</div>
		<div v-else-if="error" class="error">
			{{ error }}
		</div>
		<div v-else-if="person" class="tree-container">
			<family-node
				:person="person"
				:children="children"
				:spouses="spouses"
				:level="0"
				:collection="collection"
				:api="api"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, inject, getCurrentInstance, computed } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';

interface Person {
	id: string;
	name?: string;
	first_name?: string;
	last_name?: string;
	children_father?: any[];
	children_mother?: any[];
	married_to?: any[];
	[key: string]: any;
}

const FamilyNode = defineComponent({
	name: 'FamilyNode',
	props: {
		person: {
			type: Object as () => Person,
			required: true,
		},
		children: {
			type: Array as () => Person[],
			default: () => [],
		},
		spouses: {
			type: Array as () => Person[],
			default: () => [],
		},
		level: {
			type: Number,
			default: 0,
		},
		collection: {
			type: String,
			required: true,
		},
		api: {
			type: Object,
			required: true,
		},
	},
	setup() {
		function getPersonName(person: Person | null): string {
			if (!person) return 'Unknown';
			return (
				person.name ||
				`${person.first_name || ''} ${person.last_name || ''}`.trim() ||
				'Unnamed'
			);
		}

		function getChildChildren(child: Person): Person[] {
			const fatherChildren = child.children_father || [];
			const motherChildren = child.children_mother || [];
			const allChildren: Person[] = [];
			const seenIds = new Set<string>();

			[...fatherChildren, ...motherChildren].forEach((c: any) => {
				const id = typeof c === 'string' ? c : c?.id;
				if (id && !seenIds.has(id)) {
					seenIds.add(id);
					allChildren.push(typeof c === 'string' ? { id: c } : c);
				}
			});

			return allChildren;
		}

		function getChildSpouses(child: Person): Person[] {
			return child.married_to || [];
		}

		return {
			getPersonName,
			getChildChildren,
			getChildSpouses,
		};
	},
	template: `
		<div class="family-node" :class="'level-' + level">
			<div class="person-card">
				<div class="person-name">{{ getPersonName(person) }}</div>
				<div v-if="spouses.length > 0" class="spouses">
					<span class="label">Spouse(s):</span>
					<span v-for="(spouse, idx) in spouses" :key="spouse?.id || idx" class="spouse">
						{{ getPersonName(spouse) }}{{ idx < spouses.length - 1 ? ', ' : '' }}
					</span>
				</div>
			</div>
			<div v-if="children.length > 0" class="children">
				<family-node
					v-for="child in children"
					:key="child?.id || child"
					:person="typeof child === 'string' ? { id: child } : child"
					:children="getChildChildren(typeof child === 'string' ? { id: child } : child)"
					:spouses="getChildSpouses(typeof child === 'string' ? { id: child } : child)"
					:level="level + 1"
					:collection="collection"
					:api="api"
				/>
			</div>
		</div>
	`,
});

export default defineComponent({
	name: 'FamilyTreeInterface',
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	components: {
		FamilyNode,
	},
	setup(_props, { attrs }) {
		const api = useApi();
		const stores = useStores();
		const instance = getCurrentInstance();
		
		const person = ref<Person | null>(null);
		const loading = ref(true);
		const error = ref<string | null>(null);
		const children = ref<Person[]>([]);
		const spouses = ref<Person[]>([]);
		const collection = ref<string>('');

		// Try to get collection and primary key from various sources
		const currentCollection = inject<string>('collection', null);
		const primaryKey = inject<string | number>('primaryKey', null);
		
		// Try to get from route if available
		const route = instance?.appContext.config.globalProperties.$route;
		
		// Extract collection and primary key from route if available
		const routeCollection = computed(() => {
			if (route?.params?.collection) {
				return route.params.collection as string;
			}
			return null;
		});
		
		const routePrimaryKey = computed(() => {
			if (route?.params?.primaryKey) {
				return route.params.primaryKey as string | number;
			}
			return null;
		});

		async function loadFamilyTree() {
			try {
				loading.value = true;
				error.value = null;

				// Get collection and primary key - try multiple sources
				let itemCollection: string | null = null;
				let itemPrimaryKey: string | number | null = null;

				// Priority 1: Try from stores (most reliable)
				if (stores) {
					try {
						const itemStore = stores.useItemStore?.();
						if (itemStore?.collection) itemCollection = itemStore.collection;
						if (itemStore?.primaryKey) itemPrimaryKey = itemStore.primaryKey;
					} catch (err) {
						console.warn('Could not access itemStore:', err);
					}
				}

				// Priority 2: Try from inject
				if (!itemCollection && currentCollection) itemCollection = currentCollection;
				if (!itemPrimaryKey && primaryKey) itemPrimaryKey = primaryKey;

				// Priority 3: Try from route
				if (!itemCollection && routeCollection.value) itemCollection = routeCollection.value;
				if (!itemPrimaryKey && routePrimaryKey.value) itemPrimaryKey = routePrimaryKey.value;

				// Priority 4: Try from attrs
				if (!itemCollection && attrs?.collection) itemCollection = attrs.collection as string;
				if (!itemPrimaryKey && attrs?.primaryKey) itemPrimaryKey = attrs.primaryKey as string | number;

				// Priority 5: Try parsing from window location
				if (!itemCollection || !itemPrimaryKey) {
					const path = window.location.pathname;
					const pathMatch = path.match(/\/content\/([^\/]+)\/([^\/]+)/);
					if (pathMatch) {
						if (!itemCollection) itemCollection = pathMatch[1];
						if (!itemPrimaryKey) itemPrimaryKey = pathMatch[2];
					}
				}

				if (!itemCollection) {
					throw new Error('No collection available. Make sure you are viewing a Person item.');
				}

				if (!itemPrimaryKey) {
					throw new Error('No primary key available. Make sure you are viewing a Person item.');
				}

				collection.value = itemCollection;

				// Fetch the current Person with related data
				const response = await api.get(`/items/${itemCollection}/${itemPrimaryKey}`, {
					params: {
						fields: [
							'*',
							'children_father.*',
							'children_mother.*',
							'married_to.*',
						],
					},
				});

				person.value = response.data.data;

				// Merge children from both father and mother relations
				const fatherChildren = person.value.children_father || [];
				const motherChildren = person.value.children_mother || [];
				
				// Create a set to avoid duplicates
				const childrenIds = new Set<string>();
				const allChildren: Person[] = [];

				[...fatherChildren, ...motherChildren].forEach((child: any) => {
					const childId = typeof child === 'string' ? child : child?.id;
					if (childId && !childrenIds.has(childId)) {
						childrenIds.add(childId);
						allChildren.push(typeof child === 'string' ? { id: child } : child);
					}
				});

				// Load full details for children if they're just IDs
				children.value = await Promise.all(
					allChildren.map(async (child) => {
						if (child.id && Object.keys(child).length === 1) {
							try {
								const childResponse = await api.get(`/items/${itemCollection}/${child.id}`, {
									params: {
										fields: [
											'*',
											'children_father.*',
											'children_mother.*',
											'married_to.*',
										],
									},
								});
								return childResponse.data.data;
							} catch {
								return child;
							}
						}
						return child;
					})
				);

				// Load spouses
				const spouseIds = person.value.married_to || [];
				if (spouseIds.length > 0) {
					const spousePromises = spouseIds.map(async (spouseId: string | Person) => {
						if (typeof spouseId === 'object' && spouseId.id && Object.keys(spouseId).length > 1) {
							return spouseId;
						}
						const id = typeof spouseId === 'string' ? spouseId : spouseId?.id;
						if (id) {
							try {
								const spouseResponse = await api.get(`/items/${itemCollection}/${id}`);
								return spouseResponse.data.data;
							} catch {
								return typeof spouseId === 'string' ? { id: spouseId } : spouseId;
							}
						}
						return spouseId;
					});
					spouses.value = await Promise.all(spousePromises);
				} else {
					spouses.value = [];
				}
			} catch (err: any) {
				console.error('Error loading family tree:', err);
				error.value = err?.response?.data?.errors?.[0]?.message || err.message || 'Failed to load family tree';
			} finally {
				loading.value = false;
			}
		}

		// Watch for changes to the item
		watch(
			() => [primaryKey, currentCollection, routePrimaryKey.value, routeCollection.value],
			() => {
				loadFamilyTree();
			},
			{ immediate: true }
		);

		onMounted(() => {
			loadFamilyTree();
		});

		return {
			person,
			loading,
			error,
			children,
			spouses,
			collection,
			api,
		};
	},
});
</script>

<style scoped>
.family-tree-interface {
	padding: 20px;
	min-height: 200px;
}

.loading,
.error {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 20px;
}

.error {
	color: var(--theme--danger);
}

.tree-container {
	width: 100%;
}

.family-node {
	position: relative;
	padding: 10px 0;
}

.person-card {
	background: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color-subdued);
	border-radius: 8px;
	padding: 15px;
	margin: 10px 0;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.person-name {
	font-weight: 600;
	font-size: 16px;
	margin-bottom: 8px;
	color: var(--theme--foreground);
}

.spouses {
	font-size: 14px;
	color: var(--theme--foreground-subdued);
	margin-top: 8px;
}

.label {
	font-weight: 500;
	margin-right: 5px;
}

.children {
	margin-left: 40px;
	border-left: 2px solid var(--theme--border-color-subdued);
	padding-left: 20px;
	position: relative;
	margin-top: 10px;
}

.children::before {
	content: '';
	position: absolute;
	left: -2px;
	top: -10px;
	width: 2px;
	height: 10px;
	background: var(--theme--border-color-subdued);
}

.children::after {
	content: '';
	position: absolute;
	left: -2px;
	bottom: 0;
	width: 2px;
	height: 10px;
	background: var(--theme--background);
}

.family-node:last-child .children::after {
	display: none;
}

.family-node.level-0 .person-card {
	background: var(--theme--primary-background);
	border-color: var(--theme--primary);
	border-width: 2px;
}
</style>
