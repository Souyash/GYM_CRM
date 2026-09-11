import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest, resolveTenantGymId } from '../middleware/auth.middleware.js';
import {
  emitNewCommunityPost,
  emitDeleteCommunityPost,
  emitPostPinnedChanged,
  emitPostLikeUpdated,
  emitNewPostComment,
  emitDeletePostComment,
  emitClassCreated,
  emitClassDeleted,
  emitClassBookingUpdated
} from '../services/socket.service.js';
import { sendClassBookingEmail } from '../services/email.service.js';

/**
 * Fetch all community posts with author profiles, like counts, and comments
 */
export async function getCommunityPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    const { tag } = req.query;
    const callerGymId = resolveTenantGymId(req);

    const where: any = {};
    if (tag && tag !== 'All') where.tag = String(tag);
    if (callerGymId) {
      where.OR = [{ gymId: callerGymId }, { facilityId: callerGymId }];
    }

    const posts = await prisma.communityPost.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true
          }
        },
        likes: {
          select: {
            userId: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                role: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      content: p.content,
      tag: p.tag,
      imageUrl: p.imageUrl,
      isPinned: p.isPinned,
      isOfficial: p.isOfficial,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: p.author,
      likesCount: p.likes.length,
      hasLiked: currentUserId ? p.likes.some((l) => l.userId === currentUserId) : false,
      commentsCount: p.comments.length,
      comments: p.comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        author: c.author
      }))
    }));

    res.json({ posts: formattedPosts });
  } catch (error: any) {
    console.error('getCommunityPosts error:', error);
    res.status(500).json({ error: 'Failed to retrieve community posts.' });
  }
}

/**
 * Create a new community post
 */
export async function createCommunityPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { content, tag, imageUrl, isPinned } = req.body;
    const callerGymId = resolveTenantGymId(req);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Post content cannot be empty.' });
      return;
    }

    const isStaffOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'GYM_OWNER' || userRole === 'MANAGER';

    const post = await prisma.communityPost.create({
      data: {
        authorId: userId,
        gymId: callerGymId,
        facilityId: callerGymId,
        content: content.trim(),
        tag: tag || (isStaffOrAdmin ? 'Announcement' : 'General'),
        imageUrl: imageUrl || null,
        isPinned: isStaffOrAdmin ? Boolean(isPinned) : false,
        isOfficial: isStaffOrAdmin
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true
          }
        },
        likes: true,
        comments: true
      }
    });

    const formatted = {
      id: post.id,
      content: post.content,
      tag: post.tag,
      imageUrl: post.imageUrl,
      isPinned: post.isPinned,
      isOfficial: post.isOfficial,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author,
      likesCount: 0,
      hasLiked: false,
      commentsCount: 0,
      comments: []
    };

    emitNewCommunityPost(formatted);

    res.status(201).json({
      message: 'Post created successfully.',
      post: formatted
    });
  } catch (error: any) {
    console.error('createCommunityPost error:', error);
    res.status(500).json({ error: 'Failed to create community post.' });
  }
}

/**
 * Delete a post (Author, Manager, or Super Admin)
 */
export async function deleteCommunityPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const post = await prisma.communityPost.findUnique({
      where: { id }
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    const isAuthor = post.authorId === userId;
    const isStaffOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'MANAGER';

    if (!isAuthor && !isStaffOrAdmin) {
      res.status(403).json({ error: 'Permission denied. You can only delete your own posts.' });
      return;
    }

    await prisma.communityPost.delete({
      where: { id }
    });

    emitDeleteCommunityPost(id);

    res.json({ message: 'Post deleted successfully.', postId: id });
  } catch (error: any) {
    console.error('deleteCommunityPost error:', error);
    res.status(500).json({ error: 'Failed to delete community post.' });
  }
}

/**
 * Pin or Unpin a post (Manager or Super Admin only)
 */
export async function togglePinPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'MANAGER') {
      res.status(403).json({ error: 'Only gym managers and owners can pin announcements.' });
      return;
    }

    const post = await prisma.communityPost.findUnique({
      where: { id }
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    const updated = await prisma.communityPost.update({
      where: { id },
      data: { isPinned: !post.isPinned }
    });

    emitPostPinnedChanged({ postId: id, isPinned: updated.isPinned });

    res.json({
      message: updated.isPinned ? 'Post pinned to top of feed.' : 'Post unpinned.',
      postId: id,
      isPinned: updated.isPinned
    });
  } catch (error: any) {
    console.error('togglePinPost error:', error);
    res.status(500).json({ error: 'Failed to update pin status.' });
  }
}

