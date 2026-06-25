import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { colors, radius, spacing } from '@/src/theme/tokens';

export default function ChallengesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        Challenges
      </Text>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text style={styles.cardTitle} variant="titleLarge">
            Coming soon
          </Text>
          <Text style={styles.subtitle}>
            Hydration challenges will help turn consistency into a weekly habit.
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  title: {
    color: colors.text,
    fontWeight: '900',
  },
  card: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  content: {
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 21,
  },
});
