import { GraphQLContext, IConversationPopulated } from "../../utils/types";
import { GraphQLError } from "graphql";
import { Prisma } from "@prisma/client";
import { withFilter } from "graphql-subscriptions";

const resolvers = {
  Query: {
    conversations: async (
      parent: any,
      args: any,
      context: GraphQLContext
    ): Promise<IConversationPopulated[]> => {
      const { prisma, session } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }
      const { id: userId } = session.user;

      try {
        const { conversations } = await prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            conversations: {
              select: {
                conversation: {
                  include: conversationPopulated,
                },
                /*  */
                hasSeenLatestMessage: true,
                id: true,
              },
            },
          },
        });

        return conversations.map((conv) => conv.conversation);
      } catch (error: any) {
        console.log(
          "🚀 ~ conversation.ts:19 ~ Query>conversations: ~ error",
          error
        );
        throw new GraphQLError(error?.message);
      }
    },
  },

  Mutation: {
    createConversation: async (
      parent: any,
      args: { participantIds: string[] },
      context: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      const { participantIds } = args;
      const { prisma, session, pubsub } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }

      const { id } = session.user;
      participantIds.push(id);
      try {
        const conversation = await prisma.conversation.create({
          data: {
            participants: {
              createMany: {
                data: participantIds.map((userId) => ({
                  userId,
                  hasSeenLatestMessage: userId === id,
                })),
              },
            },
          },
          include: conversationPopulated,
        });

        /**
         * emit a CONVERSATION_CREATED event using pubsub
         */

        pubsub.publish("CONVERSATION_CREATED", {
          conversationCreated: conversation,
        });

        return {
          conversationId: conversation.id,
        };
      } catch (error) {
        console.log(
          "🚀 ~ file: conversation.ts:Mutation>createConversation ~ error",
          error
        );
        throw new GraphQLError("Error creating the conversation");
      }
    },
  },

  Subscription: {
    conversationCreated: {
      //   subscribe: (parent: any, args: unknown, context: GraphQLContext) => {
      //     const { pubsub } = context;
      //     return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
      //   },
      subscribe: withFilter(
        (_: any, __: unknown, context: GraphQLContext) => {
          const { pubsub } = context;

          return pubsub.asyncIterator(["CONVERSATION_CREATED"]);
        },
        (
          payload: IConversationCreatedSubPayload,
          variables,
          context: GraphQLContext
        ) => {
          const { session } = context;
          const {
            conversationCreated: { participants },
          } = payload;
          // Only push an update if the conversation is related
          // to the listening user

          return !!participants.find(
            (parti) => parti.userId === session?.user?.id
          );
        }
      ),
    },
  },
};

export interface IConversationCreatedSubPayload {
  conversationCreated: IConversationPopulated;
}

export const participantsPopulated =
  Prisma.validator<Prisma.ConversationParticipantInclude>()({
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  });

export const conversationPopulated =
  Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
      include: participantsPopulated,
    },
    latestMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    },
  });

export default resolvers;
