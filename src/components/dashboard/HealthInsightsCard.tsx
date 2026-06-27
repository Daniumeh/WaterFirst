import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { colors, glassShadow, radius, spacing } from '@/src/theme/tokens';

type HealthInsightsCardProps = {
  insights: string[];
};

export function HealthInsightsCard({ insights }: HealthInsightsCardProps) {
  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.icon} />
            <Text style={styles.title} variant="titleLarge">
              Habit Insight
            </Text>
          </View>
          <Text style={styles.link}>See All ›</Text>
        </View>
        <View style={styles.innerPanel}>
          <View style={styles.starBadge}>
            <View style={styles.star} />
          </View>
          <View style={styles.insightList}>
            {insights.map((insight) => (
              <Text key={insight} style={styles.insight}>
                • {insight}
              </Text>
            ))}
            <Text style={styles.goodJob}>Great job! Small habits create big results.</Text>
          </View>
          <View style={styles.dropArt}>
            <View style={styles.drop} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  content: {
    gap: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icon: {
    width: 21,
    height: 12,
    borderBottomColor: colors.cyan,
    borderBottomWidth: 2,
    borderLeftColor: colors.cyan,
    borderLeftWidth: 2,
    transform: [{ skewX: '-18deg' }],
  },
  title: {
    color: colors.text,
    fontWeight: '900',
  },
  link: {
    color: colors.cyan,
    fontWeight: '700',
  },
  innerPanel: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(3, 16, 28, 0.44)',
  },
  starBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    flexShrink: 0,
    borderColor: colors.orange,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 178, 87, 0.12)',
  },
  star: {
    width: 18,
    height: 18,
    borderColor: colors.orange,
    borderRadius: 9,
    borderWidth: 2,
  },
  insightList: {
    flexBasis: 180,
    flex: 1,
    minWidth: 0,
  },
  insight: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 21,
  },
  goodJob: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  dropArt: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 58,
    flexShrink: 0,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(20, 125, 255, 0.15)',
  },
  drop: {
    width: 26,
    height: 36,
    borderColor: colors.cyan,
    borderRadius: 15,
    borderWidth: 3,
    backgroundColor: 'rgba(32, 199, 255, 0.2)',
  },
});
