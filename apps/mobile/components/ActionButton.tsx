import { Pressable, StyleSheet, Text } from 'react-native'

type ActionButtonProps = {
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'muted'
  disabled?: boolean
  onPress: () => void
}

export function ActionButton({ label, variant = 'secondary', disabled = false, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'primary' && styles.primaryButton,
        variant === 'danger' && styles.dangerButton,
        variant === 'muted' && styles.mutedButton,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'primary' && styles.primaryButtonText,
          variant === 'danger' && styles.dangerButtonText,
          variant === 'muted' && styles.mutedButtonText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#22d3ee',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    borderColor: '#34d399',
    backgroundColor: '#34d399',
  },
  dangerButton: {
    borderColor: '#fb7185',
  },
  mutedButton: {
    borderColor: '#334155',
  },
  actionButtonText: {
    color: '#a5f3fc',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#022c22',
  },
  dangerButtonText: {
    color: '#fecdd3',
  },
  mutedButtonText: {
    color: '#cbd5e1',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.75,
  },
})
