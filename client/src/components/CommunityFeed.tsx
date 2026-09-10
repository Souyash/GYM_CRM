import React, { useState, useEffect } from 'react';
import {
  Users,
  Flame,
  Trophy,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Clock,
  Pin,
  Trash2,
  Send,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Crown,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

interface PostAuthor {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

interface PostCommentItem {
  id: string;
  text: string;
  createdAt: string;
  author: PostAuthor;
}

interface CommunityPostData {
  id: string;
  content: string;
  tag?: string | null;
  imageUrl?: string | null;
  isPinned: boolean;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  likesCount: number;
  hasLiked: boolean;
  commentsCount: number;
  comments: PostCommentItem[];
}

interface GroupClass {
  id: string;
  title: string;
  coach: string;
  time: string;
  duration: string;
  zone: string;
  maxSeats: number;
  bookedSeats: number;
  intensity: 'High' | 'Moderate' | 'Recovery';
  isBooked?: boolean;
}

interface BuddyRequest {
  id: string;
  memberName: string;
  workoutFocus: string;
  scheduledTime: string;
  gymZone: string;
  lookingFor: string;
  joinedCount: number;
  hasJoined?: boolean;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  visitsThisMonth: number;
  streakDays: number;
  badge: string;
  isCurrentUser?: boolean;
}

function formatTimeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.max(1, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const CommunityFeed: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'feed' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'classes' | 'buddies' | 'leaderboard'>(
    (defaultTab as any) || 'feed'
  );

  // Live Community Posts State
  const [posts, setPosts] = useState<CommunityPostData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Post Creator State
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [postContent, setPostContent] = useState<string>('');
  const [postTag, setPostTag] = useState<string>('General');
  const [isPinnedByStaff, setIsPinnedByStaff] = useState<boolean>(false);
  const [postNotice, setPostNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Comments State
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentInputText, setCommentInputText] = useState<{ [postId: string]: string }>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<{ [postId: string]: boolean }>({});

  const isStaffOrAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

  // Load posts from backend
  const loadPosts = async (tagToFilter?: string) => {
    try {
      setIsLoadingPosts(true);
      const tag = tagToFilter !== undefined ? tagToFilter : selectedTag;
      const data = await api.getCommunityPosts(tag);
      setPosts(data.posts || []);
    } catch (err: any) {
      console.error('Failed to load community posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPosts(selectedTag);
  }, [selectedTag]);

  // Real-time WebSocket event listeners
  useEffect(() => {
    const socket = getSocket();

    const handlePostCreated = (newPost: CommunityPostData) => {
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        // Pinned posts at top, then newest
        if (newPost.isPinned) {
          return [newPost, ...prev];
        }
        const pinnedList = prev.filter((p) => p.isPinned);
        const unpinnedList = prev.filter((p) => !p.isPinned);
        return [...pinnedList, newPost, ...unpinnedList];
      });
    };

    const handlePostDeleted = ({ postId }: { postId: string }) => {
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    const handlePostPinned = ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      setPosts((prev) => {
        const updated = prev.map((p) => (p.id === postId ? { ...p, isPinned } : p));
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
    };

    const handleLikeUpdated = ({
      postId,
      likesCount,
      userId,
      liked
    }: {
      postId: string;
      likesCount: number;
      userId: string;
      liked: boolean;
    }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              likesCount,
              hasLiked: user?.id === userId ? liked : p.hasLiked
            };
          }
          return p;
        })
      );
    };

    const handleCommentCreated = ({ postId, comment }: { postId: string; comment: PostCommentItem }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            if (p.comments.some((c) => c.id === comment.id)) return p;
            return {
              ...p,
              commentsCount: p.commentsCount + 1,
              comments: [...p.comments, comment]
            };
          }
          return p;
        })
      );
    };

    const handleCommentDeleted = ({ postId, commentId }: { postId: string; commentId: string }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: Math.max(0, p.commentsCount - 1),
              comments: p.comments.filter((c) => c.id !== commentId)
            };
          }
          return p;
        })
      );
    };

    socket.on('community:post_created', handlePostCreated);
    socket.on('community:post_deleted', handlePostDeleted);
    socket.on('community:post_pinned', handlePostPinned);
    socket.on('community:post_like_updated', handleLikeUpdated);
    socket.on('community:comment_created', handleCommentCreated);
    socket.on('community:comment_deleted', handleCommentDeleted);

    return () => {
      socket.off('community:post_created', handlePostCreated);
      socket.off('community:post_deleted', handlePostDeleted);
      socket.off('community:post_pinned', handlePostPinned);
      socket.off('community:post_like_updated', handleLikeUpdated);
      socket.off('community:comment_created', handleCommentCreated);
      socket.off('community:comment_deleted', handleCommentDeleted);
    };
  }, [user?.id]);

  // Handle Post Creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    try {
      setIsCreatingPost(true);
      setPostNotice(null);

      const res = await api.createCommunityPost({
        content: postContent.trim(),
        tag: isStaffOrAdmin && postTag === 'General' ? 'Announcement' : postTag,
        isPinned: isStaffOrAdmin ? isPinnedByStaff : false
      });

      setPostContent('');
      setPostTag(isStaffOrAdmin ? 'Announcement' : 'General');
      setIsPinnedByStaff(false);
      setPostNotice({ type: 'success', message: 'Post published to the IronVault Community!' });

      // If socket didn't immediately fire, append locally
      setPosts((prev) => {
        if (prev.some((p) => p.id === res.post.id)) return prev;
        return res.post.isPinned ? [res.post, ...prev] : [...prev.filter((p) => p.isPinned), res.post, ...prev.filter((p) => !p.isPinned)];
      });

      setTimeout(() => setPostNotice(null), 3000);
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setPostNotice({ type: 'error', message: err.message || 'Failed to publish post.' });
    } finally {
      setIsCreatingPost(false);
    }
  };

  // Handle Like Toggle
  const handleToggleLike = async (postId: string) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
          };
        }
        return p;
      })
    );

    try {
      const res = await api.toggleLikePost(postId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return { ...p, hasLiked: res.liked, likesCount: res.likesCount };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
      loadPosts();
    }
  };

  // Handle Pin / Unpin (Manager or Admin only)
  const handleTogglePin = async (postId: string) => {
    if (!isStaffOrAdmin) return;
    try {
      const res = await api.togglePinPost(postId);
      setPosts((prev) => {
        const updated = prev.map((p) => (p.id === postId ? { ...p, isPinned: res.isPinned } : p));
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update pin status.');
    }
  };

  // Handle Post Deletion (Author or Staff/Admin Moderation)
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to remove this post from the community feed?')) {
      return;
    }

    try {
      await api.deleteCommunityPost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  // Handle Add Comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputText[postId]?.trim();
    if (!text) return;

    try {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      const res = await api.addPostComment(postId, text);

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: p.commentsCount + 1,
              comments: [...p.comments, res.comment]
            };
          }
          return p;
        })
      );

      setCommentInputText((prev) => ({ ...prev, [postId]: '' }));
    } catch (err: any) {
      alert(err.message || 'Failed to add comment.');
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.deletePostComment(postId, commentId);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: Math.max(0, p.commentsCount - 1),
              comments: p.comments.filter((c) => c.id !== commentId)
            };
          }
          return p;
        })
      );
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment.');
    }
  };

  // Group Classes State (Interactive Demo)
  const [classes, setClasses] = useState<GroupClass[]>([
    {
      id: 'gc1',
      title: 'High-Octane HIIT & Core',
      coach: 'Coach Elena',
      time: '05:30 PM Today',
      duration: '45 min',
      zone: 'Functional Turf Zone',
      maxSeats: 16,
      bookedSeats: 12,
      intensity: 'High',
      isBooked: false
    },
    {
      id: 'gc2',
      title: 'Powerlifting Heavy Squat Clinic',
      coach: 'Coach Marcus',
      time: '06:30 PM Today',
      duration: '60 min',
      zone: 'Olympic Lifting Platforms',
      maxSeats: 10,
      bookedSeats: 8,
      intensity: 'High',
      isBooked: false
    },
    {
      id: 'gc3',
      title: 'Athletic Mobility & Deep Recovery',
      coach: 'Sarah Jenkins',
      time: '07:30 AM Tomorrow',
      duration: '40 min',
      zone: 'Mind & Body Studio',
      maxSeats: 20,
      bookedSeats: 14,
      intensity: 'Recovery',
      isBooked: false
    }
  ]);

  // Workout Buddies State (Interactive Demo)
  const [buddies, setBuddies] = useState<BuddyRequest[]>([
    {
      id: 'b1',
      memberName: 'Jordan Miller',
      workoutFocus: 'Chest & Back Hypertrophy',
      scheduledTime: 'Today @ 6:00 PM',
      gymZone: 'Free Weights & Dumbbell Area',
      lookingFor: 'Looking for a spotter on heavy incline dumbbells and supersets!',
      joinedCount: 1,
      hasJoined: false
    },
    {
      id: 'b2',
      memberName: 'Taylor Brooks',
      workoutFocus: '5K Treadmill Pace Run',
      scheduledTime: 'Tomorrow @ 7:00 AM',
      gymZone: 'Cardio Deck',
      lookingFor: 'Doing 5K interval pacing (~7:30 min/mile). Join for morning energy!',
      joinedCount: 2,
      hasJoined: false
    }
  ]);

  const [isBuddyModalOpen, setIsBuddyModalOpen] = useState(false);
  const [buddyFocus, setBuddyFocus] = useState('');
  const [buddyTime, setBuddyTime] = useState('');
  const [buddyNote, setBuddyNote] = useState('');

  // Leaderboard State
  const [leaderboard] = useState<LeaderboardUser[]>([
    { rank: 1, name: 'Jordan Miller', visitsThisMonth: 22, streakDays: 14, badge: '🥇 Gold Tier' },
    { rank: 2, name: user?.fullName || 'Alex Rivera', visitsThisMonth: 18, streakDays: 7, badge: '🥈 Silver Tier', isCurrentUser: true },
    { rank: 3, name: 'Taylor Brooks', visitsThisMonth: 16, streakDays: 6, badge: '🥉 Bronze Tier' },
    { rank: 4, name: 'Sarah Jenkins', visitsThisMonth: 15, streakDays: 5, badge: 'Pro Lifter' },
    { rank: 5, name: 'Marcus Vance', visitsThisMonth: 14, streakDays: 4, badge: 'Daily Grinder' }
  ]);

  const handleToggleBookClass = (classId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const booked = c.isBooked;
          return {
            ...c,
            isBooked: !booked,
            bookedSeats: booked ? c.bookedSeats - 1 : c.bookedSeats + 1
          };
        }
        return c;
      })
    );
  };

  const handleToggleJoinBuddy = (buddyId: string) => {
    setBuddies((prev) =>
      prev.map((b) => {
        if (b.id === buddyId) {
          const joined = b.hasJoined;
          return {
            ...b,
            hasJoined: !joined,
            joinedCount: joined ? b.joinedCount - 1 : b.joinedCount + 1
          };
        }
        return b;
      })
    );
  };

  const handleCreateBuddyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buddyFocus.trim() || !buddyTime.trim()) return;

    const newBuddy: BuddyRequest = {
      id: 'b_' + Date.now(),
      memberName: user?.fullName || 'Alex Rivera',
      workoutFocus: buddyFocus.trim(),
      scheduledTime: buddyTime.trim(),
      gymZone: 'Free Weights / Main Floor',
      lookingFor: buddyNote.trim() || 'Ready to lift and push each other!',
      joinedCount: 0,
      hasJoined: true
    };

    setBuddies([newBuddy, ...buddies]);
    setBuddyFocus('');
    setBuddyTime('');
    setBuddyNote('');
    setIsBuddyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Community Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 dark:bg-zinc-900 rounded-2xl border border-slate-300/60 dark:border-zinc-800 text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('feed')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'feed'
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Community Feed</span>
          {posts.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center">
              {posts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'classes'
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Group Classes</span>
          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center">
            {classes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('buddies')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'buddies'
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Workout Buddies</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
            activeTab === 'leaderboard'
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Leaderboard</span>
        </button>
      </div>

      {/* TAB 1: ALL COMMUNITY FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          {/* Post Creator Box */}
          <div className="app-card p-4 sm:p-5 space-y-4 border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {user?.fullName || 'User'}
                  </span>
                  {user?.role === 'SUPER_ADMIN' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40 flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5" />
                      Gym Owner
                    </span>
                  )}
                  {user?.role === 'MANAGER' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40 flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      Front Desk Staff
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isStaffOrAdmin
                    ? 'Publish an official gym announcement, WOD, or event to all members'
                    : 'Share a workout milestone, PR, fitness question, or encouragement'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={
                  isStaffOrAdmin
                    ? 'Write an official gym announcement, schedule update, or workout of the day...'
                    : 'Share a workout PR, ask for advice, or celebrate consistency...'
                }
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />

              {/* Tag Selection & Staff Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Tag:
                  </span>
                  {(isStaffOrAdmin
                    ? ['Announcement', 'Workout of the Day', 'Motivation', 'General']
                    : ['Member PR', 'Workout of the Day', 'Motivation', 'Nutrition', 'General']
                  ).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPostTag(t)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                        postTag === t
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-sm'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  {/* Pin to Top Toggle (Staff & Admin Only) */}
                  {isStaffOrAdmin && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-700 dark:text-amber-400 select-none">
                      <input
                        type="checkbox"
                        checked={isPinnedByStaff}
                        onChange={(e) => setIsPinnedByStaff(e.target.checked)}
                        className="rounded border-amber-400 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                      />
                      <Pin className="w-3.5 h-3.5" />
                      <span>Pin to Top 📌</span>
                    </label>
                  )}

                  <button
                    type="submit"
                    disabled={isCreatingPost || !postContent.trim()}
                    className="px-5 py-2 rounded-xl btn-primary-green text-xs font-black flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isCreatingPost ? 'Publishing...' : 'Post Update'}</span>
                  </button>
                </div>
              </div>

              {postNotice && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
                    postNotice.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                  }`}
                >
                  {postNotice.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <span>{postNotice.message}</span>
                </div>
              )}
            </form>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 shrink-0">Filter:</span>
            {['All', 'Announcement', 'Workout of the Day', 'Member PR', 'Motivation', 'General'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
                  selectedTag === tag
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-sm'
                    : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Posts Stream */}
          {isLoadingPosts ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Loading community feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="app-card p-10 text-center space-y-3 border border-dashed border-slate-300 dark:border-zinc-800 rounded-3xl">
              <MessageSquare className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-base text-slate-800 dark:text-white">No posts in this category yet</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                Be the first to share an update, milestone, or announcement with the IronVault gym community!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const isAuthor = user?.id === post.author.id;
                const canModerate = isAuthor || isStaffOrAdmin;

                return (
                  <div
                    key={post.id}
                    className={`app-card p-4 sm:p-5 space-y-3.5 transition rounded-3xl border ${
                      post.isPinned
                        ? 'border-emerald-500/40 bg-emerald-50/15 dark:bg-emerald-950/10 shadow-md ring-1 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-zinc-800 shadow-sm'
                    }`}
                  >
                    {/* Pinned Header Notice */}
                    {post.isPinned && (
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-3 py-1 rounded-xl w-fit">
                        <Pin className="w-3.5 h-3.5 fill-current" />
                        <span>Pinned Official Announcement</span>
                      </div>
                    )}

                    {/* Post Author Info & Moderation Controls */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md text-white ${
                            post.author.role === 'SUPER_ADMIN'
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                              : post.author.role === 'MANAGER'
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          }`}
                        >
                          {post.author.fullName.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {post.author.fullName}
                            </span>

                            {/* Role Badges */}
                            {post.author.role === 'SUPER_ADMIN' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40 flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" />
                                Gym Owner
                              </span>
                            )}
                            {post.author.role === 'MANAGER' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40 flex items-center gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                Front Desk Staff
                              </span>
                            )}
                            {post.author.role === 'MEMBER' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                                Member
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(post.createdAt)}</span>
                            {post.tag && (
                              <>
                                <span>•</span>
                                <span className="font-bold text-slate-600 dark:text-zinc-300">{post.tag}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Management & Moderation Buttons */}
                      <div className="flex items-center gap-1">
                        {/* Pin / Unpin Button (Admin & Front Desk) */}
                        {isStaffOrAdmin && (
                          <button
                            onClick={() => handleTogglePin(post.id)}
                            title={post.isPinned ? 'Unpin this post' : 'Pin post to top of feed'}
                            className={`p-2 rounded-xl transition text-xs flex items-center gap-1 ${
                              post.isPinned
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <Pin className={`w-3.5 h-3.5 ${post.isPinned ? 'fill-current' : ''}`} />
                            <span className="hidden sm:inline text-[11px] font-bold">
                              {post.isPinned ? 'Pinned' : 'Pin'}
                            </span>
                          </button>
                        )}

                        {/* Delete Button (Author or Staff Moderation) */}
                        {canModerate && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title={isAuthor ? 'Delete your post' : 'Moderate: Delete member post'}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                      {post.content}
                    </p>

                    {/* Interaction Buttons (Likes & Comments) */}
                    <div className="pt-2 flex items-center gap-2 sm:gap-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 transition ${
                          post.hasLiked
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-black'
                            : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${post.hasLiked ? 'fill-current' : ''}`} />
                        <span>{post.likesCount} High-Fives</span>
                      </button>

                      <button
                        onClick={() =>
                          setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)
                        }
                        className={`py-1.5 px-3 rounded-xl font-bold flex items-center gap-1.5 transition ${
                          openCommentsPostId === post.id
                            ? 'bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-white'
                            : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.commentsCount} Comments</span>
                      </button>
                    </div>

                    {/* Comments Drawer / Thread */}
                    {openCommentsPostId === post.id && (
                      <div className="space-y-3 pt-2 pl-1 sm:pl-2 border-l-2 border-emerald-500/40 mt-2 animate-fade-in">
                        {post.comments.length > 0 ? (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {post.comments.map((comment) => {
                              const isCommentAuthor = user?.id === comment.author.id;
                              const canModerateComment = isCommentAuthor || isStaffOrAdmin;

                              return (
                                <div
                                  key={comment.id}
                                  className="bg-slate-50 dark:bg-zinc-900/80 p-2.5 rounded-xl text-xs space-y-1 border border-slate-200/60 dark:border-zinc-800 relative group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-[11px] text-slate-900 dark:text-white">
                                        {comment.author.fullName}
                                      </span>
                                      {comment.author.role === 'SUPER_ADMIN' && (
                                        <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                          Owner
                                        </span>
                                      )}
                                      {comment.author.role === 'MANAGER' && (
                                        <span className="text-[9px] font-bold px-1.5 py-0 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                          Staff
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                        {formatTimeAgo(comment.createdAt)}
                                      </span>
                                      {canModerateComment && (
                                        <button
                                          onClick={() => handleDeleteComment(post.id, comment.id)}
                                          title="Delete comment"
                                          className="text-slate-400 hover:text-rose-600 transition p-0.5"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-slate-800 dark:text-zinc-200 text-xs">{comment.text}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 dark:text-zinc-500 italic">
                            No comments yet. Start the conversation!
                          </p>
                        )}

                        {/* Comment Input */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Write a supportive comment or reply..."
                            value={commentInputText[post.id] || ''}
                            onChange={(e) =>
                              setCommentInputText({ ...commentInputText, [post.id]: e.target.value })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={isSubmittingComment[post.id] || !commentInputText[post.id]?.trim()}
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black transition disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROUP CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((c) => (
              <div
                key={c.id}
                className="app-card p-4 sm:p-5 space-y-3 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        c.intensity === 'High'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                      }`}
                    >
                      {c.intensity} Intensity
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{c.duration}</span>
                  </div>

                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-2">{c.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Coach: <span className="font-bold text-slate-800 dark:text-zinc-200">{c.coach}</span>
                  </p>

                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-600 dark:text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{c.time}</span>
                    <span className="text-slate-300 dark:text-zinc-700">•</span>
                    <span>{c.zone}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    <span className="font-black text-slate-900 dark:text-white">{c.bookedSeats}</span> /{' '}
                    {c.maxSeats} Spots Reserved
                  </span>

                  <button
                    onClick={() => handleToggleBookClass(c.id)}
                    className={`py-1.5 px-4 rounded-xl text-xs font-black transition ${
                      c.isBooked
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                        : 'btn-primary-green'
                    }`}
                  >
                    {c.isBooked ? 'Cancel Spot' : 'Reserve Spot'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WORKOUT BUDDIES */}
      {activeTab === 'buddies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Find partners to train with on heavy lift days or cardio sessions.
            </p>
            <button
              onClick={() => setIsBuddyModalOpen(true)}
              className="py-1.5 px-3 rounded-xl btn-primary-green text-xs font-black flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post Buddy Call</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buddies.map((b) => (
              <div
                key={b.id}
                className="app-card p-4 sm:p-5 space-y-3 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{b.workoutFocus}</h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">By {b.memberName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                    {b.scheduledTime}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-zinc-300 italic">"{b.lookingFor}"</p>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-zinc-400">
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{b.joinedCount}</span>{' '}
                    partner(s) joined
                  </span>

                  <button
                    onClick={() => handleToggleJoinBuddy(b.id)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                      b.hasJoined
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-black'
                        : 'btn-primary-green'
                    }`}
                  >
                    {b.hasJoined ? 'Joined ✓' : "I'm In!"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Create Buddy Modal */}
          {isBuddyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-poppins">
              <div className="app-card w-full max-w-md p-6 space-y-4 rounded-3xl border border-slate-200 dark:border-zinc-800">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Post Workout Buddy Request</h3>

                <form onSubmit={handleCreateBuddyRequest} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      Workout Focus / Target Muscle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Heavy Legs & Squats, 5K Treadmill Run..."
                      value={buddyFocus}
                      onChange={(e) => setBuddyFocus(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      Target Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Today @ 6:30 PM, Tomorrow 7 AM..."
                      value={buddyTime}
                      onChange={(e) => setBuddyTime(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                      Notes / What are you looking for?
                    </label>
                    <textarea
                      placeholder="e.g. Need a spot on 225 lb bench press and high energy!"
                      value={buddyNote}
                      onChange={(e) => setBuddyNote(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBuddyModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 rounded-xl btn-primary-green text-xs font-black">
                      Post Call
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            {/* 2nd Place */}
            <div className="app-card p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1 mt-4">
              <span className="text-xl">🥈</span>
              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{leaderboard[1]?.name}</p>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                {leaderboard[1]?.visitsThisMonth} Visits
              </p>
            </div>

            {/* 1st Place */}
            <div className="app-card p-3 sm:p-4 rounded-2xl border-2 border-amber-500/50 dark:border-amber-400/50 space-y-1 shadow-md bg-amber-50/20 dark:bg-amber-950/20">
              <span className="text-2xl">🥇</span>
              <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                {leaderboard[0]?.name}
              </p>
              <p className="text-xs font-black text-amber-600 dark:text-amber-400">
                {leaderboard[0]?.visitsThisMonth} Visits
              </p>
            </div>

            {/* 3rd Place */}
            <div className="app-card p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-1 mt-4">
              <span className="text-xl">🥉</span>
              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{leaderboard[2]?.name}</p>
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                {leaderboard[2]?.visitsThisMonth} Visits
              </p>
            </div>
          </div>

          <div className="app-card rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80 border border-slate-200 dark:border-zinc-800">
            {leaderboard.map((item) => (
              <div
                key={item.rank}
                className={`p-3.5 sm:p-4 flex items-center justify-between ${
                  item.isCurrentUser
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 text-center font-black text-xs ${
                      item.rank === 1
                        ? 'text-amber-500'
                        : item.rank === 2
                        ? 'text-slate-400'
                        : item.rank === 3
                        ? 'text-amber-700'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    #{item.rank}
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      {item.isCurrentUser && (
                        <span className="badge-active-green text-[9px] py-0 px-1.5 font-bold">You</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{item.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 block">
                    {item.visitsThisMonth} Visits
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 justify-end">
                    <Flame className="w-2.5 h-2.5 text-amber-500 fill-current" />
                    {item.streakDays}d Streak
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
