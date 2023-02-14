const typeDefs = /* GraphQL */ `
  type User {
    id: String!
    name: String
    username: String
    email: String!
    emailVerified: Boolean
    image: String
  }

  type SearchedUser {
    id: ID!
    username: String!
    image: String
  }

  type Query {
    searchUsers(username: String!): [SearchedUser!]!
  }

  type Mutation {
    createUsername(username: String!): CreateUsernameResponse
  }

  type CreateUsernameResponse {
    success: Boolean
    error: String
  }
`;

export default typeDefs;
