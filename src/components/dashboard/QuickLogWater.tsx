import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import {
  formatHydrationAmount,
  unitToMl,
  type HydrationUnit,
} from '@/src/features/hydration/units';
import { colors, radius, spacing, typography } from '@/src/theme/tokens';

import { DashboardIcon, dashboardIcons } from './DashboardIcon';

const sachetWaterImage = require('../../../assets/images/sachet-water-50cl-v2.png');
const bottleWater75clImage = require('../../../assets/images/bottle-water-75cl-v2.png');
const bottleWater150clImage = require('../../../assets/images/bottle-water-150cl-v2.png');

type QuickLogWaterProps = {
  customAmount: string;
  onCustomAmountChange: (amount: string) => void;
  onLog: (amountMl: number) => void;
  unit: HydrationUnit;
};

const quickAmountsMl = [500, 750, 1500];

export function QuickLogWater({
  customAmount,
  onCustomAmountChange,
  onLog,
  unit,
}: QuickLogWaterProps) {
  const [customVisible, setCustomVisible] = useState(false);
  const [failedImageAmounts, setFailedImageAmounts] = useState<Record<number, boolean>>({});

  const markImageFailed = (amountMl: number) => {
    setFailedImageAmounts((current) => ({ ...current, [amountMl]: true }));
  };

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text style={styles.title}>Quick Log Water</Text>

        <View style={styles.amountRow}>
          {quickAmountsMl.map((amountMl) => (
            <Pressable
              key={amountMl}
              accessibilityRole="button"
              accessibilityLabel={`Add ${formatHydrationAmount(amountMl, unit)}`}
              style={({ pressed }) => [styles.quickTile, pressed && styles.pressedTile]}
              onPress={() => onLog(amountMl)}
            >
              <WaterOptionIcon
                amountMl={amountMl}
                imageFailed={Boolean(failedImageAmounts[amountMl])}
                onImageError={markImageFailed}
              />
              <Text style={styles.quickText}>+{formatHydrationAmount(amountMl, unit)}</Text>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Custom Amount"
            style={({ pressed }) => [styles.quickTile, pressed && styles.pressedTile]}
            onPress={() => setCustomVisible((visible) => !visible)}
          >
            <View style={styles.customIconWrap}>
              <DashboardIcon name={dashboardIcons.droplet} size={30} color={colors.cyan} />
              <View style={styles.plusBadge}>
                <Text style={styles.plusText}>+</Text>
              </View>
            </View>
            <Text style={styles.quickText}>Custom</Text>
          </Pressable>
        </View>

        {customVisible ? (
          <View style={styles.customRow}>
            <TextInput
              keyboardType="numeric"
              label={`Custom amount (${unit})`}
              mode="outlined"
              activeOutlineColor={colors.cyan}
              outlineColor={colors.line}
              placeholderTextColor={colors.faint}
              style={styles.input}
              textColor={colors.text}
              value={customAmount}
              onChangeText={onCustomAmountChange}
            />
            <Button
              mode="contained"
              style={styles.customButton}
              contentStyle={styles.customButtonContent}
              onPress={() => {
                const amount = Number(customAmount);
                if (amount > 0) {
                  onLog(unitToMl(amount, unit));
                  onCustomAmountChange('');
                  setCustomVisible(false);
                }
              }}
            >
              Log
            </Button>
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

type WaterOptionIconProps = {
  amountMl: number;
  imageFailed: boolean;
  onImageError: (amountMl: number) => void;
};

function WaterOptionIcon({ amountMl, imageFailed, onImageError }: WaterOptionIconProps) {
  if (amountMl === 500 && !imageFailed) {
    return (
      <Image
        source={sachetWaterImage}
        style={styles.sachetImage}
        resizeMode="contain"
        onError={() => onImageError(amountMl)}
      />
    );
  }

  if (amountMl === 750 && !imageFailed) {
    return (
      <Image
        source={bottleWater75clImage}
        style={styles.bottleImage75cl}
        resizeMode="contain"
        onError={() => onImageError(amountMl)}
      />
    );
  }

  if (amountMl === 1500 && !imageFailed) {
    return (
      <Image
        source={bottleWater150clImage}
        style={styles.bottleImage150cl}
        resizeMode="contain"
        onError={() => onImageError(amountMl)}
      />
    );
  }

  return (
    <View style={[styles.bottleIcon, amountMl >= 1000 && styles.largeBottleIcon]}>
      <View style={styles.bottleCap} />
      <View style={styles.bottleNeck} />
      <View style={styles.bottleWater} />
      {amountMl >= 750 ? <View style={styles.bottleRibOne} /> : null}
      {amountMl >= 1000 ? <View style={styles.bottleRibTwo} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.glass,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickTile: {
    alignItems: 'center',
    borderColor: 'rgba(120, 230, 255, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 78,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(17, 52, 76, 0.72)',
  },
  pressedTile: {
    borderColor: colors.cyan,
    backgroundColor: 'rgba(32, 199, 255, 0.14)',
  },
  quickText: {
    color: colors.text,
    ...typography.h2,
    textAlign: 'center',
  },
  sachetImage: {
    width: 46,
    height: 34,
  },
  bottleImage75cl: {
    width: 28,
    height: 45,
  },
  bottleImage150cl: {
    width: 31,
    height: 48,
  },
  bottleIcon: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 18,
    height: 34,
    borderColor: colors.cyan,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: colors.wash,
  },
  largeBottleIcon: {
    width: 21,
    height: 38,
    borderRadius: 7,
  },
  bottleCap: {
    position: 'absolute',
    top: -6,
    width: 8,
    height: 5,
    borderRadius: 2,
    backgroundColor: colors.blue,
  },
  bottleNeck: {
    position: 'absolute',
    top: -1,
    width: 9,
    height: 8,
    borderColor: colors.cyan,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    backgroundColor: colors.card,
  },
  bottleWater: {
    width: '100%',
    height: '48%',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: 'rgba(32, 199, 255, 0.62)',
  },
  bottleRibOne: {
    position: 'absolute',
    bottom: 13,
    width: '86%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(120, 230, 255, 0.42)',
  },
  bottleRibTwo: {
    position: 'absolute',
    bottom: 20,
    width: '86%',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(120, 230, 255, 0.42)',
  },
  customIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
  },
  plusBadge: {
    alignItems: 'center',
    bottom: 2,
    justifyContent: 'center',
    position: 'absolute',
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.blue,
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
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
    backgroundColor: 'rgba(3, 16, 28, 0.78)',
  },
  customButton: {
    borderRadius: radius.lg,
    flexGrow: 1,
    minWidth: 92,
    backgroundColor: colors.blue,
  },
  customButtonContent: {
    minHeight: 52,
  },
});
