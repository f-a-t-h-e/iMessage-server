import { CreateUsernameResponse, GraphQLContext } from "../../utils/types";

import { GraphQLError } from "graphql";
import { User } from "@prisma/client";

const resolvers = {
  Query: {
    searchUsers: async (
      parent: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<Array<User>> => {
      const { username: searchUsername } = args;
      const { prisma, session } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const { username: userUsername } = session.user;

      try {
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: searchUsername,
              not: userUsername,
              mode: "insensitive",
            },
          },

          // select: {
          /**
           *  NO NEED TO THE SELECT FUNCTION
           *  BECAUSE GRAPHQL SCHEMA SPECIFIES WHAT CAN BE SENT AND WHAT CAN'T BE SENT
           */
          // },
        });

        return users;
      } catch (error: any) {
        console.log("🚀 ~ file: user.ts:Query>searchUsers ~ error", error);
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    createUsername: async (
      parent: any,
      args: { username: string },
      context: GraphQLContext
    ): Promise<CreateUsernameResponse> => {
      const { username } = args;
      const { prisma, session } = context;

      if (!session?.user) {
        return {
          error: "Not authorized",
        };
      }
      const { id } = session.user;

      try {
        /**
         * Check for usename
         */
        const existingUser = await prisma.user.findUnique({
          where: { username },
        });
        if (existingUser) {
          return {
            error: "This username is taken already.",
          };
        }
        /**
         * Update user
         */
        await prisma.user.update({
          where: {
            id,
          },
          data: {
            username,
          },
        });
        return {
          success: true,
        };
      } catch (error: any) {
        console.log("🚀 ~ file: user.ts:26 ~ error", error);
        return {
          error: error?.message,
        };
      }
    },
  },
  // Subscription: {},
};

export default resolvers;
