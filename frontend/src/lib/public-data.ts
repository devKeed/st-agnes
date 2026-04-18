export type GalleryCategory = 'COLLECTION' | 'MUSE';

export interface GalleryItem {
  id: string;
  category: GalleryCategory;
  title: string;
  description: string;
  imageUrl: string;
}

export interface RentalItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  pricePerDay: number;
  sizes: string[];
}

export const services = [
  {
    key: 'CUSTOM_DESIGN',
    title: 'Custom Design',
    description: 'Bespoke pieces crafted to your event, silhouette, and personality.',
  },
  {
    key: 'ALTERATION',
    title: 'Alteration',
    description: 'Precision tailoring and fit correction for existing outfits.',
  },
  {
    key: 'RENTAL',
    title: 'Rental',
    description: 'Curated luxury rentals for weddings, red carpets, and special events.',
  },
] as const;

export const galleryItems: GalleryItem[] = [
  {
    id: 'g1',
    category: 'COLLECTION',
    title: 'Velvet Dusk',
    description: 'A dramatic velvet silhouette with clean architectural lines.',
    imageUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'g2',
    category: 'COLLECTION',
    title: 'Pearl Hour',
    description: 'Minimalist bridal-inspired styling with satin movement.',
    imageUrl:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'g3',
    category: 'MUSE',
    title: 'City Muse',
    description: 'Street editorial featuring monochrome layering and edge.',
    imageUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'g4',
    category: 'MUSE',
    title: 'Golden Muse',
    description: 'Golden-hour muse portrait with handcrafted detailing.',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80',
  },
];

export const rentalItems: RentalItem[] = [
  {
    id: 'r1',
    name: 'Emerald Silk Gown',
    description:
      'Floor-length silk gown with soft drape and tailored waist definition.',
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    pricePerDay: 25000,
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    id: 'r2',
    name: 'Ivory Satin Set',
    description: 'Two-piece satin set with sculpted top and full skirt.',
    imageUrl:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80',
    pricePerDay: 22000,
    sizes: ['S', 'M', 'L'],
  },
  {
    id: 'r3',
    name: 'Noir Evening Dress',
    description: 'Structured black evening dress suited for formal occasions.',
    imageUrl:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
    pricePerDay: 28000,
    sizes: ['XS', 'S', 'M'],
  },
];
