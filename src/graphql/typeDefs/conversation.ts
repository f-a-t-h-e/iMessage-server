const typeDefs = /* GraphQL */ `
  type Mutation {
    createConversation(participantIds: [String!]!): CreateConversationResponse
  }

  type CreateConversationResponse {
    conversationId: String!
  }
`;

export default typeDefs;
