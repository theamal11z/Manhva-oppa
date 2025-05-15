import { supabase } from './supabaseClient';
import { updateUserRecommendations, checkRecommendationsStatus } from './recommendationEngine';

/**
 * Schedule recommendations updates for all users
 * This function should be called periodically (e.g., once a day)
 */
export const scheduleRecommendationUpdates = async (): Promise<void> => {
  try {
    console.log('Starting scheduled recommendation updates');
    
    // Get all users with outdated recommendations
    const { data: users, error } = await supabase
      .from('user_recommendations')
      .select('user_id')
      .lt('next_update', new Date().toISOString());
    
    if (error) throw error;
    
    console.log(`Found ${users?.length || 0} users needing recommendation updates`);
    
    // Update recommendations for each user
    if (users && users.length > 0) {
      for (const user of users) {
        try {
          await updateUserRecommendations(user.user_id);
          console.log(`Updated recommendations for user: ${user.user_id}`);
        } catch (userError) {
          console.error(`Error updating recommendations for user ${user.user_id}:`, userError);
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling recommendation updates:', error);
  }
};

/**
 * Check if a specific user's recommendations need updating
 * and update them if needed
 */
export const checkAndUpdateRecommendations = async (userId: string): Promise<boolean> => {
  try {
    const status = await checkRecommendationsStatus(userId);
    
    if (status.needsUpdate) {
      console.log(`Recommendations need update for user ${userId}`);
      return await updateUserRecommendations(userId);
    }
    
    console.log(`Recommendations are up to date for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error checking recommendations status:', error);
    return false;
  }
};

/**
 * Set up recommendation update scheduling
 * This should be called when the application starts
 */
export const initRecommendationScheduler = (): void => {
  // Run the scheduler immediately
  scheduleRecommendationUpdates().catch(console.error);
  
  // Schedule to run daily
  setInterval(() => {
    scheduleRecommendationUpdates().catch(console.error);
  }, 24 * 60 * 60 * 1000); // Once per day
};

// Re-export for convenience
export { updateUserRecommendations } from './recommendationEngine';
