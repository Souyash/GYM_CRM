import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import {
  emitNewCommunityPost,
  emitDeleteCommunityPost,
  emitPostPinnedChanged,
  emitPostLikeUpdated,
  emitNewPostComment,
  emitDeletePostComment
} from '../services/socket.service.js';

/**
 * Fetch all community posts with author profiles, like counts, and comments
 */
export async function getCommunityPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const currentUserId = req.user?.userId;
    const { tag } = req.query;

    const posts = await prisma.communityPost.findMany({
      where: tag && tag !== 'All' ? { tag: String(tag) } : undefined,
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

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ error: 'Post content cannot be empty.' });
      return;
    }

    const isStaffOrAdmin = userRole === 'SUPER_ADMIN' || userRole === 'MANAGER';

    const post = await prisma.communityPost.create({
      data: {
        authorId: userId,
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
