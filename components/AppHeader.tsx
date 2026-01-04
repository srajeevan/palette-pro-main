import { Text, View } from 'react-native';

interface AppHeaderProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export function AppHeader({ title, subtitle, className = '' }: AppHeaderProps) {
    return (
        <View
            className={`justify-end pb-4 px-6 ${className}`}
            style={{ height: 120 }} // Fixed 120pt height
        >
            <Text
                className="text-white font-bold tracking-tight"
                style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, textAlign: 'left' }}
            >
                {title}
            </Text>
            {subtitle && (
                <Text
                    className="mt-1"
                    style={{
                        fontFamily: 'Inter_500Medium',
                        fontSize: 12,
                        color: '#8E8E93',
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        textAlign: 'left'
                    }}
                >
                    {subtitle}
                </Text>
            )}
        </View>
    );
}
