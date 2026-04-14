import type { StoryGroup } from '../types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  Feed: undefined;
  Search: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  CreatePost: { isStory: boolean };
  Comments: { postId: string };
  StoryViewer: { storyGroup: StoryGroup };
  UserProfile: { userId: string };
  EditProfile: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  FriendRequests: undefined;
  FriendsList: undefined;
  SavedPosts: undefined;
  ChatScreen: {
    conversationId: string;
    otherUserId: string;
    otherUsername: string;
    otherAvatar: string | null;
  };
  NewChat: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends MainStackParamList {}
  }
}
