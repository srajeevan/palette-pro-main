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
            onPress={onPress}
            disabled={type === 'toggle'}
            activeOpacity={0.7}
            style={styles.container}
        >
            <View style={styles.leftContent}>
                <View style={styles.iconContainer}>
                    {/* Clone icon to enforce color if needed, or rely on parent passing correct color */}
                    {React.cloneElement(icon as React.ReactElement, { color: type === 'destructive' ? '#EF4444' : '#A1A1AA' })}
                </View>
                <AppText style={[
                    styles.label,
                    type === 'destructive' && styles.destructiveLabel
                ]}>
                    {label}
                </AppText>
            </View>

            <View style={styles.rightContent}>
                {type === 'toggle' && (
                    <Switch
                        value={value}
                        onValueChange={onToggle}
                        trackColor={{ false: '#28282A', true: '#3E63DD' }}
                        thumbColor={'#FFFFFF'}
                        ios_backgroundColor="#28282A"
                    />
                )}
                {type === 'link' && (
                    <ChevronRight size={20} color="#52525B" />
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
        borderBottomWidth: 1,
        borderBottomColor: '#28282A', // Dark separator
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        // Optional: layout for icon alignment
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#FFFFFF', // White text
    },
    destructiveLabel: {
        color: '#EF4444',
    },
    rightContent: {
        //
    },
});
