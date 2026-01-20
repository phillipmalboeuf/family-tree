import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'family-tree',
	name: 'Family Tree',
	icon: 'account_tree',
	description: 'Visualize family trees with parent-child and marriage relationships',
	component: InterfaceComponent,
	options: null,
	types: ['uuid', 'string', 'integer', 'bigInteger', 'alias'],
});
