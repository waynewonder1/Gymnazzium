// Community feed: profiles, following, posts and kudos (tables in supabase/migrations/…_social.sql).
// Only members who joined the community (a community_profiles row) can post, follow or be found.
import { supabase } from './supabase';

export async function myCommunityProfile(userId) {
  const { data } = await supabase.from('community_profiles').select('display_name').eq('user_id', userId).maybeSingle();
  return data;
}

export async function joinCommunity(userId, displayName) {
  return supabase.from('community_profiles').upsert({ user_id: userId, display_name: displayName });
}

export const leaveCommunity = (userId) => supabase.from('community_profiles').delete().eq('user_id', userId);

// People whose name contains the search, with whether you follow them.
export async function findPeople(userId, query) {
  const q = query.trim().replace(/[%_,()]/g, '');
  if (q.length < 2) return [];
  const [{ data: people }, { data: following }] = await Promise.all([
    supabase.from('community_profiles').select('user_id, display_name').ilike('display_name', `%${q}%`).neq('user_id', userId).limit(20),
    supabase.from('follows').select('followee').eq('follower', userId),
  ]);
  const ids = new Set((following ?? []).map((f) => f.followee));
  return (people ?? []).map((p) => ({ ...p, following: ids.has(p.user_id) }));
}

export const follow = (userId, otherId) => supabase.from('follows').insert({ follower: userId, followee: otherId });
export const unfollow = (userId, otherId) => supabase.from('follows').delete().eq('follower', userId).eq('followee', otherId);

export async function followCounts(userId) {
  const { data } = await supabase.rpc('follow_counts', { p_user: userId });
  return data?.[0] ?? { followers: 0, following: 0 };
}

export async function loadFeed(before = null) {
  const { data, error } = await supabase.rpc('feed', { p_before: before, p_limit: 30 });
  if (error) throw error;
  return data ?? [];
}

export const giveKudos = (postId, userId) => supabase.from('kudos').insert({ post_id: postId, user_id: userId });
export const takeKudos = (postId, userId) => supabase.from('kudos').delete().eq('post_id', postId).eq('user_id', userId);
export const deletePost = (postId) => supabase.from('posts').delete().eq('id', postId);

// Creates or updates a post (one per kind + ref, e.g. one per workout day), or removes it.
export function publish(userId, kind, ref, data) {
  return supabase.from('posts').upsert({ user_id: userId, kind, ref, data }, { onConflict: 'user_id,kind,ref' });
}
export const unpublish = (userId, kind, ref) => supabase.from('posts').delete().eq('user_id', userId).eq('kind', kind).eq('ref', ref);
