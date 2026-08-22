import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Production/TestFlight builds hide redboxes. Without a boundary, a single
 * render crash becomes a permanent blank white screen.
 */
export default class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SitGuru] Root render crash', error, info.componentStack);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const message =
      this.state.error.message ||
      'SitGuru hit an unexpected startup error.';

    return (
      <View style={styles.container}>
        <Text style={styles.title}>SitGuru needs a refresh</Text>
        <Text style={styles.body}>{message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ error: null })}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D5C3A',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  body: {
    color: '#E7F6EC',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#0D5C3A',
    fontSize: 15,
    fontWeight: '700',
  },
});
