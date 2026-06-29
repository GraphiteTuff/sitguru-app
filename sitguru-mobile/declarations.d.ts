declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css';

declare module 'react-native-url-polyfill/auto';

declare module '@react-native-async-storage/async-storage' {
  import type { SupabaseAuthClientOptions } from '@supabase/supabase-js/dist/module/lib/types';
  const AsyncStorage: NonNullable<SupabaseAuthClientOptions['storage']>;
  export default AsyncStorage;
}
