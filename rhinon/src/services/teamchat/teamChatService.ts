import { PrivateAxios } from "@/helpers/PrivateAxios";

export type TeamChatScopeType = "channel" | "dm";

export interface TeamChatChannel {
  id: string;
  name: string;
  type: "public" | "private";
  members: string[];
  createdBy: number;
  createdAt: string;
}

export interface TeamChatUser {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline" | "busy";
  avatar?: string | null;
}

export interface TeamChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface GetMessagesParams {
  scopeType: TeamChatScopeType;
  scopeId: string;
  limit?: number;
  offset?: number;
}

export const getTeamChatChannels = async (): Promise<TeamChatChannel[]> => {
  const response = await PrivateAxios.get("/teamchat/channels");
  return response.data?.channels ?? [];
};

export const createTeamChatChannel = async (payload: {
  name: string;
  type: "public" | "private";
  member_ids: string[];
}): Promise<TeamChatChannel> => {
  const response = await PrivateAxios.post("/teamchat/channels", payload);
  return response.data?.channel;
};

export const getTeamChatUsers = async (): Promise<TeamChatUser[]> => {
  const response = await PrivateAxios.get("/teamchat/users");
  return response.data?.users ?? [];
};

export const getTeamChatMessages = async ({
  scopeType,
  scopeId,
  limit = 50,
  offset = 0,
}: GetMessagesParams): Promise<{
  messages: TeamChatMessage[];
  hasMore: boolean;
}> => {
  const response = await PrivateAxios.get("/teamchat/messages", {
    params: {
      scope_type: scopeType,
      scope_id: scopeId,
      limit,
      offset,
    },
  });

  return {
    messages: response.data?.messages ?? [],
    hasMore: response.data?.hasMore ?? false,
  };
};

export const sendTeamChatMessage = async (payload: {
  scopeType: TeamChatScopeType;
  scopeId: string;
  content: string;
}): Promise<TeamChatMessage> => {
  const response = await PrivateAxios.post("/teamchat/messages", {
    scope_type: payload.scopeType,
    scope_id: payload.scopeId,
    content: payload.content,
  });

  return response.data?.message;
};

