import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import {
  GraphQLContext,
  IMessagePopulated,
  IMessageSentPayload,
  ISendMessageArgs,
} from "../../utils/types";
import { conversationPopulated } from "./conversation";

const resolvers = {
  Query: {
    messages: async (
      _: any,
      args: { conversationId: string; skip?: number; take?: number },
      context: GraphQLContext
    ): Promise<IMessagePopulated[]> => {
      const { session, prisma } = context;
      const { conversationId, skip, take } = args;

      if (!session?.user) {
        throw new GraphQLError("Not authorized!");
      }
      const {
        user: { id: userId },
      } = session;

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: conversationPopulated,
      });
      if (!conversation) {
        throw new GraphQLError("This conversation doesn't exist!");
      }

      const notAllowedToView = !conversation.participants.find(
        (parti) => parti.userId === userId
      );

      if (notAllowedToView) {
        throw new GraphQLError(
          "You don't have access to this conversation! 😐"
        );
      }

      try {
        // const { messages } = await prisma.conversation.findUniqueOrThrow({
        //   where: {
        //     id: conversationId,
        //   },
        //   select: {
        //     messages: {
        //       include: messagePopulated,
        //       orderBy: {
        //         createdAt: "desc",
        //       },
        //     },
        //   },
        // });
        const messages = await prisma.message.findMany({
          where: {
            conversationId,
          },
          include: messagePopulated,
          orderBy: {
            createdAt: "desc",
          },
          skip: skip || 0,
          take: take || 31,
        });

        return messages;
      } catch (error: any) {
        console.log("🚀 ~ resolvers: message>Query>messages ~ error", error);
        throw new GraphQLError("Something went wrong");
      }
    },
  },
  Mutation: {
    sendMessage: async (
      _: any,
      args: ISendMessageArgs,
      context: GraphQLContext
    ): Promise<boolean> => {
      const { session, prisma, pubsub } = context;

      if (!session?.user) {
        throw new GraphQLError("Not authorized");
      }
      console.log(args);

      const { id: senderId } = session.user;
      const { body, conversationId } = args;

      try {
        /**
         * Create new message entity
         */
        // const newMessage = await prisma.message.create({
        //   data: {
        //     senderId,
        //     body,
        //     conversationId,
        //   },
        //   include: messagePopulated,
        // });

        /**
         * Update Conv entity
         */
        const participant =
          await prisma.conversationParticipant.findFirstOrThrow({
            where: {
              userId: senderId,
              conversationId,
            },
          });

        const conversation = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            latestMessage: {
              create: {
                body,
                conversationId,
                senderId,
              },
            },
            participants: {
              update: {
                where: { id: participant.id },
                data: {
                  hasSeenLatestMessage: true,
                },
              },
              updateMany: {
                where: {
                  // conversationId,
                  userId: {
                    not: senderId,
                  },
                },
                data: {
                  hasSeenLatestMessage: false,
                },
              },
            },
          },
          include: conversationPopulated,
        });
        // const conversation = await prisma.conversation.update({
        //   where: {
        //     id: conversationId,
        //   },
        //   data: {
        //     latestMessageId: newMessage.id,
        //     participants: {
        //       update: {
        //         where: { id: participant.id },
        //         data: {
        //           hasSeenLatestMessage: true,
        //         },
        //       },
        //       updateMany: {
        //         where: {
        //           // conversationId,
        //           // userId: {
        //           //   not: senderId,
        //           // },
        //           NOT: {
        //             userId: senderId,
        //           },
        //         },
        //         data: {
        //           hasSeenLatestMessage: false,
        //         },
        //       },
        //     },
        //   },
        //   include: conversationPopulated,
        // });
        console.log(3);
        if (!conversation) {
          throw new GraphQLError("This conversation doesn't exist");
        }
        pubsub.publish(
          "MESSAGE_SENT",
          /**
           * HINT: This is what will be sent to the users
           */
          { messageSent: conversation.latestMessage }
        );
        // pubsub.publish("CONVERSATION_UPDATED", {
        //   conversationUpdated: {
        //     conversation,
        //   },
        // });
        console.log("done");

        return true;
      } catch (error: any) {
        console.log(
          "🚀 ~ resolver: message>Mutation>sendMessage ~ error",
          error
        );
        throw new GraphQLError("Error sending the message!");
      }
    },
  },
  Subscription: {
    messageSent: {
      subscribe: withFilter(
        (_: any, __: unknown, context: GraphQLContext) => {
          const { pubsub } = context;

          return pubsub.asyncIterator(["MESSAGE_SENT"]);
        },
        (
          payload: IMessageSentPayload,
          args: { conversationId: string },
          context: GraphQLContext
        ) => {
          return payload.messageSent.conversationId === args.conversationId;
        }
      ),
    },
  },
};

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: {
      id: true,
      username: true,
    },
  },
});

export default resolvers;
