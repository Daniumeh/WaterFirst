import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { unitToMl } from '@/src/features/hydration/units';
import { colors, radius, spacing } from '@/src/theme/tokens';

type QuickLogWaterProps = {
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  onLog: (amountMl: number) => void;
};

const quickAmountsCl = [25, 50, 75, 100];
const waterOptions = [
  { label: 'Sachet Water', amountCl: 50 },
  { label: 'Small Bottle', amountCl: 50 },
  { label: 'Medium Bottle', amountCl: 75 },
  { label: 'Large Bottle', amountCl: 150 },
];

export function QuickLogWater({
  customAmount,
  onCustomAmountChange,
  onLog,
}: QuickLogWaterProps) {
  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.waterIcon}>♦</Text>
            <Text style={styles.title} variant="titleLarge">
              Quick Log Water
            </Text>
            <Text style={styles.more}>More Options ›</Text>
          </View>
        </View>

        <View style={styles.amountGrid}>
          {quickAmountsCl.map((amountCl) => (
            <Pressable
              key={amountCl}
              accessibilityRole="button"
              accessibilityLabel={`+${amountCl}cl`}
              style={styles.quickButton}
              onPress={() => onLog(unitToMl(amountCl, 'cl'))}
            >
              <Text style={styles.bottleIcon}>▯</Text>
              <Text style={styles.quickText}>+{amountCl}cl</Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" accessibilityLabel="Custom Amount" style={styles.quickButton}>
            <Text style={styles.bottleIcon}>✎</Text>
            <Text style={styles.quickText}>Custom</Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <Text style={styles.subtitle}>Common Water Options</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.optionGrid}>
          {waterOptions.map((option) => (
            <Pressable
              key={option.label}
              accessibilityRole="button"
              accessibilityLabel={`${option.label} ${option.amountCl}cl`}
              style={styles.optionButton}
              onPress={() => onLog(unitToMl(option.amountCl, 'cl'))}
            >
              <Text style={styles.optionIcon}>{option.label === 'Sachet Water' ? '▱' : '▯'}</Text>
              <View>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionAmount}>{option.amountCl}cl</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.customRow}>
          <TextInput
            keyboardType="numeric"
            label="Custom Amount (cl)"
            mode="outlined"
            style={styles.input}
            value={customAmount}
            onChangeText={onCustomAmountChange}
          />
          <Button
            mode="contained"
            style={styles.customButton}
            onPress={() => {
              const amount = Number(customAmount);
              if (amount > 0) {
                onLog(unitToMl(amount, 'cl'));
                onCustomAmountChange('');
              }
            }}
          >
            Log
          </Button>
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
    gap: spacing.sm,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  waterIcon: {
    color: colors.cyan,
    fontSize: 24,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  more: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    width: '31%',
    backgroundColor: colors.cardRaised,
  },
  bottleIcon: {
    color: colors.cyan,
    fontSize: 20,
  },
  quickText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.sm,
    width: '48%',
    backgroundColor: colors.cardRaised,
  },
  optionIcon: {
    color: colors.cyan,
    fontSize: 32,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  optionAmount: {
    color: colors.text,
    fontSize: 13,
    marginTop: 2,
  },
  customRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.panel,
  },
  customButton: {
    borderRadius: radius.md,
    backgroundColor: colors.cyanDeep,
  },
});
