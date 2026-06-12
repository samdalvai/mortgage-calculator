import { Pressable, StyleSheet, Text, View } from 'react-native'

type SegmentedControlProps<T extends string> = {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.pressed]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  segmentedControl: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    flexGrow: 1,
    alignItems: 'center',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  segmentSelected: {
    borderColor: '#34d399',
    backgroundColor: '#064e3b',
  },
  segmentText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentTextSelected: {
    color: '#d1fae5',
  },
  pressed: {
    opacity: 0.75,
  },
})
