const typeDefs = /* GraphQL */ `
  scalar Date

  type Mutation {
    createConversation(participantIds: [String!]!): CreateConversationResponse!
  }

  type Mutation {
    markConvAsRead(conversationId: String!): Boolean!
  }

  type CreateConversationResponse {
    conversationId: String!
  }

  type Conversation {
    id: String!
    latestMessage: Message
    participants: [Participant!]!
    createdAt: Date
    updatedAt: Date
  }

  type Participant {
    id: String!
    user: User!
    hasSeenLatestMessage: Boolean
  }

  type ConversationUpdatedSubscriptionPayload {
    conversation: Conversation
  }

  type Query {
    conversations: [Conversation!]!
  }

  type Subscription {
    conversationCreated: Conversation
  }

  type Subscription {
    conversationUpdated: ConversationUpdatedSubscriptionPayload
  }
`;

export default typeDefs;
