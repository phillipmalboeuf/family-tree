<template>
	<div class="test-page">
		<h1>Family Tree Test Page</h1>
		<FamilyTreeChart :person-data="testData" />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FamilyTreeChart from './FamilyTreeChart.vue';

export default defineComponent({
	name: 'TestPage',
	components: {
		FamilyTreeChart,
	},
	setup() {
		const testData = {
			"id": "547282dd-fb1c-47c4-b814-2e197a88d145",
			"first_name": "Paul",
			"last_name": "Malboeuf",
			"father": null,
			"mother": null,
			"marriages": [
				{
					"id": 7,
					"marriages_id": 3,
					"persons_id": "547282dd-fb1c-47c4-b814-2e197a88d145",
					"spouses": [
						{
							"id": "3d7747c8-39e5-45b2-b544-1e7f146f392d",
							"first_name": "Diane",
							"last_name": "Malboeuf",
							"father": null,
							"mother": null,
							"marriages": [
								{
									"id": 6,
									"marriages_id": 3,
									"persons_id": "3d7747c8-39e5-45b2-b544-1e7f146f392d"
								}
							],
							"children_father": [],
							"children_mother": [
								{
									"id": "6dc55ba3-a9ee-4210-b52b-55ec391f8a96",
									"first_name": "Phillip",
									"last_name": "Malboeuf",
									"father": "547282dd-fb1c-47c4-b814-2e197a88d145",
									"mother": "3d7747c8-39e5-45b2-b544-1e7f146f392d",
									"marriages": [
										{
											"id": 5,
											"marriages_id": 2,
											"persons_id": "6dc55ba3-a9ee-4210-b52b-55ec391f8a96",
											"spouses": [
												{
													"id": "028eb5ee-0d15-4844-a629-eea214e277e8",
													"first_name": "Marta",
													"last_name": "Wilson",
													"father": null,
													"mother": null,
													"marriages": [
														{
															"id": 4,
															"marriages_id": 2,
															"persons_id": "028eb5ee-0d15-4844-a629-eea214e277e8"
														}
													],
													"children_father": [],
													"children_mother": [
														{
															"id": "84a44025-b110-48b6-bb69-d24dae884264",
															"first_name": "Oreo",
															"last_name": "Dog",
															"father": null,
															"mother": "028eb5ee-0d15-4844-a629-eea214e277e8",
															"marriages": [],
															"children_father": [],
															"children_mother": [],
															"_all_children": []
														}
													],
													"_all_children": [
														{
															"id": "84a44025-b110-48b6-bb69-d24dae884264",
															"first_name": "Oreo",
															"last_name": "Dog",
															"father": null,
															"mother": "028eb5ee-0d15-4844-a629-eea214e277e8",
															"marriages": [],
															"children_father": [],
															"children_mother": [],
															"_all_children": []
														}
													]
												}
											]
										}
									],
									"children_father": [],
									"children_mother": [],
									"_all_children": []
								}
							],
							"_all_children": [
								{
									"id": "6dc55ba3-a9ee-4210-b52b-55ec391f8a96",
									"first_name": "Phillip",
									"last_name": "Malboeuf",
									"father": "547282dd-fb1c-47c4-b814-2e197a88d145",
									"mother": "3d7747c8-39e5-45b2-b544-1e7f146f392d",
									"marriages": [
										{
											"id": 5,
											"marriages_id": 2,
											"persons_id": "6dc55ba3-a9ee-4210-b52b-55ec391f8a96",
											"spouses": [
												{
													"id": "028eb5ee-0d15-4844-a629-eea214e277e8",
													"first_name": "Marta",
													"last_name": "Wilson",
													"father": null,
													"mother": null,
													"marriages": [
														{
															"id": 4,
															"marriages_id": 2,
															"persons_id": "028eb5ee-0d15-4844-a629-eea214e277e8"
														}
													],
													"children_father": [],
													"children_mother": [
														{
															"id": "84a44025-b110-48b6-bb69-d24dae884264",
															"first_name": "Oreo",
															"last_name": "Dog",
															"father": null,
															"mother": "028eb5ee-0d15-4844-a629-eea214e277e8",
															"marriages": [],
															"children_father": [],
															"children_mother": [],
															"_all_children": []
														}
													],
													"_all_children": [
														{
															"id": "84a44025-b110-48b6-bb69-d24dae884264",
															"first_name": "Oreo",
															"last_name": "Dog",
															"father": null,
															"mother": "028eb5ee-0d15-4844-a629-eea214e277e8",
															"marriages": [],
															"children_father": [],
															"children_mother": [],
															"_all_children": []
														}
													]
												}
											]
										}
									],
									"children_father": [],
									"children_mother": [],
									"_all_children": []
								}
							]
						}
					]
				}
			],
			"children_father": [
				{
					"id": "6dc55ba3-a9ee-4210-b52b-55ec391f8a96",
					"_loaded": false,
					"_reason": "already_visited"
				}
			],
			"children_mother": [],
			"_all_children": [
				{
					"id": "6dc55ba3-a9ee-4210-b52b-55ec391f8a96",
					"_loaded": false,
					"_reason": "already_visited"
				}
			]
		};

		return {
			testData,
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

.test-page h1 {
	margin-bottom: 20px;
}
</style>
