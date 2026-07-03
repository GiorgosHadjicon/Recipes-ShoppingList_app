import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  emoji?: string | null;
  color?: string | null;
  size?: number;
}

// Avatar colors are user data, identical in light/dark — no theme hook needed.
export function Avatar({ emoji, color, size = 28 }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? '#D4805E',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.55 }}>{emoji ?? '🍽️'}</Text>
    </View>
  );
}
