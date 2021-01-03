import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";
import microConfig from "./mikro-orm.config";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";

const main = async () => {
  // Mappage et connexion à la base de données
  const orm = await MikroORM.init(microConfig);
  // Lancement de la migration
  await orm.getMigrator().up();

  const app = express();

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver],
      validate: false,
    }),
    // Objet accessible par tout les resovlers
    context: () => ({ em: orm.em }),
  });

  apolloServer.applyMiddleware({ app });

  // Lancement du serveur
  app.listen(4000, () => {
    console.log("Server started on port 4000");
  });
};

main().catch((err) => {
  console.error(err);
});
