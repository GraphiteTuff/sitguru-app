import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import SitGuruTabBar, {
  type SitGuruTabKey,
  type SitGuruTabRole,
} from '@/components/SitGuruTabBar';

type MobileTabFooterProps = {
  active?: SitGuruTabKey;
  role?: SitGuruTabRole;
  badges?: Partial<Record<SitGuruTabKey, number>>;
  /** Optional sticky CTA stacked above the tab bar (book, accept, etc.). */
  sticky?: ReactNode;
};

/**
 * Thumb-zone footer: optional primary action + floating App Store-style tab bar.
 */
export default function MobileTabFooter({
  active,
  role,
  badges,
  sticky,
}: MobileTabFooterProps) {
  return (
    <View pointerEvents="box-none" style={styles.shell}>
      {sticky ? <View style={styles.sticky}>{sticky}</View> : null}
      <SitGuruTabBar active={active} badges={badges} role={role} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
  },
  sticky: {
    paddingBottom: 4,
    paddingHorizontal: 12,
  },
});
