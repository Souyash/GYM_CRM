import { Router } from 'express';
import {
  getCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  togglePinPost,
  toggleLikePost,
  addPostComment,
  deletePostComment
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

export default router;
