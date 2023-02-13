import { CreateUsernameResponse, GraphQLContext } from "../../utils/types";

const resolvers = {
  Query: {
    searchUsers: () => {},
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
