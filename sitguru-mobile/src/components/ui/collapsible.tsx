import {
  ChevronRight,
} from 'lucide-react-native';
import {
  useState,
  type PropsWithChildren,
} from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  ThemedText,
} from '@/components/themed-text';
import {
  ThemedView,
} from '@/components/themed-view';
import {
  Spacing,
} from '@/constants/theme';
import {
  useTheme,
} from '@/hooks/use-theme';

export function Collapsible({
  children,
  title,
}: PropsWithChildren<{
  title: string;
}>) {
  const [isOpen, setIsOpen] =
    useState(false);

  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      style={styles.container}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          expanded: isOpen,
        }}
        onPress={() =>
          setIsOpen(
            (current) => !current,
          )
        }
        style={({ pressed }) => [
          styles.heading,
          pressed &&
            styles.pressed,
        ]}
      >
        <View
          style={[
            styles.chevron,
            isOpen &&
              styles.chevronOpen,
          ]}
        >
          <ChevronRight
            color={
              theme.colors.text
            }
            size={18}
            strokeWidth={2.4}
          />
        </View>

        <ThemedText
          type="defaultSemiBold"
          style={styles.title}
        >
          {title}
        </ThemedText>
      </Pressable>

      {isOpen ? (
        <ThemedView
          type="backgroundElement"
          style={styles.content}
        >
          {children}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 52,
    paddingHorizontal:
      Spacing.three,
    paddingVertical:
      Spacing.two,
  },
  pressed: {
    opacity: 0.72,
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [
      {
        rotate: '0deg',
      },
    ],
  },
  chevronOpen: {
    transform: [
      {
        rotate: '90deg',
      },
    ],
  },
  title: {
    flex: 1,
  },
  content: {
    gap: Spacing.three,
    paddingBottom:
      Spacing.four,
    paddingHorizontal:
      Spacing.four,
  },
});