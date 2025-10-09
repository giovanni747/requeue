'use server';

import { sql } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// User actions
export async function createUser(clerkId: string, email: string, name?: string, imageUrl?: string) {
  try {
    await sql`
      INSERT INTO users (id, clerk_id, email, name, image_url, theme_preference)
      VALUES (gen_random_uuid(), ${clerkId}, ${email || ''}, ${name || null}, ${imageUrl || null}, 'dark')
      ON CONFLICT (clerk_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, users.name),
        image_url = COALESCE(EXCLUDED.image_url, users.image_url),
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

    // Return all rooms where the user is a member (including ones created by others)
    const result = await sql`
      SELECT r.id, r.title, r.description, r.image_url, r.created_at, r.status, r.member_count
      FROM rooms r
      INNER JOIN room_members rm ON rm.room_id = r.id
      WHERE rm.user_id = ${user.id}
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
        status VARCHAR(20) DEFAULT 'pending',
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
      // Follow with pending status
      await sql`
        INSERT INTO follows (follower_id, following_id, status)
        VALUES (${userId}, ${targetUserId}, 'pending')
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
             CASE WHEN f2.following_id IS NOT NULL THEN true ELSE false END as is_following,
             COALESCE(f.status, 'accepted') as status
      FROM users u
      INNER JOIN follows f ON f.following_id = ${userId} AND f.follower_id = u.id
      LEFT JOIN follows f2 ON f2.follower_id = ${userId} AND f2.following_id = u.id
      ORDER BY 
        CASE WHEN COALESCE(f.status, 'accepted') = 'pending' THEN 0 ELSE 1 END,
        u.name
    `;
    
    return followers.map(user => ({
      id: user.id,
      name: user.name || 'Anonymous User',
      email: user.email,
      username: user.email?.split('@')[0] || 'user',
      image: user.image_url,
      clerkId: user.clerk_id,
      isFollowing: user.is_following,
      requestStatus: user.status,
      isPending: user.status === 'pending'
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
      AND role IN ('owner', 'admin', 'member')
    `;

    if (roomMember.length === 0) {
      throw new Error('You do not have permission to invite users to this room');
    }

    // Create invitations for each user instead of directly adding them
    for (const targetUserId of userIds) {
      await sql`
        INSERT INTO room_invitations (room_id, inviter_id, invited_user_id, status)
        VALUES (${roomId}, ${userId}, ${targetUserId}, 'pending')
        ON CONFLICT (room_id, invited_user_id) DO NOTHING
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
      name: member.name && member.name.trim() !== '' ? member.name : 'Anonymous User',
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
      img: room.image_url || '/img.png',
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

export async function promoteMemberToOwner(roomId: string, memberId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if current user is an owner of the room
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${userId}
    `;

    if (userMembership.length === 0 || userMembership[0].role !== 'owner') {
      throw new Error('You do not have permission to promote members. Only owners can promote members to owner.');
    }

    // Check if target member exists in the room
    const targetMember = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${roomId} AND user_id = ${memberId}
    `;

    if (targetMember.length === 0) {
      throw new Error('Member not found in this room');
    }

    // Promote the member to owner
    await sql`
      UPDATE room_members 
      SET role = 'owner', updated_at = NOW()
      WHERE room_id = ${roomId} AND user_id = ${memberId}
    `;

    return { success: true, message: 'Member successfully promoted to owner' };
  } catch (error) {
    console.error('Error promoting member to owner:', error);
    throw error;
  }
}

// Task management actions
export async function createTask(
  roomId: string, 
  title: string, 
  description?: string, 
  positionX: number = 0, 
  positionY: number = 0,
  priority: 'low' | 'medium' | 'high' = 'medium',
  color: string = '#fef3c7',
  dueDate?: string
) {
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

    // Create the task with 'todo' status by default
    const result = await sql`
      INSERT INTO tasks (room_id, title, description, position_x, position_y, created_by, priority, color, due_date, status)
      VALUES (${roomId}, ${title}, ${description || ''}, ${positionX}, ${positionY}, ${userId}, ${priority}, ${color}, ${dueDate || null}, 'todo')
      RETURNING id, title, description, position_x, position_y, created_at, assigned_to, priority, color, due_date, status
    `;

    const task = result[0];

    // Log task creation activity (only if task_activities table exists)
    try {
      await sql`
        INSERT INTO task_activities (task_id, user_id, action, new_value)
        VALUES (${task.id}::uuid, ${userId}::uuid, 'created', ${JSON.stringify({ title, description, priority })})
      `;
    } catch (activityError) {
      console.warn('Could not log task activity:', activityError);
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      position: { x: task.position_x, y: task.position_y },
      createdAt: task.created_at,
      assignedTo: task.assigned_to,
      priority: task.priority,
      color: task.color,
      dueDate: task.due_date,
      status: task.status
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

export async function getRoomTasks(roomId: string) {
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

    // Get all tasks for the room with assigned user info and creator info
    const tasks = await sql`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.position_x,
        t.position_y,
        t.created_at,
        t.assigned_to,
        t.created_by,
        t.priority,
        t.color,
        t.due_date,
        t.status,
        t.estimated_hours,
        t.actual_hours,
        u_assigned.name as assigned_name,
        u_assigned.image_url as assigned_avatar,
        u_creator.name as creator_name,
        u_creator.image_url as creator_avatar
      FROM tasks t
      LEFT JOIN users u_assigned ON u_assigned.id = t.assigned_to
      LEFT JOIN users u_creator ON u_creator.id = t.created_by
      WHERE t.room_id = ${roomId} AND t.status != 'completed'
      ORDER BY t.created_at ASC
    `;

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      position: { x: task.position_x, y: task.position_y },
      createdAt: task.created_at,
      priority: task.priority,
      color: task.color,
      dueDate: task.due_date,
      status: task.status,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      assignedTo: task.assigned_to ? {
        id: task.assigned_to,
        name: task.assigned_name,
        avatar: task.assigned_avatar
      } : null,
      createdBy: {
        id: task.created_by,
        name: task.creator_name,
        avatar: task.creator_avatar
      }
    }));
  } catch (error) {
    console.error('Error fetching room tasks:', error);
    throw error;
  }
}

export async function updateTaskPosition(taskId: string, positionX: number, positionY: number) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user has permission to update this task
    const task = await sql`
      SELECT t.room_id, t.created_by, t.assigned_to
      FROM tasks t
      WHERE t.id = ${taskId}
    `;

    if (task.length === 0) {
      throw new Error('Task not found');
    }

    const taskData = task[0];

    // Check if user is the creator, assigned to, or room admin/owner
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${taskData.room_id} AND user_id = ${userId}
    `;

    const isRoomAdmin = userMembership.length > 0 && ['owner', 'admin'].includes(userMembership[0].role);
    const isCreator = taskData.created_by === userId;
    const isAssigned = taskData.assigned_to === userId;

    if (!isCreator && !isAssigned && !isRoomAdmin) {
      throw new Error('You do not have permission to update this task');
    }

    // Get current position for activity log
    const currentTask = await sql`
      SELECT position_x, position_y FROM tasks WHERE id = ${taskId}
    `;

    // Update the task position
    await sql`
      UPDATE tasks 
      SET position_x = ${positionX}, position_y = ${positionY}, updated_at = NOW()
      WHERE id = ${taskId}
    `;

    // Log position change activity
    if (currentTask.length > 0) {
      try {
        await sql`
          INSERT INTO task_activities (task_id, user_id, action, old_value, new_value)
          VALUES (${taskId}::uuid, ${userId}::uuid, 'moved', 
            ${JSON.stringify({ x: currentTask[0].position_x, y: currentTask[0].position_y })},
            ${JSON.stringify({ x: positionX, y: positionY })})
        `;
      } catch (activityError) {
        console.warn('Could not log task activity:', activityError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating task position:', error);
    throw error;
  }
}

export async function assignTaskToUser(taskId: string, assignedUserId?: string | null) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user has permission to assign this task
    const task = await sql`
      SELECT t.room_id, t.created_by, t.assigned_to
      FROM tasks t
      WHERE t.id = ${taskId}
    `;

    if (task.length === 0) {
      throw new Error('Task not found');
    }

    const taskData = task[0];

    // Check if user is the creator or room admin/owner OR if they're unassigning themselves
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${taskData.room_id} AND user_id = ${userId}
    `;

    const isRoomAdmin = userMembership.length > 0 && ['owner', 'admin'].includes(userMembership[0].role);
    const isCreator = taskData.created_by === userId;
    const isUnassigningSelf = assignedUserId === null && taskData.assigned_to === userId;
    const isSelfAssigning = (assignedUserId === undefined || assignedUserId === userId) && userMembership.length > 0;

    if (!isCreator && !isRoomAdmin && !isUnassigningSelf && !isSelfAssigning) {
      throw new Error('You do not have permission to assign this task');
    }

    // If assignedUserId is explicitly null, unassign
    // If undefined, assign to current user (self-assignment)
    const targetUserId = assignedUserId === null ? null : (assignedUserId || userId);

    // Update the task assignment
    if (targetUserId) {
      // If assigning to a user, set status to 'todo'
      await sql`
        UPDATE tasks 
        SET assigned_to = ${targetUserId}, status = 'todo', updated_at = NOW()
        WHERE id = ${taskId}
      `;
    } else {
      // If unassigning, just update assigned_to
      await sql`
        UPDATE tasks 
        SET assigned_to = null, updated_at = NOW()
        WHERE id = ${taskId}
      `;
    }

    // Log assignment activity
    try {
      await sql`
        INSERT INTO task_activities (task_id, user_id, action, old_value, new_value)
        VALUES (${taskId}::uuid, ${userId}::uuid, 'assigned', 
          ${taskData.assigned_to || null},
          ${targetUserId || null})
      `;
    } catch (activityError) {
      console.warn('Could not log task activity:', activityError);
    }

    // Get the assigned user info
    let assignedUser = null;
    if (targetUserId) {
      const userInfo = await sql`
        SELECT id, name, image_url FROM users WHERE id = ${targetUserId}
      `;
      if (userInfo.length > 0) {
        assignedUser = {
          id: userInfo[0].id,
          name: userInfo[0].name,
          avatar: userInfo[0].image_url
        };
      }
    }

    return { success: true, assignedUser };
  } catch (error) {
    console.error('Error assigning task:', error);
    throw error;
  }
}

