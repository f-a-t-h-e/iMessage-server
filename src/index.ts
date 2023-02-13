import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { createServer } from "http";
import resolvers from "./graphql/resolvers";
import typeDefs from "./graphql/typeDefs";
import cors from "cors";
import "dotenv/config";
import { getSession } from "next-auth/react";
import { GraphQLContext, Session } from "./utils/types";
import { PrismaClient } from "@prisma/client";

const bootstrap = async () => {
  // Create the schema, which will be used separately by ApolloServer and
  // the WebSocket server.
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create an Express app and HTTP server; we will attach both the WebSocket
  // server and the ApolloServer to this HTTP server.
  const app = express();
  const httpServer = createServer(app);

  // Context parameters
  const prisma = new PrismaClient();
  // const pubsub

  // Set up ApolloServer.
  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      credentials: true,
      origin: process.env.CLIENT_ORIGIN,
    }),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<GraphQLContext> => {
        const session = (await getSession({ req })) as Session;
        console.log("🚀 ~ file: index.ts:47 ~ context: ~ session", session);

        return { session, prisma };
      },
    })
  );

  const PORT = process.env.PORT;

  // Now that our HTTP server is fully set up, we can listen to it.
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  console.log(`🚀  Server ready at: http://localhost:${PORT}/graphql`);
};

bootstrap().catch((error) =>
  console.log("🚀 ~ file: index.ts:bootstrap ~ error", error)
);
