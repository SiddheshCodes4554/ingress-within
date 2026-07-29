import { supabase } from '../../db';

export class FavoriteRepository {
  private static memoryFavorites: Set<string> = new Set(); // key: `${userId}:${interventionId}`

  /**
   * Adds an intervention to user favorites.
   */
  async addFavorite(userId: string, interventionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('intervention_favorites')
        .upsert([{ user_id: userId, intervention_id: interventionId }], { onConflict: 'user_id,intervention_id' });

      if (!error) return true;
    } catch (e) {
      console.warn('[FavoriteRepository] DB addFavorite fallback:', e);
    }

    FavoriteRepository.memoryFavorites.add(`${userId}:${interventionId}`);
    return true;
  }

  /**
   * Removes an intervention from user favorites.
   */
  async removeFavorite(userId: string, interventionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('intervention_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('intervention_id', interventionId);

      if (!error) return true;
    } catch (e) {
      console.warn('[FavoriteRepository] DB removeFavorite fallback:', e);
    }

    FavoriteRepository.memoryFavorites.delete(`${userId}:${interventionId}`);
    return true;
  }

  /**
   * Checks if an intervention is favorited by a user.
   */
  async isFavorite(userId: string, interventionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('intervention_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('intervention_id', interventionId)
        .maybeSingle();

      if (!error && data) return true;
      if (!error && !data) return false;
    } catch (e) {
      console.warn('[FavoriteRepository] DB isFavorite fallback:', e);
    }

    return FavoriteRepository.memoryFavorites.has(`${userId}:${interventionId}`);
  }

  /**
   * Gets list of intervention IDs favorited by a user.
   */
  async getUserFavoriteIds(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('intervention_favorites')
        .select('intervention_id')
        .eq('user_id', userId);

      if (!error && data) {
        return data.map((d) => d.intervention_id);
      }
    } catch (e) {
      console.warn('[FavoriteRepository] DB getUserFavoriteIds fallback:', e);
    }

    const favs: string[] = [];
    const prefix = `${userId}:`;
    for (const key of FavoriteRepository.memoryFavorites) {
      if (key.startsWith(prefix)) {
        favs.push(key.substring(prefix.length));
      }
    }
    return favs;
  }
}
