import { Prisma, PrismaClient } from "@prisma/client";
import { ISODateString } from "next-auth";
import {
  conversationPopulated,
  participantsPopulated,
} from "../graphql/resolvers/conversation";

export interface GraphQLContext {
  session: Session | null;
  prisma: PrismaClient;
  // pubsub
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

export interface Session {
  user?: User;
  expires: ISODateString;
}

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
export interface IConversationPopulated
  extends Prisma.ConversationGetPayload<{
    include: typeof conversationPopulated;
  }> {}

export interface IParticipantPopulated
  extends Prisma.ConversationParticipantGetPayload<{
    include: typeof participantsPopulated;
  }> {}
