import { Text, TextProps } from 'react-native';

interface AppTextProps extends TextProps {
    className?: string;
}

export function AppText({ className, style, ...props }: AppTextProps) {
    // Only apply default text-zinc-800 when no custom color class is provided
    const hasColorClass = className && /\btext-/.test(className);
    return (
        <Text
            className={`font-sans ${hasColorClass ? className : `text-zinc-800 ${className || ''}`}`}
            style={style}
            {...props}
        />
    );
}
