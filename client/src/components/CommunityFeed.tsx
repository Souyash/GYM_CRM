import React, { useState } from 'react';
import {
  Users,
  Flame,
  Trophy,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Heart,
  Share2,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Dumbbell,
  Send,
  UserPlus,
  PlusCircle,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Post {
  id: string;
  authorName: string;
  authorRole: 'COACH' | 'MEMBER';
  authorAvatar?: string;
  timeAgo: string;
  content: string;
  tag?: string;
  highFives: number;
  hasHighFived?: boolean;
  comments: { id: string; user: string; text: string; time: string }[];
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

export const CommunityFeed: React.FC<{ defaultTab?: string }> = ({ defaultTab = 'feed' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'classes' | 'buddies' | 'leaderboard'>(
    (defaultTab as any) || 'feed'
  );

  // Community Feed State
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'p1',
      authorName: 'Coach Elena (Head Trainer)',
      authorRole: 'COACH',
      timeAgo: '1h ago',
      content:
        '🔥 Today’s Workout of the Day (WOD):\n5 Rounds for time: 10 Deadlifts (bodyweight) + 15 Box Jumps + 200m Row sprint. Focus on strong core bracing on every rep! Who’s hitting it today?',
      tag: 'Workout of the Day',
      highFives: 28,
      hasHighFived: false,
      comments: [
        { id: 'c1', user: 'Marcus Vance', text: 'Crushed it at 6 AM, legs are toast! 💪', time: '45m ago' },
        { id: 'c2', user: 'Jordan Miller', text: 'Doing this at 5:30 PM, who wants to partner up?', time: '20m ago' }
      ]
    },
    {
      id: 'p2',
      authorName: 'Sarah Jenkins',
      authorRole: 'MEMBER',
      timeAgo: '3h ago',
      content:
        '🎉 Huge milestone today! Just hit my 6-month consistency streak and hit a new 185 lb bench press personal record. Love this community pushing each other every day!',
      tag: 'Member PR',
      highFives: 42,
      hasHighFived: true,
      comments: [
        { id: 'c3', user: 'Coach Elena', text: 'Form looked crisp! So proud of the dedication! 👏', time: '2h ago' }
      ]
    }
  ]);

  const [newCommentText, setNewCommentText] = useState<{ [postId: string]: string }>({});

  // Group Classes State
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

  // Workout Buddies State
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
    { rank: 5, name: 'Elena Rostova', visitsThisMonth: 14, streakDays: 4, badge: 'Daily Grinder' }
  ]);

  // Actions
  const handleToggleHighFive = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = p.hasHighFived;
          return {
            ...p,
            hasHighFived: !hasLiked,
            highFives: hasLiked ? p.highFives - 1 : p.highFives + 1
          };
        }
        return p;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentText[postId]?.trim();
    if (!text) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: 'c_' + Date.now(),
                user: user?.fullName || 'Alex Rivera',
                text,
                time: 'Just now'
              }
            ]
          };
        }
        return p;
      })
    );

    setNewCommentText((prev) => ({ ...prev, [postId]: '' }));
  };

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
    <div className="space-y-5">
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
          Community Feed
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
          Group Classes
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
          Workout Buddies
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
          Leaderboard
        </button>
      </div>

      {/* TAB 1: ALL COMMUNITY FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="community-card space-y-3.5">
              {/* Post Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                    {post.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {post.authorName}
                      </span>
                      {post.authorRole === 'COACH' && (
                        <span className="badge-active-green text-[10px] py-0 px-2 font-black">
                          COACH
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      {post.timeAgo}
                    </span>
                  </div>
                </div>

                {post.tag && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                    {post.tag}
                  </span>
                )}
              </div>

              {/* Post Content */}
              <p className="text-xs sm:text-sm text-slate-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                {post.content}
              </p>

              {/* Post Action Buttons */}
              <div className="pt-1 flex items-center gap-3 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  onClick={() => handleToggleHighFive(post.id)}
                  className={`social-pill ${
                    post.hasHighFived
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-black'
                      : ''
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${post.hasHighFived ? 'fill-current' : ''}`} />
                  <span>{post.highFives} High-Fives</span>
                </button>

                <div className="social-pill cursor-default">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.comments.length} Comments</span>
                </div>
              </div>

              {/* Comments Stream */}
              {post.comments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl text-xs space-y-0.5 border border-slate-100 dark:border-zinc-800/60"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-900 dark:text-white">
                          {c.user}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {c.time}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-zinc-300 text-xs">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Leave a comment or cheer..."
                  value={newCommentText[post.id] || ''}
                  onChange={(e) =>
                    setNewCommentText({ ...newCommentText, [post.id]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(post.id);
                  }}
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: GROUP CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Today's Live Group Fitness Sessions
            </h4>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Included in Your Pass
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {classes.map((c) => {
              const spotsLeft = c.maxSeats - c.bookedSeats;
              const fillPercent = (c.bookedSeats / c.maxSeats) * 100;

              return (
                <div key={c.id} className="community-card space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                          {c.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.intensity === 'High'
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {c.intensity} Intensity
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        Led by <span className="font-bold text-slate-800 dark:text-zinc-200">{c.coach}</span> • {c.duration}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 dark:text-white block">
                        {c.time}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 justify-end">
                        <MapPin className="w-2.5 h-2.5" />
                        {c.zone}
                      </span>
                    </div>
                  </div>

                  {/* Seat Availability Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-500 dark:text-zinc-400">
                        Seat Capacity: {c.bookedSeats} / {c.maxSeats} Booked
                      </span>
                      <span
                        className={
                          spotsLeft <= 3
                            ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {spotsLeft > 0 ? `${spotsLeft} spots remaining` : 'Class Full'}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          fillPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* RSVP Button */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Join Sarah and {c.bookedSeats - 1} other members
                    </span>
                    <button
                      onClick={() => handleToggleBookClass(c.id)}
                      className={`py-2 px-4 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
                        c.isBooked
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black shadow-sm'
                      }`}
                    >
                      {c.isBooked ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Spot Reserved ✓
                        </>
                      ) : (
                        'Reserve My Spot'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: WORKOUT BUDDIES */}
      {activeTab === 'buddies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                🤝 Workout Buddy Finder
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Never lift alone — connect with partners who share your workout goals
              </p>
            </div>
            <button
              onClick={() => setIsBuddyModalOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Post Request
            </button>
          </div>

          {/* New Buddy Request Modal */}
          {isBuddyModalOpen && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-500/30 space-y-3">
              <h5 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Find a Workout Buddy Today
              </h5>
              <form onSubmit={handleCreateBuddyRequest} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Focus (e.g. Heavy Leg Day & Squats)"
                    value={buddyFocus}
                    onChange={(e) => setBuddyFocus(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Time (e.g. Today @ 6:00 PM)"
                    value={buddyTime}
                    onChange={(e) => setBuddyTime(e.target.value)}
                    className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Note (e.g. Need a spotter for bench press sets)"
                  value={buddyNote}
                  onChange={(e) => setBuddyNote(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBuddyModalOpen(false)}
                    className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-4 rounded-xl bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black text-xs font-black"
                  >
                    Post to Gym
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Buddy Cards */}
          <div className="grid grid-cols-1 gap-3">
            {buddies.map((b) => (
              <div key={b.id} className="community-card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                      {b.memberName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {b.memberName}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        {b.gymZone}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                    {b.scheduledTime}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 space-y-1">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                    🎯 {b.workoutFocus}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-zinc-300">{b.lookingFor}</p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500">
                    {b.joinedCount > 0 ? `${b.joinedCount} member partnered up` : 'Looking for 1 partner'}
                  </span>
                  <button
                    onClick={() => handleToggleJoinBuddy(b.id)}
                    className={`py-2 px-4 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                      b.hasJoined
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                        : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black shadow-sm'
                    }`}
                  >
                    {b.hasJoined ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Workout Joined!
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Join Workout
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                🏆 Gym-Wide Community Leaderboard
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Top movers and most consistent athletes this month
              </p>
            </div>
            <span className="badge-active-green text-[10px]">
              <Flame className="w-3 h-3 text-amber-500 fill-current" />
              Live Rankings
            </span>
          </div>

          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
            {/* 2nd Place */}
            <div className="community-card p-3 sm:p-4 text-center flex flex-col items-center justify-between border-slate-300/80 dark:border-zinc-700/80">
              <span className="text-xl">🥈</span>
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center font-black text-xs my-1">
                {leaderboard[1]?.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white truncate max-w-[80px]">
                  {leaderboard[1]?.name}
                </p>
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                  {leaderboard[1]?.visitsThisMonth} Visits
                </p>
              </div>
            </div>

            {/* 1st Place - Tall Center */}
            <div className="community-card p-3 sm:p-4 text-center flex flex-col items-center justify-between border-amber-400 dark:border-amber-500/50 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-zinc-900 shadow-md">
              <span className="text-2xl">🥇</span>
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border-2 border-amber-400 text-amber-600 dark:text-amber-300 flex items-center justify-center font-black text-sm my-1 shadow-md">
                {leaderboard[0]?.name.charAt(0)}
              </div>
              <div>
                <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[90px]">
                  {leaderboard[0]?.name}
                </p>
                <p className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                  {leaderboard[0]?.visitsThisMonth} Visits
                </p>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="community-card p-3 sm:p-4 text-center flex flex-col items-center justify-between border-slate-300/80 dark:border-zinc-700/80">
              <span className="text-xl">🥉</span>
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center font-black text-xs my-1">
                {leaderboard[2]?.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[11px] sm:text-xs text-slate-900 dark:text-white truncate max-w-[80px]">
                  {leaderboard[2]?.name}
                </p>
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                  {leaderboard[2]?.visitsThisMonth} Visits
                </p>
              </div>
            </div>
          </div>

          {/* Full List */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800/80 shadow-sm">
            {leaderboard.map((item) => (
              <div
                key={item.rank}
                className={`p-3.5 sm:p-4 flex items-center justify-between transition ${
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
                        <span className="badge-active-green text-[9px] py-0 px-1.5 font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">
                      {item.badge}
                    </span>
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

