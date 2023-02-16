import userResolvers from "./user";
import conversationResolvers from "./conversation";
import messageResolvers from "./message";
import merge from "lodash.merge";
import scalarResolvers from "./scalars";

const resolvers = merge(
  {},
  scalarResolvers,
  userResolvers,
  conversationResolvers,
  messageResolvers
);

export default resolvers;
