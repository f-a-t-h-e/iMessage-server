import { Prisma, PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { Context } from "graphql-ws/lib/server";
import { ISODateString } from "next-auth";

import {
  conversationPopulated,
  participantsPopulated,
} from "../graphql/resolvers/conversation";

/**
 * Server Configration
 */

export interface GraphQLContext {
  session: Session | null;
  prisma: PrismaClient;
  pubsub: PubSub;
}

export interface Session {
  user?: User;
  expires: ISODateString;
}

export interface SubscriptionContext extends Context {
  connectionParams: {
    session?: Session;
  };
}

/**
 * Users
 */
export type CreateUsernameResponse =
  | {
      success: boolean;
    }
  | {
      error: string;
    };

export interface User {
  id: string;
  username: string;
  image: string;
  email: string;
  emailVerified: boolean | null;
  name: string;
}

/**
 * CONVERSATIONS
 */
export type IConversationPopulated = Prisma.ConversationGetPayload<{
  include: typeof conversationPopulated;
}>;

export type IParticipantPopulated = Prisma.ConversationParticipantGetPayload<{
  include: typeof participantsPopulated;
}>;
