'use server';

import { sql } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// User actions
export async function createUser(clerkId: string, email: string, name?: string, imageUrl?: string) {
  try {
    await sql`
      INSERT INTO users (id, clerk_id, email, name, image_url, theme_preference)
      VALUES (gen_random_uuid(), ${clerkId}, ${email || ''}, ${name || ''}, ${imageUrl || ''}, 'dark')
      ON CONFLICT (clerk_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUserTheme(theme: 'light' | 'dark') {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    await sql`
      UPDATE users 
      SET theme_preference = ${theme}, updated_at = NOW()
      WHERE clerk_id = ${userId}
    `;
  } catch (error) {
    console.error('Error updating user theme:', error);
    throw error;
  }
}

export async function getUserTheme() {
  const { userId } = await auth();
  if (!userId) return 'dark'; // Default theme

  try {
    const result = await sql`
      SELECT theme_preference FROM users WHERE clerk_id = ${userId}
    `;
    const user = result[0];
    return user?.theme_preference || 'dark';
  } catch (error) {
    console.error('Error getting user theme:', error);
    return 'dark'; // Default theme on error
  }
}

// Room actions
export async function createRoom(name: string, description?: string, imageUrl?: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  try {
    // Ensure user exists
    await createUser(userId, '', '', '');
    
    // Get the user's database ID
    const [user] = await sql`
      SELECT id FROM users WHERE clerk_id = ${userId}
    `;
    
    if (!user) {
      throw new Error('User not found in database');
    }

    // Create room with proper foreign key
    const result = await sql`
      INSERT INTO rooms (title, description, image_url, created_by, visibility)
      VALUES (${name}, ${description}, ${imageUrl}, ${user.id}, 'private')
      RETURNING id, title, description, image_url, created_at, visibility
    `;
    
    const room = result[0];
    
    // Add user as owner (member_count will be updated by trigger)
    await sql`
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (${room.id}, ${user.id}, 'owner')
    `;
    
    return {
      id: room.id,
      name: room.title,
      description: room.description,
      image_url: room.image_url,
      created_at: room.created_at
    };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

export async function getUserRooms() {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    // Get the user's database ID
    const [user] = await sql`
      SELECT id FROM users WHERE clerk_id = ${userId}
    `;
    
    if (!user) {
      return []; // User not found, return empty array
    }

    // Use the actual table structure: title instead of name
    const result = await sql`
      SELECT r.id, r.title, r.description, r.image_url, r.created_at, r.status, r.member_count
      FROM rooms r
      WHERE r.created_by = ${user.id}
      ORDER BY r.created_at DESC
    `;
    return result.map(room => ({
      id: room.id,
      name: room.title, // Map title back to name for our app
      description: room.description,
      image_url: room.image_url,
      created_at: room.created_at
    }));
  } catch (error) {
    console.error('Error getting user rooms:', error);
    return [];
  }
}

// User management actions
export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  console.log('getDbUserId - clerkId from auth:', clerkId);
  
  if (!clerkId) {
    console.log('getDbUserId - No clerkId found');
    return null;
  }
  
  try {
    const [user] = await sql`
      SELECT id FROM users WHERE clerk_id = ${clerkId}
    `;
    console.log('getDbUserId - Found user in database:', user);
    return user?.id || null;
  } catch (error) {
    console.error('Error getting database user ID:', error);
    return null;
  }
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();
    console.log('getRandomUsers - userId:', userId);
    
    if (!userId) {
      console.log('getRandomUsers - No userId found, returning empty array');
      return [];
    }

    // First, let's check how many total users exist
    const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('getRandomUsers - Total users in database:', totalUsers[0]?.count);

    // Get 3 random users excluding ourselves and users we already follow
    const randomUsers = await sql`
      SELECT u.id, u.name, u.email, u.image_url, u.clerk_id
      FROM users u
      WHERE u.id != ${userId}
      AND u.id NOT IN (
        SELECT f.following_id 
        FROM follows f 
        WHERE f.follower_id = ${userId}
        AND f.following_id IS NOT NULL
      )
      ORDER BY RANDOM()
      LIMIT 3
    `;
    
    console.log('getRandomUsers - Found random users:', randomUsers.length, randomUsers);
    
    return randomUsers.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous User',
      username: user.email?.split('@')[0] || 'user',
      image: user.image_url,
      clerkId: user.clerk_id
    }));
  } catch (error) {
    console.error('Error fetching random users:', error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: 'User not authenticated' };
    if (userId === targetUserId) return { success: false, error: 'You cannot follow yourself' };

    // First, create the follows table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS follows (
        follower_id UUID NOT NULL,
        following_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (follower_id, following_id)
      )
    `;

    // Check if already following
    const existingFollow = await sql`
      SELECT follower_id FROM follows 
      WHERE follower_id = ${userId} AND following_id = ${targetUserId}
    `;

    if (existingFollow.length > 0) {
      // Unfollow
      await sql`
        DELETE FROM follows 
        WHERE follower_id = ${userId} AND following_id = ${targetUserId}
      `;
      return { success: true, action: 'unfollowed' };
    } else {
      // Follow
      await sql`
        INSERT INTO follows (follower_id, following_id)
        VALUES (${userId}, ${targetUserId})
      `;
      return { success: true, action: 'followed' };
    }
  } catch (error) {
    console.error('Error in toggleFollow:', error);
    return { success: false, error: 'Error toggling follow' };
  }
}

