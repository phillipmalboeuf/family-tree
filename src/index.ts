import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'family-tree',
	name: 'Family Tree',
	icon: 'box',
	description: 'This is the family tree interface!',
	component: InterfaceComponent,
	options: null,
	types: ['alias'],
});
