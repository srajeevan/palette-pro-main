import { AppText } from '@/components/AppText';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

interface SettingsRowProps {
    icon: React.ReactNode;
    label: string;
    type: 'link' | 'toggle' | 'destructive';
    value?: boolean;
    onPress?: () => void;
    onToggle?: (value: boolean) => void;
}

export const SettingsRow = ({
    icon,
    label,
    type,
    value,
    onPress,
    onToggle
}: SettingsRowProps) => {

    // For toggle, the row itself might not be touchable if text shouldn't trigger it, 
    // but usually tapping the row toggles. Let's make the whole row interactive if onPress is provided or type is link/destructive.
    // For toggle, we might want the switch to handle it or the row.

    const handlePress = () => {
        if (type === 'toggle' && onToggle) {
            onToggle(!value);
        } else if (onPress) {
            onPress();
        }
    };

    const isDestructive = type === 'destructive';

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.7}
            disabled={type === 'toggle' && !onToggle} // Disable touch if no handler, though Switch handles its own too
            style={styles.container}
        >
            <View style={styles.leftContent}>
                {/* Icon wrapper if needed, or direct node */}
                <View style={styles.iconContainer}>
                    {icon}
                </View>
                <AppText style={[styles.label, isDestructive && styles.destructiveLabel]}>
                    {label}
                </AppText>
            </View>

            <View style={styles.rightContent}>
                {type === 'link' && (
                    <ChevronRight size={20} color="#C7C7CC" />
                )}

                {type === 'toggle' && (
                    <Switch
                        value={value}
                        onValueChange={onToggle}
                        trackColor={{ false: '#E9E9EA', true: '#1A1A1A' }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#E9E9EA"
                    />
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        // Optional sizing or alignment
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#333333',
    },
    destructiveLabel: {
        color: '#EF4444', // Red-500
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
