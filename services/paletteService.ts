import { supabase } from '@/lib/supabase';

export interface Palette {
    id: string;
    user_id: string;
    name: string;
    colors: string[];
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface SavePaletteInput {
    name: string;
    colors: string[];
    image_url?: string | null;
}

/**
 * Save a new palette to the database
 */
export async function savePalette(input: SavePaletteInput): Promise<{ data: Palette | null; error: Error | null }> {
    try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return { data: null, error: new Error('User not authenticated') };
        }

        // Insert palette
        const { data, error } = await supabase
            .from('palettes')
            .insert({
                user_id: user.id,
                name: input.name,
                colors: input.colors,
                image_url: input.image_url || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving palette:', error);
            return { data: null, error: new Error(error.message) };
        }

        return { data, error: null };
    } catch (err) {
        console.error('Unexpected error saving palette:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Load all palettes for the current user
 */
export async function loadPalettes(): Promise<{ data: Palette[] | null; error: Error | null }> {
    try {
        // Get current user
        console.log('🔄 loadPalettes: Getting user...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error('❌ loadPalettes: User auth error:', userError);
            return { data: null, error: new Error('User not authenticated') };
        }
        console.log('👤 loadPalettes: User ID:', user.id);

        // Fetch palettes
        const { data, error } = await supabase
            .from('palettes')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ loadPalettes: Supabase error:', error);
            return { data: null, error: new Error(error.message) };
        }

        console.log(`✅ loadPalettes: Found ${data?.length} palettes`);
        return { data, error: null };
    } catch (err) {
        console.error('❌ loadPalettes: Unexpected error:', err);
        return { data: null, error: err as Error };
    }
}

/**
 * Delete a palette by ID
 */
export async function deletePalette(paletteId: string): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase
            .from('palettes')
            .delete()
            .eq('id', paletteId);

        if (error) {
            console.error('Error deleting palette:', error);
            return { error: new Error(error.message) };
        }

        return { error: null };
    } catch (err) {
        console.error('Unexpected error deleting palette:', err);
        return { error: err as Error };
    }
}

/**
 * Update a palette name
 */
export async function updatePaletteName(paletteId: string, name: string): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase
            .from('palettes')
            .update({ name })
            .eq('id', paletteId);

        if (error) {
            console.error('Error updating palette:', error);
            return { error: new Error(error.message) };
        }

        return { error: null };
    } catch (err) {
        console.error('Unexpected error updating palette:', err);
        return { error: err as Error };
    }
}
