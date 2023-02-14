const resolvers = {
  Mutation: {
    createConversation: async () => {
      console.log("INSIDE");
    },
  },
};

export default resolvers;