export async function deleteTask(taskId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user has permission to delete this task
    const task = await sql`
      SELECT t.room_id, t.created_by
      FROM tasks t
      WHERE t.id = ${taskId}
    `;

    if (task.length === 0) {
      throw new Error('Task not found');
    }

    const taskData = task[0];

    // Check if user is the creator or room admin/owner
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${taskData.room_id} AND user_id = ${userId}
    `;

    const isRoomAdmin = userMembership.length > 0 && ['owner', 'admin'].includes(userMembership[0].role);
    const isCreator = taskData.created_by === userId;

    if (!isCreator && !isRoomAdmin) {
      throw new Error('You do not have permission to delete this task');
    }

    // Delete the task
    await sql`
      DELETE FROM tasks WHERE id = ${taskId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Update task status (todo, in_progress, completed, cancelled)
export async function updateTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'completed' | 'cancelled') {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user has permission to update this task
    const task = await sql`
      SELECT t.room_id, t.created_by, t.assigned_to, t.status, t.title
      FROM tasks t
      WHERE t.id = ${taskId}
    `;

    if (task.length === 0) {
      throw new Error('Task not found');
    }

    const taskData = task[0];

    // Check if user is the creator, assigned to, or room admin/owner
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${taskData.room_id} AND user_id = ${userId}
    `;

    const isRoomAdmin = userMembership.length > 0 && ['owner', 'admin'].includes(userMembership[0].role);
    const isCreator = taskData.created_by === userId;
    const isAssigned = taskData.assigned_to === userId;

    if (!isCreator && !isAssigned && !isRoomAdmin) {
      throw new Error('You do not have permission to update this task');
    }

    // If task is being completed, handle special logic
    if (status === 'completed') {
      return await completeTask(taskId, userId, taskData);
    }

    // Update the task status for non-completion statuses
    await sql`
      UPDATE tasks 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${taskId}
    `;

    // Log status change activity
    try {
      await sql`
        INSERT INTO task_activities (task_id, user_id, action, old_value, new_value)
        VALUES (${taskId}::uuid, ${userId}::uuid, 'status_changed', ${taskData.status}, ${status})
      `;
    } catch (activityError) {
      console.warn('Could not log task activity:', activityError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

// Complete task - move to history and notify room members
async function completeTask(taskId: string, userId: string, taskData: any) {
  try {
    // Get full task details before moving to history
    const fullTask = await sql`
      SELECT t.*, u.name as assigned_name, r.title as room_title
      FROM tasks t
      LEFT JOIN users u ON u.id = t.assigned_to
      LEFT JOIN rooms r ON r.id = t.room_id
      WHERE t.id = ${taskId}
    `;

    if (fullTask.length === 0) {
      throw new Error('Task not found');
    }

    const task = fullTask[0];

    // Move task to history table (generate new UUID for history entry)
    await sql`
      INSERT INTO task_history (
        id, room_id, title, description, position_x, position_y, 
        created_by, assigned_to, priority, color, due_date, status,
        estimated_hours, actual_hours, created_at, updated_at,
        completed_at, completed_by, room_title, assigned_name
      )
      VALUES (
        gen_random_uuid(), ${task.room_id}, ${task.title}, ${task.description},
        ${task.position_x}, ${task.position_y}, ${task.created_by},
        ${task.assigned_to}, ${task.priority}, ${task.color},
        ${task.due_date}, 'completed', ${task.estimated_hours},
        ${task.actual_hours}, ${task.created_at}, NOW(),
        NOW(), ${userId}, ${task.room_title}, ${task.assigned_name}
      )
    `;

    // Update task status to completed instead of deleting
    await sql`
      UPDATE tasks 
      SET status = 'completed', updated_at = NOW()
      WHERE id = ${taskId}
    `;

    // Get all room members to notify them
    const roomMembers = await sql`
      SELECT u.id, u.name, u.email
      FROM room_members rm
      JOIN users u ON u.id = rm.user_id
      WHERE rm.room_id = ${taskData.room_id} AND u.id != ${userId}
    `;

    // Create notifications for room members
    const notifications = roomMembers.map(member => ({
      user_id: member.id,
      type: 'TASK_COMPLETED',
      room_id: taskData.room_id,
      creator_id: userId
    }));

    // Insert notifications in batch
    if (notifications.length > 0) {
      for (const notification of notifications) {
        await sql`
          INSERT INTO notifications (user_id, type, room_id, creator_id)
          VALUES (${notification.user_id}, ${notification.type}, ${notification.room_id}, ${notification.creator_id})
        `;
      }
    }

    // Log completion activity
    try {
      await sql`
        INSERT INTO task_activities (task_id, user_id, action, old_value, new_value)
        VALUES (${taskId}::uuid, ${userId}::uuid, 'completed', ${taskData.status}, 'completed')
      `;
    } catch (activityError) {
      console.warn('Could not log task activity:', activityError);
    }

    return { 
      success: true, 
      taskTitle: task.title,
      roomTitle: task.room_title,
      assignedName: task.assigned_name,
      notificationCount: notifications.length
    };
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

// Get task activities for a specific task
export async function getTaskActivities(taskId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user has access to this task
    const task = await sql`
      SELECT t.room_id FROM tasks t WHERE t.id = ${taskId}
    `;

    if (task.length === 0) {
      throw new Error('Task not found');
    }

    // Check if user is a member of the room
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${task[0].room_id} AND user_id = ${userId}
    `;

    if (userMembership.length === 0) {
      throw new Error('You are not a member of this room');
    }

    // Get task activities with user info
    const activities = await sql`
      SELECT 
        ta.id,
        ta.action,
        ta.old_value,
        ta.new_value,
        ta.created_at,
        u.name as user_name,
        u.image_url as user_avatar
      FROM task_activities ta
      JOIN users u ON u.id = ta.user_id
      WHERE ta.task_id = ${taskId}
      ORDER BY ta.created_at DESC
    `;

    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      oldValue: activity.old_value,
      newValue: activity.new_value,
      createdAt: activity.created_at,
      user: {
        name: activity.user_name,
        avatar: activity.user_avatar
      }
    }));
  } catch (error) {
    console.error('Error fetching task activities:', error);
    throw error;
  }
}

