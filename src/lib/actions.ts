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

export async function searchUsers(query: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const users = await sql`
      SELECT u.id, u.name, u.email, u.image_url, u.clerk_id,
             CASE WHEN f.following_id IS NOT NULL THEN true ELSE false END as is_following
      FROM users u
      LEFT JOIN follows f ON f.follower_id = ${userId} AND f.following_id = u.id
      WHERE u.id != ${userId}
      AND (
        LOWER(u.name) ILIKE LOWER(${'%' + query + '%'}) OR
        LOWER(u.email) ILIKE LOWER(${'%' + query + '%'})
      )
      ORDER BY 
        CASE WHEN f.following_id IS NOT NULL THEN 0 ELSE 1 END,
        u.name
      LIMIT 10
    `;
    
    return users.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous User',
      email: user.email,
      username: user.email?.split('@')[0] || 'user',
      image: user.image_url,
      clerkId: user.clerk_id,
      isFollowing: user.is_following
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

export async function getFollowing() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const following = await sql`
      SELECT u.id, u.name, u.email, u.image_url, u.clerk_id
      FROM users u
      INNER JOIN follows f ON f.follower_id = ${userId} AND f.following_id = u.id
      ORDER BY u.name
    `;
    
    return following.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous User',
      email: user.email,
      username: user.email?.split('@')[0] || 'user',
      image: user.image_url,
      clerkId: user.clerk_id,
      isFollowing: true
    }));
  } catch (error) {
    console.error('Error getting following:', error);
    return [];
  }
}

export async function getFollowers() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const followers = await sql`
      SELECT u.id, u.name, u.email, u.image_url, u.clerk_id,
             CASE WHEN f2.following_id IS NOT NULL THEN true ELSE false END as is_following
      FROM users u
      INNER JOIN follows f ON f.following_id = ${userId} AND f.follower_id = u.id
      LEFT JOIN follows f2 ON f2.follower_id = ${userId} AND f2.following_id = u.id
      ORDER BY u.name
    `;
    
    return followers.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous User',
      email: user.email,
      username: user.email?.split('@')[0] || 'user',
      image: user.image_url,
      clerkId: user.clerk_id,
      isFollowing: user.is_following
    }));
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
}

export async function sendEmailInvitation(email: string, roomId?: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Get user info for the invitation
    const [user] = await sql`
      SELECT id, name, email FROM users WHERE clerk_id = ${userId}
    `;
    
    if (!user) throw new Error('User not found');

    // Get room info if roomId is provided
    let roomInfo = null;
    if (roomId) {
      const [room] = await sql`
        SELECT title, description FROM rooms WHERE id = ${roomId}
      `;
      roomInfo = room;
    }

    // Import Resend dynamically to avoid issues if API key is not set
    if (!process.env.RESEND_API_KEY) {
      console.log(`Email invitation would be sent to ${email} for room ${roomInfo?.title || 'general'} by ${user.name}`);
      return { success: true, message: 'Invitation logged (Resend not configured)' };
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = roomId 
      ? `${baseUrl}/room/${roomId}?invite=true` 
      : `${baseUrl}/welcome?invite=true`;

    // Send the email
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [email],
      subject: roomInfo 
        ? `${user.name} invited you to join "${roomInfo.title}" on Requeue`
        : `${user.name} invited you to join Requeue`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">You're Invited!</h1>
            <p style="color: #666; font-size: 16px;">${user.name} has invited you to join ${roomInfo ? `"${roomInfo.title}"` : 'Requeue'}</p>
          </div>
          
          ${roomInfo ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">${roomInfo.title}</h3>
              ${roomInfo.description ? `<p style="margin: 0; color: #666;">${roomInfo.description}</p>` : ''}
            </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Join ${roomInfo ? 'Room' : 'Requeue'}
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              If you're not interested in joining, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 12px;">
              This invitation was sent by ${user.name} (${user.email})
            </p>
          </div>
        </div>
      `,
      text: `
${user.name} has invited you to join ${roomInfo ? `"${roomInfo.title}"` : 'Requeue'}!

${roomInfo?.description ? roomInfo.description : ''}

Join by clicking this link: ${inviteLink}

If you're not interested in joining, you can safely ignore this email.
This invitation was sent by ${user.name} (${user.email})
      `.trim()
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: 'Failed to send invitation email' };
    }

    console.log('Email sent successfully:', data);
    return { success: true, message: 'Invitation sent successfully' };
  } catch (error) {
    console.error('Error sending email invitation:', error);
    return { success: false, error: 'Failed to send invitation' };
  }
}

export async function inviteUsersToRoom(userIds: string[], roomId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user has permission to invite to this room
    const roomMember = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${userId}
      AND role IN ('owner', 'admin')
    `;

    if (roomMember.length === 0) {
      throw new Error('You do not have permission to invite users to this room');
    }

    // Add users to room
    for (const targetUserId of userIds) {
      await sql`
        INSERT INTO room_members (room_id, user_id, role)
        VALUES (${roomId}, ${targetUserId}, 'member')
        ON CONFLICT (room_id, user_id) DO NOTHING
      `;
    }

    return { success: true, message: `Successfully invited ${userIds.length} users` };
  } catch (error) {
    console.error('Error inviting users to room:', error);
    return { success: false, error: 'Failed to invite users' };
  }
}

export async function getRoomMembers(roomId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user is a member of this room
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${userId}
    `;

    if (userMembership.length === 0) {
      throw new Error('You are not a member of this room');
    }

    // Get all room members with their user details
    const members = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.image_url,
        u.clerk_id,
        rm.role,
        rm.joined_at
      FROM room_members rm
      INNER JOIN users u ON u.id = rm.user_id
      WHERE rm.room_id = ${roomId}
      ORDER BY 
        CASE rm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        rm.joined_at ASC
    `;

    return members.map(member => ({
      id: member.id,
      name: member.name || 'Anonymous User',
      email: member.email,
      avatar: member.image_url,
      role: member.role,
      joined_at: member.joined_at,
      clerkId: member.clerk_id,
      // For now, we'll set a default status since we don't have real-time status tracking
      status: 'online' as 'online' | 'away' | 'offline'
    }));
  } catch (error) {
    console.error('Error fetching room members:', error);
    throw error;
  }
}

export async function getRoomData(roomId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user is a member of this room
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${userId}
    `;

    if (userMembership.length === 0) {
      throw new Error('You are not a member of this room');
    }

    // Get room data with creator information
    const result = await sql`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.image_url,
        r.created_at,
        r.visibility,
        r.status,
        r.member_count,
        u.name as creator_name,
        u.image_url as creator_image
      FROM rooms r
      LEFT JOIN users u ON u.id = r.created_by
      WHERE r.id = ${roomId}
    `;

    if (result.length === 0) {
      throw new Error('Room not found');
    }

    const room = result[0];

    return {
      id: room.id,
      name: room.title,
      description: room.description || 'No description provided',
      img: room.image_url || `https://images.unsplash.com/photo-1572120360610-${roomId.slice(-8)}-d971b9d7767c?q=80&w=500&auto=format`,
      memberCount: room.member_count || 0,
      isPrivate: room.visibility === 'private',
      createdAt: new Date(room.created_at).toLocaleDateString(),
      status: room.status || 'active',
      creator: {
        name: room.creator_name || 'Unknown',
        image: room.creator_image
      }
    };
  } catch (error) {
    console.error('Error fetching room data:', error);
    throw error;
  }
}

