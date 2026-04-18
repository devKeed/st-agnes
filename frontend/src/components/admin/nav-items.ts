import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Image as ImageIcon,
  LayoutDashboard,
  ListChecks,
  Settings,
  ShoppingBag,
  Type,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Bookings', href: '/admin/bookings', icon: ListChecks },
  { label: 'Rentals', href: '/admin/rentals', icon: ShoppingBag },
  { label: 'Gallery', href: '/admin/gallery', icon: ImageIcon },
  { label: 'Content', href: '/admin/content', icon: Type },
  { label: 'Availability', href: '/admin/availability', icon: CalendarDays },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];
