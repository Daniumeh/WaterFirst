import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { unitToMl } from '@/src/features/hydration/units';
import { colors, glassShadow, radius, spacing, type } from '@/src/theme/tokens';

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
            <View style={styles.waterIcon} />
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
              <View style={styles.bottleIcon} />
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
              <View style={[styles.optionIcon, option.label === 'Sachet Water' && styles.sachetIcon]} />
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
    backgroundColor: colors.glass,
    ...glassShadow,
  },
  content: {
    gap: spacing.md,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  waterIcon: {
    width: 12,
    height: 20,
    borderColor: colors.cyan,
    borderRadius: 7,
    borderWidth: 2,
    backgroundColor: 'rgba(32, 199, 255, 0.18)',
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  more: {
    color: colors.cyanSoft,
    flexShrink: 0,
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
    borderColor: colors.line,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    flexBasis: 92,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.glassStrong,
  },
  bottleIcon: {
    width: 9,
    height: 24,
    borderColor: colors.cyan,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'rgba(20, 125, 255, 0.22)',
  },
  quickText: {
    color: colors.text,
    fontFamily: type.data,
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
    backgroundColor: colors.line,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    flexBasis: 136,
    flexGrow: 1,
    minHeight: 72,
    minWidth: 0,
    padding: spacing.sm,
    backgroundColor: colors.glassStrong,
  },
  optionIcon: {
    width: 16,
    height: 34,
    borderColor: colors.cyan,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: 'rgba(32, 199, 255, 0.15)',
  },
  sachetIcon: {
    width: 23,
    borderRadius: 4,
    transform: [{ skewX: '-8deg' }],
  },
  optionLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  optionAmount: {
    color: colors.cyanSoft,
    fontFamily: type.data,
    fontSize: 13,
    marginTop: 2,
  },
  customRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  input: {
    flexBasis: 180,
    flex: 1,
    backgroundColor: colors.panel,
  },
  customButton: {
    borderRadius: radius.md,
    flexGrow: 1,
    minHeight: 44,
    minWidth: 88,
    backgroundColor: colors.blue,
  },
});
