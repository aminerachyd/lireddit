import { Arg, Mutation, Query, Resolver } from "type-graphql";
import { Post } from "../entities/Post";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  // Le contexte qu'on a mis au niveau du Context dans index.ts
  async posts(): Promise<Post[]> {
    return Post.find();
  }

  // Pour cette query, on peut retrouver un objet nul
  @Query(() => Post, { nullable: true })
  post(
    // L'argument GraphQL
    // Le premier type est pour GraphQL, le second est pour typescript
    @Arg("id") id: number
  ): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  async createPost(@Arg("title") title: string): Promise<Post> {
    // 2 sql queries
    return Post.create({ title }).save();
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    // Pour renvoyer un nul il faut expliciter le type graphql
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id);
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    try {
      await Post.delete(id);
    } catch (error) {
      return false;
    }
    return true;
  }
}
