export interface Laborer {
    id: string;
    name: string;
    subCategoryId: string; // To link with subcategories
    hourlyRate: number;
    distance: number; // in km
    rating: number;
    verified: boolean;
    image: string; // URL or local require
    about?: string;
    experience?: string;
    services?: string[];
}

export const LABORERS: Laborer[] = [
    {
        id: '1',
        name: 'James Bond',
        subCategoryId: '5-1', // Wiring and Rewiring (Example)
        hourlyRate: 100,
        distance: 6702.10,
        rating: 4.5,
        verified: true,
        image: 'https://randomuser.me/api/portraits/men/1.jpg',
        about: 'Experienced electrician with over 10 years of field work. Specialized in residential and commercial wiring.',
        experience: 'Experienced',
        services: ['Plumbing', 'Planting', 'Painting', 'Electrician'],
    },
    {
        id: '2',
        name: 'Mustafa Khan',
        subCategoryId: '5-1',
        hourlyRate: 120,
        distance: 6110.98,
        rating: 4.1,
        verified: true,
        image: 'https://randomuser.me/api/portraits/men/2.jpg',
        about: 'Certified professional known for quick and reliable service.',
        experience: 'Intermediate',
        services: ['Wiring', 'Lighting', 'Repairs'],
    },
    {
        id: '3',
        name: 'Sarah Connor',
        subCategoryId: '1-1', // TV Mounting
        hourlyRate: 90,
        distance: 12.5,
        rating: 4.8,
        verified: true,
        image: 'https://randomuser.me/api/portraits/women/3.jpg',
    },
    {
        id: '4',
        name: 'John Wick',
        subCategoryId: '3-1', // Help Moving
        hourlyRate: 150,
        distance: 5.0,
        rating: 5.0,
        verified: true,
        image: 'https://randomuser.me/api/portraits/men/4.jpg',
    },
    {
        id: '5',
        name: 'Alice Smith',
        subCategoryId: '4-1', // House Cleaning
        hourlyRate: 80,
        distance: 8.2,
        rating: 4.3,
        verified: true,
        image: 'https://randomuser.me/api/portraits/women/5.jpg',
    },
    {
        id: '6',
        name: 'Bob Builder',
        subCategoryId: '2-1', // Furniture Assembly
        hourlyRate: 95,
        distance: 3.4,
        rating: 4.6,
        verified: true,
        image: 'https://randomuser.me/api/portraits/men/6.jpg',
    }
];
