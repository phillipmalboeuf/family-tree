<template>
	<div class="family-tree-interface">
		<div v-if="loading" class="loading">Loading family tree...</div>
		<div v-else-if="error" class="error">{{ error }}</div>
		<FamilyTreeChart v-else-if="personData" :person-data="personData" />
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, inject, getCurrentInstance, computed } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import FamilyTreeChart from './FamilyTreeChart.vue';

export default defineComponent({
	name: 'FamilyTreeInterface',
	components: {
		FamilyTreeChart,
	},
	props: {
		value: {
			type: String,
			default: null,
		},
	},
	setup(_props, { attrs }) {
		const api = useApi();
		const stores = useStores();
		const instance = getCurrentInstance();
		
		const loading = ref(true);
		const error = ref<string | null>(null);
		const personData = ref<any>(null);

		// Recursive function to load a person with all their relationships
		async function loadPersonRecursive(
			personId: string | number,
			visitedPersons: Set<string>,
			visitedMarriages: Set<number>,
			marriageToPersonsMap: Map<number, any[]>,
			depth: number = 0,
			maxDepth: number = 5
		): Promise<any> {
			const personIdStr = String(personId);
			
			// Prevent infinite loops and limit depth
			if (visitedPersons.has(personIdStr) || depth > maxDepth) {
				return { id: personIdStr, _loaded: false, _reason: visitedPersons.has(personIdStr) ? 'already_visited' : 'max_depth' };
			}
			
			visitedPersons.add(personIdStr);

			try {
				// Load person with basic relationships
				const response = await api.get(`/items/persons/${personId}`, {
					params: {
						fields: [
							'*',
							'children_father.id',
							'children_mother.id',
							'marriages.*',
						],
					},
				});

				const person = response.data.data;
				if (!person) {
					return { id: personIdStr, _error: 'not_found' };
				}


				// Recursively load marriages
				const marriages = person.marriages || [];
				const loadedMarriages = await Promise.all(
					marriages.map(async (marriage: any) => {
						// The marriage object from persons.marriages.* is a junction table entry
						// It has: id (junction ID), marriages_id (actual marriage ID), persons_id
						// We need to use marriages_id, not id
						const actualMarriageId = marriage?.marriages_id || marriage?.id || marriage;
						
						if (!actualMarriageId) {
							return marriage;
						}

						// Check if we've already visited this marriage
						const marriageIdNum = Number(actualMarriageId);
						if (visitedMarriages.has(marriageIdNum)) {
							return marriage;
						}
						visitedMarriages.add(marriageIdNum);

						// Work with the marriage data we already have from the person's relationship
						// Don't try to fetch from /items/marriages as we may not have permission
						const fullMarriage = marriage;

						// Query the marriages_persons junction table to get all persons in this marriage
						// Use the actual marriage ID (marriages_id), not the junction table ID
						let spouses: any[] = [];
						
						try {
							// Query the junction table directly using marriages_id (the actual marriage ID)
							const junctionResponse = await api.get('/items/marriages_persons', {
								params: {
									filter: {
										marriages_id: {
											_eq: marriageIdNum
										}
									},
									fields: ['persons_id'],
								},
							});
							
							const junctionEntries = junctionResponse.data.data || [];
							
							// Get ALL person IDs from the junction table (including current person)
							const allPersonIds = junctionEntries.map((entry: any) => entry.persons_id).filter((id: any) => id);
							
							// Filter out the current person to get spouse IDs
							const spouseIds = allPersonIds.filter((id: any) => String(id) !== String(personId));
							
							// Load the spouse person data
							if (spouseIds.length > 0) {
								const spousesResponse = await api.get('/items/persons', {
									params: {
										filter: {
											id: {
												_in: spouseIds
											}
										},
										fields: ['id', 'first_name', 'last_name'],
									},
								});
								
								spouses = spousesResponse.data.data || [];
							}
						} catch (err: any) {
							// If junction table query fails, try using the spouses array from marriage if it exists
							if (fullMarriage.spouses && Array.isArray(fullMarriage.spouses)) {
								// The spouses array contains junction table IDs, so query those
								const junctionIds = fullMarriage.spouses.filter((id: any) => id);
								if (junctionIds.length > 0) {
									try {
										const junctionResponse = await api.get('/items/marriages_persons', {
											params: {
												filter: {
													id: {
														_in: junctionIds
													}
												},
												fields: ['persons_id'],
											},
										});
										
										const junctionEntries = junctionResponse.data.data || [];
										const spouseIds = junctionEntries
											.map((entry: any) => entry.persons_id)
											.filter((id: any) => id && String(id) !== String(personId));
										
										if (spouseIds.length > 0) {
											const spousesResponse = await api.get('/items/persons', {
												params: {
													filter: {
														id: {
															_in: spouseIds
														}
													},
													fields: ['id', 'first_name', 'last_name'],
												},
											});
											
											spouses = spousesResponse.data.data || [];
										}
									} catch (err2: any) {
										// Fallback failed too
									}
								}
							}
						}

						// Load all spouses recursively
						const loadedSpouses = await Promise.all(
							spouses.map(async (spouse: any) => {
								const spouseId = spouse?.id || spouse;
								if (!spouseId) return spouse;
								
								// Load spouse recursively (will handle both ID and full object cases)
								return await loadPersonRecursive(spouseId, visitedPersons, visitedMarriages, marriageToPersonsMap, depth + 1, maxDepth);
							})
						);

						return {
							...fullMarriage,
							spouses: loadedSpouses,
						};
					})
				);

				// Recursively load children
				const fatherChildren = person.children_father || [];
				const motherChildren = person.children_mother || [];
				const allChildIds = new Set<string>();
				
				[...fatherChildren, ...motherChildren].forEach((child: any) => {
					const childId = child?.id || child;
					if (childId) {
						allChildIds.add(String(childId));
					}
				});

				const loadedChildren = await Promise.all(
					Array.from(allChildIds).map(async (childId) => {
						return await loadPersonRecursive(childId, visitedPersons, visitedMarriages, marriageToPersonsMap, depth + 1, maxDepth);
					})
				);

				return {
					...person,
					marriages: loadedMarriages,
					children_father: loadedChildren.filter((child: any) => {
						return fatherChildren.some((fc: any) => {
							const fcId = fc?.id || fc;
							return String(fcId) === String(child?.id);
						});
					}),
					children_mother: loadedChildren.filter((child: any) => {
						return motherChildren.some((mc: any) => {
							const mcId = mc?.id || mc;
							return String(mcId) === String(child?.id);
						});
					}),
					_all_children: loadedChildren,
				};
			} catch (err: any) {
				console.error(`Error loading person ${personId}:`, err);
				return { id: personIdStr, _error: err?.message || 'load_failed' };
			}
		}

		// Try to get collection and primary key from various sources
		const currentCollection = inject<string | null>('collection', null);
		const primaryKey = inject<string | number | null>('primaryKey', null);
		
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
					throw new Error('No collection available. Make sure you are viewing a Person or Family item.');
				}

				if (!itemPrimaryKey) {
					throw new Error('No primary key available. Make sure you are viewing a Person or Family item.');
				}

				// If viewing a Family item, get the source_person from it first
				let sourcePersonId: string | number | null = null;
				if (itemCollection === 'family') {
					const familyResponse = await api.get(`/items/family/${itemPrimaryKey}`, {
						params: {
							fields: ['*', 'source_person'],
						},
					});
					
					const familyData = familyResponse.data.data;
					if (familyData?.source_person) {
						sourcePersonId = typeof familyData.source_person === 'object' 
							? familyData.source_person.id 
							: familyData.source_person;
					} else {
						throw new Error('Family item does not have a source_person set.');
					}
				} else {
					// If viewing a Person directly, use that person's ID
					sourcePersonId = itemPrimaryKey;
				}

				if (!sourcePersonId) {
					throw new Error('No source person available.');
				}

				// Create visited sets for this load to prevent infinite loops
				const visitedPersons = new Set<string>();
				const visitedMarriages = new Set<number>();

				// Build a map of marriage IDs to persons for finding spouses
				// Query all persons with their marriages to build this map once
				const marriageToPersonsMap = new Map<number, any[]>();
				try {
					const allPersonsResponse = await api.get('/items/persons', {
						params: {
							fields: ['id', 'first_name', 'last_name', 'marriages.id'],
							limit: 1000,
						},
					});
					
					const allPersons = allPersonsResponse.data.data || [];
					
					// Build map: marriageId -> [persons in that marriage]
					allPersons.forEach((p: any) => {
						const personMarriages = p.marriages || [];
						personMarriages.forEach((m: any) => {
							const mId = m?.id || m;
							if (mId) {
								const marriageId = Number(mId);
								if (!marriageToPersonsMap.has(marriageId)) {
									marriageToPersonsMap.set(marriageId, []);
								}
								marriageToPersonsMap.get(marriageId)!.push(p);
							}
						});
					});
				} catch (err) {
					console.warn('Failed to build marriage map:', err);
				}

				// Recursively load the person and all their relationships
				const person = await loadPersonRecursive(sourcePersonId, visitedPersons, visitedMarriages, marriageToPersonsMap, 0, 5);

				if (!person || person._error) {
					throw new Error('Failed to load person data.');
				}

				// Store person data for chart rendering
				personData.value = person;
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
			loading,
			error,
			personData,
		};
	},
});
</script>

<style scoped>
.family-tree-interface {
	width: 100%;
	height: 100%;
	min-height: 600px;
	padding: 20px;
}

.loading,
.error {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40px;
}

.error {
	color: var(--theme--danger);
}

</style>
