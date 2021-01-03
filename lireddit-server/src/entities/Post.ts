import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

// Entité à la fois pour postgres et pour GraphQL
// Les premiers sont pour GraphQL
// Les deuxièmes sont pour postgres
@ObjectType()
@Entity()
export class Post {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();

  // Si je ne spécifie pas le Field, je ne peux pas accéder à cet attribut depuis GraphQL
  @Field()
  @Property({ type: "text" })
  title!: string;
}
