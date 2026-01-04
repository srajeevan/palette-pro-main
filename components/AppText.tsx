import { Text, TextProps } from 'react-native';

interface AppTextProps extends TextProps {
    className?: string;
}

export function AppText({ className, style, ...props }: AppTextProps) {
    // Default to zinc-800 for primary text color and a clean sans-serif look
    return (
        <Text
            className={`text-zinc-800 font-sans ${className}`}
            style={style}
            {...props}
        />
    );
}
