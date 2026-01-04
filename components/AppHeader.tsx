import { Text, View } from 'react-native';

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export function AppHeader({ title, subtitle, className = '' }: AppHeaderProps) {
    return (
        <View className={`mb-8 ${className}`}>
            <Text className="text-4xl font-extrabold text-zinc-900 tracking-tight">{title}</Text>
            {subtitle && (
                <Text className="text-zinc-500 mt-1 text-base font-medium">{subtitle}</Text>
            )}
        </View>
    );
}