/**
 * Toggle high-five / like on a post
 */
export async function toggleLikePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId
        }
      }
    });

    let liked = false;
    if (existingLike) {
      await prisma.postLike.delete({
        where: { id: existingLike.id }
      });
      liked = false;
    } else {
      await prisma.postLike.create({
        data: {
          postId: id,
          userId
        }
      });
      liked = true;
    }

    const likesCount = await prisma.postLike.count({
      where: { postId: id }
    });

    emitPostLikeUpdated({
      postId: id,
      likesCount,
      userId,
      liked
    });

    res.json({
      liked,
      likesCount,
      postId: id
    });
  } catch (error: any) {
    console.error('toggleLikePost error:', error);
    res.status(500).json({ error: 'Failed to update like status.' });
  }
}

/**
 * Add a comment to a post
 */
export async function addPostComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const { text } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Comment text cannot be empty.' });
      return;
    }

    const comment = await prisma.postComment.create({
      data: {
        postId: id,
        authorId: userId,
        text: text.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true
          }
        }
      }
    });

    emitNewPostComment({
      postId: id,
      comment
    });

    res.status(201).json({
      message: 'Comment added successfully.',
      comment
    });
  } catch (error: any) {
    console.error('addPostComment error:', error);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
}

/**
 * Delete a comment (Author, Manager, or Super Admin)
 */
export async function deletePostComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId }
    });

    if (!comment || comment.postId !== postId) {
      res.status(404).json({ error: 'Comment not found.' });
      return;
    }

    const isAuthor = comment.authorId === userId;
    const isStaffOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'MANAGER';

    if (!isAuthor && !isStaffOrAdmin) {
      res.status(403).json({ error: 'Permission denied. You can only delete your own comments.' });
      return;
    }

    await prisma.postComment.delete({
      where: { id: commentId }
    });

    emitDeletePostComment({
      postId,
      commentId
    });

    res.json({ message: 'Comment deleted successfully.', commentId });
  } catch (error: any) {
    console.error('deletePostComment error:', error);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
}

// -------------------------------------------------------------
// GROUP CLASSES MANAGEMENT (Staff / Admin create, Members book)
// -------------------------------------------------------------

/**
 * Fetch all upcoming group classes with capacity and booking status for requester
 */
export async function getGroupClasses(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    const callerGymId = resolveTenantGymId(req);

    const where: any = {};
    if (callerGymId) {
      where.OR = [{ gymId: callerGymId }, { facilityId: callerGymId }];
    }

    const classes = await prisma.groupClass.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        bookings: {
          select: {
            userId: true
          }
        },
        createdBy: {
          select: {
            fullName: true,
            role: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    const formatted = classes.map((c) => {
      const bookedCount = c.bookings.length;
      const isBooked = c.bookings.some((b) => b.userId === currentUserId);

      return {
        id: c.id,
        title: c.title,
        coach: c.coach,
        startTime: c.startTime.toISOString(),
        durationMinutes: c.durationMinutes,
        duration: `${c.durationMinutes} min`,
        zone: c.zone,
        maxSeats: c.maxSeats,
        bookedSeats: bookedCount,
        availableSeats: Math.max(0, c.maxSeats - bookedCount),
        intensity: c.intensity,
        isBooked,
        gymId: c.gymId,
        facilityId: c.facilityId,
        createdAt: c.createdAt.toISOString()
      };
    });

    res.json({ classes: formatted });
  } catch (error: any) {
    console.error('getGroupClasses error:', error);
    res.status(500).json({ error: 'Failed to load group classes.' });
  }
}

/**
 * Create a new group class (Restricted to SUPER_ADMIN, GYM_OWNER and MANAGER)
 */
export async function createGroupClass(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const callerGymId = resolveTenantGymId(req);

    // Strict role enforcement: Only Gym Owners, Front Desk staff and Super Admin can schedule classes
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'GYM_OWNER' && userRole !== 'MANAGER') {
      res.status(403).json({
        error: 'Permission denied. Only gym administrators and front desk staff can schedule official group classes.'
      });
      return;
    }

    const {
      title,
      coach,
      startTime,
      durationMinutes,
      zone,
      maxSeats,
      intensity,
      gymId,
      facilityId
    } = req.body;

    if (!title || !coach || !startTime) {
      res.status(400).json({ error: 'Class title, coach name, and scheduled start time are required.' });
      return;
    }

    const parsedStartTime = new Date(startTime);
    if (isNaN(parsedStartTime.getTime())) {
      res.status(400).json({ error: 'Invalid date/time format for start time.' });
      return;
    }

    const targetGymId = callerGymId || gymId || facilityId || req.user?.facilityId || null;

    const newClass = await prisma.groupClass.create({
      data: {
        title: title.trim(),
        coach: coach.trim(),
        startTime: parsedStartTime,
        durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
        zone: zone ? zone.trim() : 'Functional Turf Zone',
        maxSeats: maxSeats ? Math.max(1, Number(maxSeats)) : 16,
        intensity: intensity ? intensity.trim() : 'Moderate',
        gymId: targetGymId,
        facilityId: targetGymId,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            fullName: true,
            role: true
          }
        }
      }
    });

    const payload = {
      id: newClass.id,
      title: newClass.title,
      coach: newClass.coach,
      startTime: newClass.startTime.toISOString(),
      durationMinutes: newClass.durationMinutes,
      duration: `${newClass.durationMinutes} min`,
      zone: newClass.zone,
      maxSeats: newClass.maxSeats,
      bookedSeats: 0,
      availableSeats: newClass.maxSeats,
      intensity: newClass.intensity,
      isBooked: false,
      facilityId: newClass.facilityId,
      createdAt: newClass.createdAt.toISOString()
    };

    // Broadcast live to all members & staff
    emitClassCreated(payload);

    res.status(201).json({ class: payload });
  } catch (error: any) {
    console.error('createGroupClass error:', error);
    res.status(500).json({ error: 'Failed to create group class.' });
  }
}

