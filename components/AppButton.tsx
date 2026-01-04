import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export function AppButton({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    className = '',
    icon
}: AppButtonProps) {

    const baseStyles = 'py-4 rounded-xl items-center justify-center flex-row gap-3';

    const variants = {
        primary: 'bg-teal-700', // Paint-accent
        secondary: 'bg-stone-200',
        outline: 'bg-transparent border border-stone-300',
    };

    const textStyles = {
        primary: 'text-white font-bold text-lg',
        secondary: 'text-zinc-900 font-semibold text-lg',
        outline: 'text-zinc-900 font-semibold text-lg',
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50' : ''} ${className}`}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#18181b'} />
            ) : (
                <>
                    {icon}
                    <Text className={textStyles[variant]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}
