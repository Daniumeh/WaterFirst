import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { useHydrationStore } from '@/src/store/hydrationStore';
import { colors, radius, spacing } from '@/src/theme/tokens';

export default function HistoryScreen() {
  const logs = useHydrationStore((state) => state.logs);

  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        History
      </Text>
      <FlatList
        contentContainerStyle={styles.list}
        data={logs}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Card mode="contained">
            <Card.Content style={styles.cardContent}>
              <Text style={styles.subtitle}>No water logged yet. Your recent entries will appear here.</Text>
            </Card.Content>
          </Card>
        }
        renderItem={({ item }) => (
          <Card mode="contained" style={styles.card}>
            <Card.Content style={styles.logRow}>
              <Text style={styles.amount} variant="titleMedium">
                {item.amountMl} ml
              </Text>
              <Text style={styles.subtitle}>
                {new Date(item.loggedAt).toLocaleTimeString([], { timeStyle: 'short' })}
              </Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.ink,
  },
  title: {
    color: colors.text,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
  },
  list: {
    gap: spacing.md,
    paddingTop: spacing.lg,
  },
  card: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  cardContent: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  logRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amount: {
    color: colors.cyan,
    fontWeight: '800',
  },
});