/**
 * Delete / Cancel a group class (Restricted to SUPER_ADMIN and MANAGER)
 */
export async function deleteGroupClass(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userRole = req.user?.role;
    const { id } = req.params;

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'MANAGER') {
      res.status(403).json({ error: 'Permission denied. Only gym staff and admins can cancel classes.' });
      return;
    }

    const targetClass = await prisma.groupClass.findUnique({
      where: { id }
    });

    if (!targetClass) {
      res.status(404).json({ error: 'Class not found.' });
      return;
    }

    await prisma.groupClass.delete({
      where: { id }
    });

    emitClassDeleted(id);

    res.json({ message: 'Class cancelled successfully.', classId: id });
  } catch (error: any) {
    console.error('deleteGroupClass error:', error);
    res.status(500).json({ error: 'Failed to delete group class.' });
  }
}

/**
 * Toggle Member Reservation on a Group Class
 */
export async function toggleBookClass(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { id: classId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const groupClass = await prisma.groupClass.findUnique({
      where: { id: classId },
      include: {
        bookings: true
      }
    });

    if (!groupClass) {
      res.status(404).json({ error: 'Group class not found.' });
      return;
    }

    const existingBooking = groupClass.bookings.find((b) => b.userId === userId);

    if (existingBooking) {
      // Cancel booking
      await prisma.classBooking.delete({
        where: { id: existingBooking.id }
      });

      const updatedCount = Math.max(0, groupClass.bookings.length - 1);

      emitClassBookingUpdated({
        classId,
        bookedSeats: updatedCount,
        maxSeats: groupClass.maxSeats,
        userId,
        isBooked: false
      });

      res.json({
        message: 'Reservation cancelled.',
        isBooked: false,
        bookedSeats: updatedCount,
        availableSeats: groupClass.maxSeats - updatedCount
      });
    } else {
      // Check seat availability
      if (groupClass.bookings.length >= groupClass.maxSeats) {
        res.status(400).json({ error: 'This class has reached full capacity. No seats left.' });
        return;
      }

      await prisma.classBooking.create({
        data: {
          classId,
          userId
        }
      });

      const updatedCount = groupClass.bookings.length + 1;

      emitClassBookingUpdated({
        classId,
        bookedSeats: updatedCount,
        maxSeats: groupClass.maxSeats,
        userId,
        isBooked: true
      });

      // Send class booking email confirmation asynchronously
      setImmediate(async () => {
        try {
          const bookingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true }
          });
          if (bookingUser) {
            await sendClassBookingEmail({
              toEmail: bookingUser.email,
              fullName: bookingUser.fullName,
              className: groupClass.title,
              coach: groupClass.coach,
              startTime: groupClass.startTime,
              zone: groupClass.zone
            });
          }
        } catch (e: any) {
          console.warn('Class booking email error:', e.message);
        }
      });

      res.json({
        message: 'Spot reserved successfully!',
        isBooked: true,
        bookedSeats: updatedCount,
        availableSeats: groupClass.maxSeats - updatedCount
      });
    }
  } catch (error: any) {
    console.error('toggleBookClass error:', error);
    res.status(500).json({ error: 'Failed to update class booking.' });
  }
}

