import { useGridStore } from '@/store/useGridStore';
import React from 'react';
import { View } from 'react-native';

interface GridOverlayProps {
    width: number;
    height: number;
    imageWidth: number;
    imageHeight: number;
}

/**
 * Renders grid lines over the image area only (not the padding around it).
 * Must be placed inside the same Animated.View as the image so it
 * transforms with zoom/pan automatically.
 */
export const GridOverlay = React.memo(({ width, height, imageWidth, imageHeight }: GridOverlayProps) => {
    const { enabled, selectedGrid, gridOpacity, gridColor } = useGridStore();

    if (!enabled || !selectedGrid || imageWidth <= 0 || imageHeight <= 0) return null;

    const { rows, cols } = selectedGrid;

    // Calculate the image display rect (same logic as ColorSkiaCanvas contain fit)
    const scale = Math.min(width / imageWidth, height / imageHeight);
    const displayW = imageWidth * scale;
    const displayH = imageHeight * scale;
    const offsetX = (width - displayW) / 2;
    const offsetY = (height - displayH) / 2;

    // Convert hex color to rgba with opacity
    const r = parseInt(gridColor.slice(1, 3), 16);
    const g = parseInt(gridColor.slice(3, 5), 16);
    const b = parseInt(gridColor.slice(5, 7), 16);
    const lineColor = `rgba(${r}, ${g}, ${b}, ${gridOpacity})`;
    const lineWidth = 1;

    // Vertical lines (cols - 1 inner lines)
    const verticalLines = [];
    for (let i = 1; i < cols; i++) {
        const x = offsetX + (displayW / cols) * i;
        verticalLines.push(
            <View
                key={`v-${i}`}
                style={{
                    position: 'absolute',
                    left: x,
                    top: offsetY,
                    width: lineWidth,
                    height: displayH,
                    backgroundColor: lineColor,
                }}
            />
        );
    }

    // Horizontal lines (rows - 1 inner lines)
    const horizontalLines = [];
    for (let i = 1; i < rows; i++) {
        const y = offsetY + (displayH / rows) * i;
        horizontalLines.push(
            <View
                key={`h-${i}`}
                style={{
                    position: 'absolute',
                    left: offsetX,
                    top: y,
                    width: displayW,
                    height: lineWidth,
                    backgroundColor: lineColor,
                }}
            />
        );
    }

    // Border around the image area
    return (
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width,
                height,
            }}
            pointerEvents="none"
        >
            {/* Image border */}
            <View
                style={{
                    position: 'absolute',
                    left: offsetX,
                    top: offsetY,
                    width: displayW,
                    height: displayH,
                    borderWidth: lineWidth,
                    borderColor: lineColor,
                }}
            />
            {verticalLines}
            {horizontalLines}
        </View>
    );
});
