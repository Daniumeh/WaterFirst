import { Asset } from 'expo-asset';

export const appImageAssets = [
  require('../../assets/images/bottle-water-150cl-v2.png'),
  require('../../assets/images/bottle-water-75cl-v2.png'),
  require('../../assets/images/onboarding-celebration-drop-v2.png'),
  require('../../assets/images/onboarding-happy-drop-v2.png'),
  require('../../assets/images/onboarding-kidney-cutaway-v2.png'),
  require('../../assets/images/onboarding-sad-kidneys-v2.png'),
  require('../../assets/images/onboarding-waterfirst-kidney-bowl-v2.png'),
  require('../../assets/images/sachet-water-50cl-v2.png'),
  require('../../assets/images/waterfirst-logo-drop-v2.png'),
];

export async function preloadAppImages() {
  await Asset.loadAsync(appImageAssets);
}