// -------------------------------------------------------------
// LIVE TURNSTILE-DRIVEN LEADERBOARD
// Computed automatically from physical AttendanceEntry check-ins
// -------------------------------------------------------------

/**
 * Calculates current active training streak in days
 */
function computeMemberStreak(scannedDates: Date[]): number {
  if (!scannedDates || scannedDates.length === 0) return 0;

  // Extract unique calendar days YYYY-MM-DD in descending order
  const uniqueDays = Array.from(
    new Set(
      scannedDates.map((d) => {
        const dt = new Date(d);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  if (uniqueDays.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Streak continues if member attended today OR yesterday
  let currentStreak = 0;
  let checkDate: Date | null = null;

  if (uniqueDays[0] === todayStr) {
    checkDate = new Date(today);
  } else if (uniqueDays[0] === yesterdayStr) {
    checkDate = new Date(yesterday);
  } else {
    // If last attendance was before yesterday, return 0 or 1 if attended this week
    return 0;
  }

  for (const dayStr of uniqueDays) {
    const expectedStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (dayStr === expectedStr) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

/**
 * Fetch live calculated leaderboard rankings from real turnstile scans
 */
export async function getLiveLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    const callerGymId = resolveTenantGymId(req);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const whereClause: any = {
      scannedAt: { gte: startOfMonth }
    };
    if (callerGymId) {
      whereClause.OR = [{ gymId: callerGymId }, { facilityId: callerGymId }];
    }

    // Fetch this month's attendance logs
    const entries = await prisma.attendanceEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        scannedAt: 'desc'
      }
    });

    // Group scans by user
    const userScansMap = new Map<string, { user: any; dates: Date[]; totalDuration: number }>();

    for (const entry of entries) {
      if (!entry.user) continue;
      const existing = userScansMap.get(entry.userId);
      if (!existing) {
        userScansMap.set(entry.userId, {
          user: entry.user,
          dates: [entry.scannedAt],
          totalDuration: entry.sessionDurationMinutes || 0
        });
      } else {
        existing.dates.push(entry.scannedAt);
        existing.totalDuration += entry.sessionDurationMinutes || 0;
      }
    }

    // Also include active gym members so the leaderboard displays full roster if scans are fresh
    const allMembers = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        fullName: true,
        role: true,
        avatarUrl: true
      },
      take: 20
    });

    for (const member of allMembers) {
      if (!userScansMap.has(member.id)) {
        userScansMap.set(member.id, {
          user: member,
          dates: [],
          totalDuration: 0
        });
      }
    }

    // Build ranking list
    const rankedList: any[] = [];

    for (const [userId, record] of userScansMap.entries()) {
      const visitsThisMonth = record.dates.length;
      const streakDays = computeMemberStreak(record.dates);

      rankedList.push({
        userId,
        name: record.user.fullName,
        role: record.user.role,
        avatarUrl: record.user.avatarUrl,
        visitsThisMonth,
        streakDays,
        totalWorkoutMinutes: record.totalDuration,
        isCurrentUser: userId === currentUserId
      });
    }

    // Sort descending by visitsThisMonth, then by streakDays
    rankedList.sort((a, b) => {
      if (b.visitsThisMonth !== a.visitsThisMonth) {
        return b.visitsThisMonth - a.visitsThisMonth;
      }
      return b.streakDays - a.streakDays;
    });

    // Assign rank positions and awards
    const finalLeaderboard = rankedList.map((item, index) => {
      const rank = index + 1;
      let badge = 'Iron Athlete';
      if (rank === 1) badge = '🥇 Gold Tier';
      else if (rank === 2) badge = '🥈 Silver Tier';
      else if (rank === 3) badge = '🥉 Bronze Tier';
      else if (item.streakDays >= 5) badge = '🔥 Streak Master';
      else if (item.visitsThisMonth >= 10) badge = 'Daily Grinder';

      return {
        ...item,
        rank,
        badge
      };
    });

    res.json({
      leaderboard: finalLeaderboard,
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalActiveAthletes: finalLeaderboard.length
    });
  } catch (error: any) {
    console.error('getLiveLeaderboard error:', error);
    res.status(500).json({ error: 'Failed to calculate live leaderboard.' });
  }
}


