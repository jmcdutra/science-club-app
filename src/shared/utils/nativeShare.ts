import { isRunningInExpoGo } from 'expo';
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

export type NativeShareModule = {
  Social?: { INSTAGRAM_STORIES?: string };
  open?: (options: Record<string, unknown>) => Promise<unknown>;
  shareSingle?: (options: Record<string, unknown>) => Promise<unknown>;
};

function hasRNShareNativeModule() {
  if (Platform.OS === 'web' || isRunningInExpoGo()) {
    return false;
  }

  const turboModule =
    typeof TurboModuleRegistry.get === 'function'
      ? TurboModuleRegistry.get<unknown>('RNShare')
      : null;

  return Boolean(turboModule || NativeModules.RNShare);
}

export function getNativeShareModule() {
  if (!hasRNShareNativeModule()) {
    return null;
  }

  try {
    // Load only after confirming the native module exists, otherwise TurboModuleRegistry throws.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const shareModule = require('react-native-share') as { default?: NativeShareModule } & NativeShareModule;
    return shareModule.default ?? shareModule;
  } catch {
    return null;
  }
}
