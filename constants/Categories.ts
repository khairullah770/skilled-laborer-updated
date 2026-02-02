import { Ionicons } from '@expo/vector-icons';

export interface SubCategory {
    id: string;
    title: string;
}

export interface Category {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    subCategories: SubCategory[];
}

export const CATEGORIES: Category[] = [
    {
        id: '1',
        title: 'Mounting',
        icon: 'easel-outline',
        subCategories: [
            { id: '1-1', title: 'TV Mounting' },
            { id: '1-2', title: 'Furniture Mounting' },
            { id: '1-3', title: 'Shelf Mounting' },
            { id: '1-4', title: 'Art & Mirror Mounting' },
        ]
    },
    {
        id: '2',
        title: 'Assembly',
        icon: 'construct-sharp',
        subCategories: [
            { id: '2-1', title: 'Furniture Assembly' },
            { id: '2-2', title: 'Exercise Equipment Assembly' },
            { id: '2-3', title: 'Patio Furniture Assembly' },
            { id: '2-4', title: 'Desk Assembly' },
        ]
    },
    {
        id: '3',
        title: 'Moving',
        icon: 'cube-outline',
        subCategories: [
            { id: '3-1', title: 'Help Moving' },
            { id: '3-2', title: 'Truck Assisted Moving' },
            { id: '3-3', title: 'Packing Services' },
            { id: '3-4', title: 'Heavy Lifting' },
        ]
    },
    {
        id: '4',
        title: 'Cleaning',
        icon: 'sparkles-outline',
        subCategories: [
            { id: '4-1', title: 'House Cleaning' },
            { id: '4-2', title: 'Deep Cleaning' },
            { id: '4-3', title: 'Move In/Out Cleaning' },
            { id: '4-4', title: 'Carpet Cleaning' },
        ]
    },
    {
        id: '5',
        title: 'Electrician',
        icon: 'bulb-outline',
        subCategories: [
            { id: '5-1', title: 'Wiring and Rewiring' },
            { id: '5-2', title: 'Lighting Installation/Repair' },
            { id: '5-3', title: 'Outlet and Switch Repair' },
            { id: '5-4', title: 'Circuit Breaker Replacement' },
            { id: '5-5', title: 'Electrical Panel Upgrades' },
        ]
    },
    {
        id: '6',
        title: 'Painter',
        icon: 'brush-outline',
        subCategories: [
            { id: '6-1', title: 'Interior Painting' },
            { id: '6-2', title: 'Exterior Painting' },
            { id: '6-3', title: 'Cabinet Painting' },
            { id: '6-4', title: 'Wallpaper Installation' },
        ]
    },
    {
        id: '7',
        title: 'Carpenter',
        icon: 'hammer-sharp',
        subCategories: [
            { id: '7-1', title: 'Custom Shelving' },
            { id: '7-2', title: 'Cabinet Installation' },
            { id: '7-3', title: 'Trim & Molding' },
            { id: '7-4', title: 'Door Repair & Installation' },
        ]
    },
    {
        id: '8',
        title: 'HVAC',
        icon: 'snow-outline',
        subCategories: [
            { id: '8-1', title: 'AC Install/Repair' },
            { id: '8-2', title: 'Heater Repair' },
            { id: '8-3', title: 'Duct Cleaning' },
            { id: '8-4', title: 'Thermostat Installation' },
        ]
    },
    {
        id: '9',
        title: 'Roofing',
        icon: 'home-sharp',
        subCategories: [
            { id: '9-1', title: 'Roof Inspection' },
            { id: '9-2', title: 'Leak Repair' },
            { id: '9-3', title: 'Shingle Replacement' },
            { id: '9-4', title: 'Gutter Cleaning' },
        ]
    },
    {
        id: '10',
        title: 'Tiling',
        icon: 'apps-outline',
        subCategories: [
            { id: '10-1', title: 'Floor Tiling' },
            { id: '10-2', title: 'Wall Tiling' },
            { id: '10-3', title: 'Backsplash Installation' },
            { id: '10-4', title: 'Grout Repair' },
        ]
    },
    {
        id: '11',
        title: 'Gardening',
        icon: 'leaf-sharp',
        subCategories: [
            { id: '11-1', title: 'Lawn Mowing' },
            { id: '11-2', title: 'Weeding' },
            { id: '11-3', title: 'Planting' },
            { id: '11-4', title: 'Tree Trimming' },
        ]
    },
    {
        id: '12',
        title: 'Appliance',
        icon: 'settings-sharp',
        subCategories: [
            { id: '12-1', title: 'Fridge Repair' },
            { id: '12-2', title: 'Washer/Dryer Repair' },
            { id: '12-3', title: 'Dishwasher Repair' },
            { id: '12-4', title: 'Oven/Stove Repair' },
        ]
    },
];
