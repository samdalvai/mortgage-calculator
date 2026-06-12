import { StyleSheet, Text, View } from 'react-native'

type DisplayValueProps = {
  label: string
  value: string
}

export function SummaryItem({ label, value }: DisplayValueProps) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

export function PlanValue({ label, value }: DisplayValueProps) {
  return (
    <View style={styles.planValue}>
      <Text style={styles.planValueLabel}>{label}</Text>
      <Text style={styles.planValueText}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  summaryTile: {
    gap: 4,
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#020617',
    padding: 12,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  planValue: {
    minWidth: '45%',
    flexGrow: 1,
    gap: 2,
  },
  planValueLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  planValueText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
})
