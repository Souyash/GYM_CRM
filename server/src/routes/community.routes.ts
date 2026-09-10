import { Router } from 'express';
import {
  getCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  togglePinPost,
  toggleLikePost,
  addPostComment,
  deletePostComment,
  getGroupClasses,
  createGroupClass,
  deleteGroupClass,
  toggleBookClass,
  getLiveLeaderboard
} from '../controllers/community.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = Router();

// Feed posts
router.get('/posts', authenticateJWT, getCommunityPosts);
router.post('/posts', authenticateJWT, createCommunityPost);
router.delete('/posts/:id', authenticateJWT, deleteCommunityPost);
router.patch('/posts/:id/pin', authenticateJWT, togglePinPost);

// Post interactions (Likes & Comments)
router.post('/posts/:id/like', authenticateJWT, toggleLikePost);
router.post('/posts/:id/comments', authenticateJWT, addPostComment);
router.delete('/posts/:postId/comments/:commentId', authenticateJWT, deletePostComment);

// Group Classes (Front Desk / Admin schedule, Members book)
router.get('/classes', authenticateJWT, getGroupClasses);
router.post('/classes', authenticateJWT, createGroupClass);
router.delete('/classes/:id', authenticateJWT, deleteGroupClass);
router.post('/classes/:id/book', authenticateJWT, toggleBookClass);

// Live Turnstile-driven Leaderboard
router.get('/leaderboard', authenticateJWT, getLiveLeaderboard);

export default router;


