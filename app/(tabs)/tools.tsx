import { AppHeader } from '@/components/AppHeader';
import { PaywallModal } from '@/components/PaywallModal';
import { SceneTransition } from '@/components/SceneTransition';
import { SquintCanvas } from '@/components/SquintCanvas';
import { SquintControls } from '@/components/SquintControls';
import { UploadPlaceholderView } from '@/components/UploadPlaceholderView';
import { ValueControls } from '@/components/ValueControls';
import { ValueMapCanvas } from '@/components/ValueMapCanvas';
import { usePro } from '@/context/ProContext';
import { useUpgradeFlow } from '@/hooks/useUpgradeFlow';
import { useImagePicker } from '@/services/useImagePicker';
import { useProjectStore } from '@/store/useProjectStore';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 48;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.45;

type ToolTab = 'squint' | 'valuemap';

function SegmentedControl({ activeTab, onTabChange }: { activeTab: ToolTab; onTabChange: (tab: ToolTab) => void }) {
    return (
        <View style={segStyles.container}>
            <Pressable
                style={[segStyles.segment, activeTab === 'squint' && segStyles.activeSegment]}
                onPress={() => onTabChange('squint')}
            >
                <AppText style={[segStyles.label, activeTab === 'squint' && segStyles.activeLabel]}>
                    Squint
                </AppText>
            </Pressable>
            <Pressable
                style={[segStyles.segment, activeTab === 'valuemap' && segStyles.activeSegment]}
                onPress={() => onTabChange('valuemap')}
            >
                <AppText style={[segStyles.label, activeTab === 'valuemap' && segStyles.activeLabel]}>
                    Value Map
                </AppText>
            </Pressable>
        </View>
    );
}

const segStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#1C1C1E',
        borderRadius: 12,
        padding: 3,
        marginHorizontal: 24,
        marginBottom: 16,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeSegment: {
        backgroundColor: '#28282A',
    },
    label: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#71717A',
    },
    activeLabel: {
        color: '#FFFFFF',
    },
});

export default function ToolsScreen() {
    const { imageUri } = useProjectStore();
    const { pickImage } = useImagePicker();
    const { isPro } = usePro();
    const { triggerUpgradeFlow } = useUpgradeFlow();
    const paywallRef = React.useRef<BottomSheetModal>(null);

    const [activeTab, setActiveTab] = useState<ToolTab>('squint');

    // Squint state
    const [blurIntensity, setBlurIntensity] = useState(0);
    const MAX_BLUR = 50;

    // Value Map state
    const [grayscaleEnabled, setGrayscaleEnabled] = useState(false);
    const [temperatureEnabled, setTemperatureEnabled] = useState(false);

    const handleTemperatureToggle = (value: boolean) => {
        if (!isPro && value) {
            triggerUpgradeFlow(() => {
                paywallRef.current?.present();
            }, {
                onGuestIntent: () => {
                    setTemperatureEnabled(false);
                }
            });
            setTemperatureEnabled(false);
        } else {
            setTemperatureEnabled(value);
        }
    };

    const subtitle = activeTab === 'squint' ? 'SQUINT TOOL' : 'TONAL ZONES';

    if (!imageUri) {
        return (
            <SafeAreaView className="flex-1 bg-[#0A0A0B]">
                <View className="flex-1 px-6 pt-10">
                    <AppHeader
                        title="Tonal Analysis"
                        subtitle="Analyze values and composition."
                    />
                    <View className="flex-1 -mt-5">
                        <UploadPlaceholderView onImageSelected={() => pickImage()} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SceneTransition style={{ flex: 1 }}>
            <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top']}>
                <View className="flex-1">
                    <AppHeader
                        title="Tonal Analysis"
                        subtitle={subtitle}
                        className="mb-0 z-10 bg-[#0A0A0B]"
                    />

                    <SegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />

                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 140 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View
                            style={{
                                width: CANVAS_WIDTH,
                                height: CANVAS_HEIGHT,
                                alignSelf: 'center',
                                overflow: 'hidden',
                                borderRadius: 24,
                                backgroundColor: '#1C1C1E',
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                marginBottom: 24,
                                marginTop: 8,
                            }}
                        >
                            {activeTab === 'squint' ? (
                                <SquintCanvas
                                    blurIntensity={blurIntensity}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                />
                            ) : (
                                <ValueMapCanvas
                                    grayscaleEnabled={grayscaleEnabled}
                                    temperatureEnabled={temperatureEnabled}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                />
                            )}
                        </View>

                        <View className="px-6">
                            {activeTab === 'squint' ? (
                                <SquintControls
                                    blurIntensity={blurIntensity}
                                    setBlurIntensity={setBlurIntensity}
                                    maxBlur={MAX_BLUR}
                                />
                            ) : (
                                <ValueControls
                                    grayscaleEnabled={grayscaleEnabled}
                                    setGrayscaleEnabled={setGrayscaleEnabled}
                                    temperatureEnabled={temperatureEnabled}
                                    setTemperatureEnabled={handleTemperatureToggle}
                                />
                            )}
                        </View>
                    </ScrollView>
                </View>
                <PaywallModal ref={paywallRef} />
            </SafeAreaView>
        </SceneTransition>
    );
}
