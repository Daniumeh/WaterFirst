import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { colors, radius, spacing } from '@/src/theme/tokens';

type HealthInsightsCardProps = {
  insights: string[];
};

export function HealthInsightsCard({ insights }: HealthInsightsCardProps) {
  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>⌁</Text>
            <Text style={styles.title} variant="titleLarge">
              Health Insight
            </Text>
          </View>
          <Text style={styles.link}>See All ›</Text>
        </View>
        <View style={styles.innerPanel}>
          <View style={styles.starBadge}>
            <Text style={styles.star}>☆</Text>
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
            <Text style={styles.drop}>◒</Text>
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
    backgroundColor: colors.card,
  },
  content: {
    gap: spacing.md,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  icon: {
    color: colors.cyan,
    fontSize: 22,
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
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.panel,
  },
  starBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderColor: '#FFE348',
    borderRadius: 24,
    borderWidth: 2,
  },
  star: {
    color: '#FFE348',
    fontSize: 30,
  },
  insightList: {
    flex: 1,
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
    borderRadius: 29,
    backgroundColor: '#083556',
  },
  drop: {
    color: colors.cyan,
    fontSize: 42,
  },
});
