import type { ComponentProps } from 'react';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type ProtectedAppCategory = 'recommended' | 'all';

export type ProtectedApp = {
  category: ProtectedAppCategory;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  id: string;
  name: string;
  packageName: string;
  tint: string;
};

export const mockProtectedApps: ProtectedApp[] = [
  {
    category: 'recommended',
    icon: 'music-note-eighth',
    id: 'tiktok',
    name: 'TikTok',
    packageName: 'com.zhiliaoapp.musically',
    tint: '#FFFFFF',
  },
  {
    category: 'recommended',
    icon: 'instagram',
    id: 'instagram',
    name: 'Instagram',
    packageName: 'com.instagram.android',
    tint: '#FF4FA3',
  },
  {
    category: 'recommended',
    icon: 'youtube',
    id: 'youtube',
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    tint: '#FF3B30',
  },
  {
    category: 'recommended',
    icon: 'alpha-x',
    id: 'x',
    name: 'X (Twitter)',
    packageName: 'com.twitter.android',
    tint: '#F5FBFF',
  },
  {
    category: 'recommended',
    icon: 'snapchat',
    id: 'snapchat',
    name: 'Snapchat',
    packageName: 'com.snapchat.android',
    tint: '#FFE95C',
  },
  {
    category: 'all',
    icon: 'facebook',
    id: 'facebook',
    name: 'Facebook',
    packageName: 'com.facebook.katana',
    tint: '#1877F2',
  },
  {
    category: 'all',
    icon: 'whatsapp',
    id: 'whatsapp',
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    tint: '#25D366',
  },
  {
    category: 'all',
    icon: 'netflix',
    id: 'netflix',
    name: 'Netflix',
    packageName: 'com.netflix.mediaclient',
    tint: '#E50914',
  },
];

export function getProtectedAppsByIds(ids: string[]) {
  const selectedIds = new Set(ids);

  return mockProtectedApps.filter((app) => selectedIds.has(app.id));
}
