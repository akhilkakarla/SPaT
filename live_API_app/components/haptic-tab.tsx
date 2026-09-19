import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';

type TabBarButtonProps = PressableProps & {
  children?: React.ReactNode;
};

export function HapticTab(props: TabBarButtonProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        props.onPressIn?.(ev);
      }}
    />
  );
}
