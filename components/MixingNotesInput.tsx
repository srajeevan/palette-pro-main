import { AppText } from '@/components/AppText';
import { Pencil } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface MixingNotesInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export const MixingNotesInput = ({ value, onChangeText, placeholder }: MixingNotesInputProps) => {
    return (
        <View style={styles.container}>
            {/* Header / Spiral Binding Visual could go here, keeping it minimal for now */}
            <View style={styles.header}>
                <View style={styles.labelContainer}>
                    <Pencil size={14} color="#8D8D8D" />
                    <AppText style={styles.label}>FIELD NOTES</AppText>
                </View>
                <AppText style={styles.date}>{new Date().toLocaleDateString()}</AppText>
            </View>

            {/* Paper Texture Area */}
            <View style={styles.paper}>
                <TextInput
                    style={styles.input}
                    multiline
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder || "Record your mixing strategy, lighting conditions, or inspiration..."}
                    placeholderTextColor="#A8A8A8"
                    textAlignVertical="top"
                />

                {/* Visual Lines (decorations) - Optional, maybe just CSS border bottoms on a repeater if needed, 
                    but sticking to clean field journal aesthetic (cream paper) */}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        fontFamily: 'Inter_700Bold',
        fontSize: 10,
        color: '#8D8D8D',
        letterSpacing: 1,
    },
    date: {
        fontFamily: 'Inter_500Medium',
        fontSize: 10,
        color: '#B0B0B0',
    },
    paper: {
        backgroundColor: '#FDFBF7', // Cream / Off-white "Journal" paper
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E8E6E1',
        padding: 16,
        minHeight: 120,
        // Texture Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    input: {
        fontFamily: 'PlayfairDisplay_700Bold', // Handwriting-ish feel or Typewriter? 
        // Playfair Bold might be too heavy for body. Let's use Inter regular for readability or Playfair regular if available.
        // Checking available fonts... we loaded PlayfairDisplay_700Bold. 
        // We probably should use Inter_500Medium for readability, or system serif.
        // Let's stick to Inter Medium for now for clarity, or if we had a handwriting font.
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#444',
        lineHeight: 22,
        height: '100%',
    },
});
