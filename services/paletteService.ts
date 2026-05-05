import { supabase } from '@/lib/supabase';

export type SaveType = 'palette' | 'studio' | 'squint' | 'valuemap';

export interface Palette {
    id: string;
    user_id: string;
    name: string;
    colors: string[] | null;
    image_url: string | null;
    type: SaveType;
    effects: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

export interface SavePaletteInput {
    name: string;
    colors?: string[] | null;
    image_url?: string | null;
    type?: SaveType;
    effects?: Record<string, any> | null;
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
                colors: input.colors ?? null,
                image_url: input.image_url || null,
                type: input.type || 'palette',
                effects: input.effects ?? null,
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
 * Delete a palette by ID.
 *
 * This also cleans up the associated reference image from both R2 and
 * Supabase Storage (whichever actually hold it). The storage cleanup
 * happens AFTER the DB row is deleted — if it fails, the palette is
 * still gone from the user's perspective, and the image becomes an
 * orphan we can clean up later. DB-first ordering guarantees a stuck
 * cleanup call can never block the user from deleting their palette.
 */
export async function deletePalette(paletteId: string): Promise<{ error: Error | null }> {
    try {
        // 1. Fetch image_url BEFORE deleting, so we know what to clean up.
        //    We intentionally do not fail the whole operation if this read
        //    errors — we just skip cleanup and still try the delete.
        let imageUrl: string | null = null;
        try {
            const { data, error: fetchErr } = await supabase
                .from('palettes')
                .select('image_url')
                .eq('id', paletteId)
                .maybeSingle();
            if (fetchErr) {
                console.warn('[deletePalette] could not read image_url:', fetchErr);
            } else {
                imageUrl = data?.image_url ?? null;
            }
        } catch (e) {
            console.warn('[deletePalette] image_url prefetch exception:', e);
        }

        // 2. Delete the DB row.
        const { error } = await supabase
            .from('palettes')
            .delete()
            .eq('id', paletteId);

        if (error) {
            console.error('Error deleting palette:', error);
            return { error: new Error(error.message) };
        }

        // 3. Fire-and-forget storage cleanup. Never blocks the caller.
        if (imageUrl) {
            supabase.functions
                .invoke('delete-palette-image', { body: { imageUrl } })
                .then(({ data, error: fnErr }) => {
                    if (fnErr) {
                        console.warn('[deletePalette] image cleanup failed:', fnErr);
                    } else {
                        console.log('[deletePalette] image cleanup:', data);
                    }
                })
                .catch((e) => {
                    console.warn('[deletePalette] image cleanup threw:', e);
                });
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

/**
 * Get the count of palettes for the current user (Efficient)
 */
export async function getPaletteCount(): Promise<number> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { count, error } = await supabase
            .from('palettes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (error) {
            console.error('Error getting palette count:', error);
            return 0;
        }

        return count || 0;
    } catch (err) {
        console.error('Unexpected error getting count:', err);
        return 0;
    }
}