export async function getRoomTaskStats(roomId: string) {
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

    // Get total tasks in the room
    const totalTasksResult = await sql`
      SELECT COUNT(*) as total
      FROM tasks
      WHERE room_id = ${roomId} AND status != 'cancelled'
    `;
    const totalTasksInRoom = parseInt(totalTasksResult[0]?.total) || 0;

    // Get task statistics for each member
    const stats = await sql`
      SELECT 
        u.id,
        u.name,
        u.image_url,
        COUNT(CASE WHEN t.assigned_to = u.id AND t.status != 'cancelled' THEN 1 END) as assigned_tasks,
        COUNT(CASE WHEN t.status = 'completed' AND t.assigned_to = u.id THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'in_progress' AND t.assigned_to = u.id THEN 1 END) as in_progress_tasks
      FROM users u
      INNER JOIN room_members rm ON rm.user_id = u.id
      LEFT JOIN tasks t ON t.room_id = ${roomId} AND t.status != 'cancelled'
      WHERE rm.room_id = ${roomId}
      GROUP BY u.id, u.name, u.image_url
      ORDER BY assigned_tasks DESC, u.name
    `;

    return stats.map(stat => ({
      id: stat.id,
      name: stat.name,
      avatar: stat.image_url,
      totalTasks: totalTasksInRoom,
      assignedTasks: parseInt(stat.assigned_tasks) || 0,
      completedTasks: parseInt(stat.completed_tasks) || 0,
      inProgressTasks: parseInt(stat.in_progress_tasks) || 0
    }));
  } catch (error) {
    console.error('Error fetching room task stats:', error);
    throw error;
  }
}

