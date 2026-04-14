export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_private: boolean;
  created_at: string;
  post_count: number;
  friends_count: number;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  author_username: string;
  author_avatar: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_username: string;
  author_avatar: string | null;
  replies_count: number;
}

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  author_username: string;
  author_avatar: string | null;
}

export interface StoryGroup {
  user_id: string;
  username: string;
  avatar_url: string | null;
  stories: Story[];
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  from_username: string;
  from_avatar: string | null;
  to_username: string;
  to_avatar: string | null;
}

export interface Friend {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username: string;
  sender_avatar: string | null;
}

export interface Conversation {
  id: string;
  other_user_id: string;
  other_username: string;
  other_avatar: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export interface ApiError {
  detail: string;
}
