import Slider from '@react-native-community/slider'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg'

import type { ChartPoint, Translation } from '../../../packages/core/src'

type InteractiveChartProps = {
  copy: Translation
  data: ChartPoint[]
  formatter: Intl.NumberFormat
  maxAmount: number
  selectedYear: number
  onYearChange: (year: number) => void
}

type ChartLegendValueProps = {
  label: string
  value: string
  color: string
}

function ChartLegendValue({ label, value, color }: ChartLegendValueProps) {
  return (
    <View style={styles.chartLegendTile}>
      <View style={styles.legendHeader}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  )
}

export function InteractiveChart({ copy, data, formatter, maxAmount, selectedYear, onYearChange }: InteractiveChartProps) {
  const width = 360
  const height = 230
  const padding = { top: 18, right: 16, bottom: 34, left: 58 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const maxIndex = Math.max(data.length - 1, 0)
  const maxYear = data[data.length - 1]?.year ?? 0
  const selectedIndex = Math.min(Math.max(selectedYear, 0), maxIndex)
  const selectedPoint = data[selectedIndex] ?? null
  const xStep = data.length > 1 ? innerWidth / (data.length - 1) : 0
  const xForIndex = (index: number) => padding.left + index * xStep
  const yForValue = (value: number) => {
    if (maxAmount <= 0) {
      return padding.top + innerHeight
    }

    return padding.top + innerHeight - (value / maxAmount) * innerHeight
  }
  const linePath = (extractor: (point: ChartPoint) => number) =>
    data
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForValue(extractor(point))}`)
      .join(' ')
  const yTicks = Array.from({ length: 5 }, (_, index) => (maxAmount / 4) * index)
  const xTicks = Array.from(new Set([0, Math.round(maxYear / 2), maxYear]))

  if (!selectedPoint) {
    return null
  }

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionTitle}>{copy.chartTitle}</Text>
      <Text style={styles.hint}>{copy.chartSubtitle}</Text>
      <View style={styles.svgFrame}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight}
            stroke="#475569"
            strokeWidth={1}
          />
          <Line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + innerHeight} stroke="#475569" strokeWidth={1} />

          {yTicks.map((tickValue, index) => {
            const y = yForValue(tickValue)
            return (
              <G key={`y-tick-${index}`}>
                <Line x1={padding.left - 4} y1={y} x2={padding.left + innerWidth} y2={y} stroke="#1e293b" strokeWidth={1} />
                <SvgText x={padding.left - 8} y={y + 4} fill="#94a3b8" fontSize={10} textAnchor="end">
                  {`${Math.round(tickValue / 1000)}K`}
                </SvgText>
              </G>
            )
          })}

          {xTicks.map((tickYear) => {
            const x = maxYear === 0 ? padding.left : padding.left + (tickYear / maxYear) * innerWidth
            return (
              <SvgText key={`x-tick-${tickYear}`} x={x} y={padding.top + innerHeight + 22} fill="#94a3b8" fontSize={10} textAnchor="middle">
                {tickYear}
              </SvgText>
            )
          })}

          <Path d={linePath((point) => point.remainingCapital)} fill="none" stroke="#a78bfa" strokeWidth={2.5} />
          <Path d={linePath((point) => point.reimbursedCapital)} fill="none" stroke="#34d399" strokeWidth={2.5} />
          <Path d={linePath((point) => point.paidInterest)} fill="none" stroke="#22d3ee" strokeWidth={2.5} />

          <Line
            x1={xForIndex(selectedIndex)}
            y1={padding.top}
            x2={xForIndex(selectedIndex)}
            y2={padding.top + innerHeight}
            stroke="#e2e8f0"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Circle cx={xForIndex(selectedIndex)} cy={yForValue(selectedPoint.remainingCapital)} r={4} fill="#c4b5fd" />
          <Circle cx={xForIndex(selectedIndex)} cy={yForValue(selectedPoint.reimbursedCapital)} r={4} fill="#6ee7b7" />
          <Circle cx={xForIndex(selectedIndex)} cy={yForValue(selectedPoint.paidInterest)} r={4} fill="#67e8f9" />
        </Svg>
      </View>
      <View style={styles.yearPill}>
        <Text style={styles.yearPillText}>
          {copy.yearLabel} {selectedPoint.year}
        </Text>
      </View>
      <Slider
        accessibilityLabel={copy.chartSubtitle}
        minimumValue={0}
        maximumValue={maxIndex}
        step={1}
        value={selectedIndex}
        minimumTrackTintColor="#34d399"
        maximumTrackTintColor="#334155"
        thumbTintColor="#6ee7b7"
        onValueChange={(value) => onYearChange(Math.round(value))}
        style={styles.slider}
      />
      <View style={styles.chartLegendGrid}>
        <ChartLegendValue
          label={copy.chartRemainingCapitalLegend}
          value={formatter.format(selectedPoint.remainingCapital)}
          color="#a78bfa"
        />
        <ChartLegendValue
          label={copy.chartReimbursedCapitalLegend}
          value={formatter.format(selectedPoint.reimbursedCapital)}
          color="#34d399"
        />
        <ChartLegendValue label={copy.chartInterestLegend} value={formatter.format(selectedPoint.paidInterest)} color="#22d3ee" />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  chartCard: {
    gap: 12,
    borderColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#020617',
    padding: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  svgFrame: {
    overflow: 'hidden',
    borderColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#020617',
  },
  yearPill: {
    flex: 1,
    alignItems: 'center',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 10,
  },
  yearPillText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  slider: {
    height: 36,
  },
  chartLegendGrid: {
    gap: 10,
  },
  chartLegendTile: {
    gap: 6,
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#0f172a',
    padding: 10,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendLabel: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
  },
  legendValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
})