// Notification actions
export async function getNotifications() {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    const notifications = await sql`
      SELECT 
        n.id,
        n.type,
        n.read,
        n.created_at,
        n.room_id,
        n.room_invitation_id,
        u.id as creator_id,
        u.name as creator_name,
        u.image_url as creator_image,
        r.title as room_name,
        ri.status as invitation_status
      FROM notifications n
      LEFT JOIN users u ON n.creator_id = u.id
      LEFT JOIN rooms r ON n.room_id = r.id
      LEFT JOIN room_invitations ri ON n.room_invitation_id = ri.id
      WHERE n.user_id = ${userId}
      ORDER BY 
        n.read ASC,
        n.created_at DESC
      LIMIT 50
    `;

    return notifications.map(notif => ({
      id: notif.id,
      type: notif.type,
      read: notif.read,
      createdAt: notif.created_at,
      roomId: notif.room_id,
      roomName: notif.room_name,
      invitationId: notif.room_invitation_id,
      invitationStatus: notif.invitation_status,
      creator: {
        id: notif.creator_id,
        name: notif.creator_name,
        username: notif.creator_name, // Use name as username fallback
        image: notif.creator_image
      }
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    await sql`
      UPDATE notifications
      SET read = true, updated_at = NOW()
      WHERE id = ANY(${notificationIds}::uuid[]) AND user_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

export async function acceptRoomInvitation(invitationId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Get invitation details
    const invitation = await sql`
      SELECT room_id, invited_user_id
      FROM room_invitations
      WHERE id = ${invitationId} AND invited_user_id = ${userId} AND status = 'pending'
    `;

    if (invitation.length === 0) {
      throw new Error('Invitation not found or already processed');
    }

    const roomId = invitation[0].room_id;

    // Update invitation status
    await sql`
      UPDATE room_invitations
      SET status = 'accepted', updated_at = NOW()
      WHERE id = ${invitationId}
    `;

    // Add user to room
    await sql`
      INSERT INTO room_members (room_id, user_id, role, joined_at)
      VALUES (${roomId}, ${userId}, 'member', NOW())
      ON CONFLICT (room_id, user_id) DO NOTHING
    `;

    return { success: true, roomId };
  } catch (error) {
    console.error('Error accepting room invitation:', error);
    throw error;
  }
}

export async function declineRoomInvitation(invitationId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Update invitation status
    const result = await sql`
      UPDATE room_invitations
      SET status = 'declined', updated_at = NOW()
      WHERE id = ${invitationId} AND invited_user_id = ${userId} AND status = 'pending'
      RETURNING id
    `;

    if (result.length === 0) {
      throw new Error('Invitation not found or already processed');
    }

    return { success: true };
  } catch (error) {
    console.error('Error declining room invitation:', error);
    throw error;
  }
}

export async function acceptFollowRequest(followerId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Add status column to follows table if it doesn't exist
    try {
      await sql`
        ALTER TABLE follows ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'accepted'
      `;
    } catch (alterError) {
      // Column might already exist, that's fine
      console.log('Status column may already exist');
    }

    // Check if the follow request exists
    const followRequest = await sql`
      SELECT follower_id, status FROM follows 
      WHERE follower_id = ${followerId} AND following_id = ${userId}
    `;

    if (followRequest.length === 0) {
      throw new Error('Follow request not found');
    }

    // Update status to accepted
    await sql`
      UPDATE follows
      SET status = 'accepted'
      WHERE follower_id = ${followerId} AND following_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error accepting follow request:', error);
    throw error;
  }
}

export async function declineFollowRequest(followerId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Remove the follow relationship
    const result = await sql`
      DELETE FROM follows 
      WHERE follower_id = ${followerId} AND following_id = ${userId}
      RETURNING id
    `;

    if (result.length === 0) {
      throw new Error('Follow request not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Error declining follow request:', error);
    throw error;
  }
}

export async function getMyTasks() {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Get all tasks assigned to the current user across all rooms
    const tasks = await sql`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.position_x,
        t.position_y,
        t.created_at,
        t.assigned_to,
        t.created_by,
        t.priority,
        t.color,
        t.due_date,
        t.status,
        t.estimated_hours,
        t.actual_hours,
        r.id as room_id,
        r.title as room_title,
        r.image_url as room_image,
        u_assigned.name as assigned_name,
        u_assigned.image_url as assigned_avatar,
        u_creator.name as creator_name,
        u_creator.image_url as creator_avatar
      FROM tasks t
      INNER JOIN rooms r ON r.id = t.room_id
      LEFT JOIN users u_assigned ON u_assigned.id = t.assigned_to
      LEFT JOIN users u_creator ON u_creator.id = t.created_by
      WHERE t.assigned_to = ${userId}
      ORDER BY 
        CASE t.status 
          WHEN 'in_progress' THEN 1 
          WHEN 'todo' THEN 2 
          WHEN 'completed' THEN 3 
          ELSE 4 
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;

    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      position: { x: task.position_x, y: task.position_y },
      createdAt: task.created_at,
      priority: task.priority,
      color: task.color,
      dueDate: task.due_date,
      status: task.status,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      room: {
        id: task.room_id,
        title: task.room_title,
        image: task.room_image
      },
      assignedTo: task.assigned_to ? {
        id: task.assigned_to,
        name: task.assigned_name,
        avatar: task.assigned_avatar
      } : null,
      createdBy: {
        id: task.created_by,
        name: task.creator_name,
        avatar: task.creator_avatar
      }
    }));
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    throw error;
  }
}

export async function updateTaskPriority(taskId: string, priority: 'low' | 'medium' | 'high') {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    // Check if user has permission to update this task
    const task = await sql`
      SELECT t.room_id, t.assigned_to, t.created_by
      FROM tasks t
      WHERE t.id = ${taskId}
    `;

    if (task.length === 0) {
      throw new Error('Task not found');
    }

    const taskData = task[0];

    // Check if user is the creator, assigned to, or room admin/owner
    const userMembership = await sql`
      SELECT role FROM room_members 
      WHERE room_id = ${taskData.room_id} AND user_id = ${userId}
    `;

    const isRoomAdmin = userMembership.length > 0 && ['owner', 'admin'].includes(userMembership[0].role);
    const isCreator = taskData.created_by === userId;
    const isAssigned = taskData.assigned_to === userId;

    if (!isCreator && !isAssigned && !isRoomAdmin) {
      throw new Error('You do not have permission to update this task');
    }

    // Update the task priority
    await sql`
      UPDATE tasks 
      SET priority = ${priority}, updated_at = NOW()
      WHERE id = ${taskId}
    `;

    // Log priority change activity
    try {
      await sql`
        INSERT INTO task_activities (task_id, user_id, action, old_value, new_value)
        VALUES (${taskId}::uuid, ${userId}::uuid, 'priority_changed', 
          (SELECT priority FROM tasks WHERE id = ${taskId}),
          ${priority})
      `;
    } catch (activityError) {
      console.warn('Could not log task activity:', activityError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating task priority:', error);
    throw error;
  }
}

// Get task history for a user
export async function getTaskHistory(roomId?: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    let query;
    if (roomId) {
      // Get history for specific room
      query = sql`
        SELECT 
          th.id, th.title, th.description, th.priority, th.color,
          th.due_date, th.status, th.estimated_hours, th.actual_hours,
          th.created_at, th.completed_at, th.completed_by, th.room_title,
          th.assigned_name, u.name as completed_by_name
        FROM task_history th
        LEFT JOIN users u ON u.id = th.completed_by
        WHERE th.room_id = ${roomId}
        ORDER BY th.completed_at DESC
      `;
    } else {
      // Get all history for user (tasks they were assigned to or completed)
      query = sql`
        SELECT 
          th.id, th.title, th.description, th.priority, th.color,
          th.due_date, th.status, th.estimated_hours, th.actual_hours,
          th.created_at, th.completed_at, th.completed_by, th.room_title,
          th.assigned_name, u.name as completed_by_name
        FROM task_history th
        LEFT JOIN users u ON u.id = th.completed_by
        WHERE th.assigned_to = ${userId} OR th.completed_by = ${userId}
        ORDER BY th.completed_at DESC
      `;
    }

    const history = await query;

    return history.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      color: task.color,
      dueDate: task.due_date,
      status: task.status,
      estimatedHours: task.estimated_hours,
      actualHours: task.actual_hours,
      createdAt: task.created_at,
      completedAt: task.completed_at,
      completedBy: task.completed_by,
      roomTitle: task.room_title,
      assignedName: task.assigned_name,
      completedByName: task.completed_by_name
    }));
  } catch (error) {
    console.error('Error fetching task history:', error);
    throw error;
  }
}

export async function getMonthlyTaskAnalytics() {
  try {
    const userId = await getDbUserId();
    if (!userId) throw new Error('Unauthorized');

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = currentDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Get completed tasks this month (from both active tasks and history)
    const completedThisMonth = await sql`
      SELECT COUNT(*) as count FROM (
        SELECT DISTINCT t.id FROM tasks t
        WHERE t.assigned_to = ${userId} AND t.status = 'completed'
        AND t.updated_at >= ${startOfMonth} AND t.updated_at <= ${endOfMonth}
        UNION
        SELECT DISTINCT th.id FROM task_history th
        WHERE th.assigned_to = ${userId} AND th.status = 'completed'
        AND th.completed_at >= ${startOfMonth} AND th.completed_at <= ${endOfMonth}
      ) as combined
    `;

    // Get total completed tasks (from both active tasks and history)
    const totalCompleted = await sql`
      SELECT COUNT(*) as count FROM (
        SELECT DISTINCT t.id FROM tasks t
        WHERE t.assigned_to = ${userId} AND t.status = 'completed'
        UNION
        SELECT DISTINCT th.id FROM task_history th
        WHERE th.assigned_to = ${userId} AND th.status = 'completed'
      ) as combined
    `;

    // Get total assigned tasks
    const totalAssigned = await sql`
      SELECT COUNT(*) as count
      FROM tasks t
      WHERE t.assigned_to = ${userId}
    `;

    // Get daily completion data for the current month (from history table)
    const dailyData = await sql`
      SELECT DATE(th.completed_at) as task_date,
        COUNT(DISTINCT th.id) as completed,
        0 as total_tasks
      FROM task_history th
      WHERE th.assigned_to = ${userId} AND th.status = 'completed'
      AND th.completed_at >= ${startOfMonth} AND th.completed_at <= ${endOfMonth}
      GROUP BY DATE(th.completed_at) ORDER BY task_date
    `;

    // Get weekly completion data for the current month
    const weeklyCompletions = await sql`
      SELECT EXTRACT(WEEK FROM th.completed_at) as week_number,
        COUNT(DISTINCT th.id) as tasks_completed
      FROM task_history th
      WHERE th.assigned_to = ${userId} AND th.status = 'completed'
      AND th.completed_at >= ${startOfMonth} AND th.completed_at <= ${endOfMonth}
      GROUP BY EXTRACT(WEEK FROM th.completed_at) ORDER BY week_number
    `;

    // Calculate completion streak (consecutive days with at least one completed task)
    const completionStreak = await sql`
      WITH daily_completions AS (
        SELECT DATE(th.completed_at) as completion_date, COUNT(DISTINCT th.id) as tasks_completed
        FROM task_history th 
        WHERE th.assigned_to = ${userId} AND th.status = 'completed'
        GROUP BY DATE(th.completed_at) 
        ORDER BY completion_date DESC
      ), 
      streak_calculation AS (
        SELECT 
          completion_date, 
          tasks_completed,
          completion_date - (ROW_NUMBER() OVER (ORDER BY completion_date DESC))::integer * INTERVAL '1 day' as streak_group
        FROM daily_completions
      )
      SELECT COUNT(*) as current_streak 
      FROM streak_calculation
      WHERE streak_group = (SELECT MAX(streak_group) FROM streak_calculation)
      AND completion_date >= CURRENT_DATE - INTERVAL '30 days'
    `;

    return {
      completedThisMonth: parseInt(completedThisMonth[0]?.count) || 0,
      totalCompleted: parseInt(totalCompleted[0]?.count) || 0,
      totalAssigned: parseInt(totalAssigned[0]?.count) || 0,
      dailyCompletions: dailyData.map(day => ({
        date: day.task_date,
        tasksCompleted: parseInt(day.completed) || 0,
        totalTasks: parseInt(day.total_tasks) || 0
      })),
      weeklyCompletions: weeklyCompletions.map(week => ({
        week: parseInt(week.week_number),
        tasksCompleted: parseInt(week.tasks_completed) || 0
      })),
      currentStreak: parseInt(completionStreak[0]?.current_streak) || 0,
      currentMonth: currentMonth,
      currentYear: currentYear
    };
  } catch (error) {
    console.error('Error fetching monthly task analytics:', error);
    throw error;
  }
}

