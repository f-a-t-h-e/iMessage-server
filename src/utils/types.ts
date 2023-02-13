import { PrismaClient } from "@prisma/client";
import { ISODateString } from "next-auth";

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
