import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react'; // Import LucideProps

// Ambil tipe untuk semua ikon Lucide (opsional tapi bagus untuk type safety)
type IconName = keyof typeof LucideIcons;

// Daftar ikon yang ingin kita sediakan (PILIH IKON YANG RELEVAN)
// Anda bisa menambah/mengurangi daftar ini sesuai kebutuhan
export const availableIcons: IconName[] = [
  'Tag', 'Home', 'ShoppingCart', 'Car', 'Plane', 'UtensilsCrossed',
  'Gift', 'Shirt', 'HeartPulse', 'GraduationCap', 'BookOpen', 'Film',
  'Music', 'Gamepad2', 'Tv', 'Smartphone', 'Laptop', 'MousePointerClick',
  'PiggyBank', 'Landmark', 'CreditCard', 'Wallet', 'Coins', 'Receipt',
  'TrendingUp', 'TrendingDown', 'BadgePercent', 'Ticket', 'Building',
  'Bus', 'Train', 'Fuel', 'Wrench', 'Baby', 'PawPrint', 'Briefcase',
  'Stethoscope', 'Pill', 'Pizza', 'Coffee', 'Beer', 'Bone', 'CircleDollarSign',
  'Activity', 'Apple', 'Bitcoin', 'FerrisWheel', 'Flower', 'Footprints',
  'Hammer', 'HandCoins', 'HandHeart', 'Heart', 'HelpingHand', 'IceCream',
  'Lightbulb', 'Map', 'Navigation', 'Package', 'Palette', 'PartyPopper',
  'Radiation', 'Recycle', 'RotateCcw', 'Scale', 'School', 'Scissors',
  'Settings', 'Shield', 'ShoppingBag', 'Sparkles', 'Speech', 'Star',
  'Store', 'Sunflower', 'Tent', 'TrainTrack', 'TreePalm', 'Trophy', 'Umbrella',
  'Award', 'Banknote', 'Bike', 'Calculator', 'Church', 'Clapperboard',
  'Construction', 'Dumbbell', 'Factory', 'FileText', 'FlaskConical', 'Globe',
  'KeyRound', 'Library', 'Network', 'Paintbrush', 'PlaneTakeoff', 'Plug',
  'Podcast', 'Puzzle', 'Rocket', 'Sailboat', 'Save', 'ScrollText', 'Ship',
  'Sprout', 'Tractor', 'TramFront', 'Truck', 'User', 'Users', 'Utensils',
  'Vault', 'Waves', 'Wifi', 'Wind', 'Wine', 'Zap', 'Leaf'
];


interface DynamicIconProps extends LucideProps {
  name: IconName | string | null | undefined; // Terima string, null, atau undefined
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // Gunakan ikon 'Tag' sebagai default jika nama tidak valid atau null/undefined
  const IconComponent = name && LucideIcons[name as IconName] ? LucideIcons[name as IconName] : LucideIcons.Tag;

  return <IconComponent {...props} />;
};

// Fungsi helper untuk mendapatkan nama ikon yang valid (untuk memastikan hanya nama valid yang disimpan)
export const isValidIconName = (name: string | null | undefined): name is IconName => {
    return !!name && name in LucideIcons;
}