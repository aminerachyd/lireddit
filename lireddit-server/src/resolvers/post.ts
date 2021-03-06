import { Updoot } from "../entities/Updoot";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  // To send snippet instead of the whole text
  // In the GraphQL query, you can choose textSnippet instead of text
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  // @FieldResolver(() => Int, { nullable: true })
  // async voteStatus(
  //   @Root() post: Post,
  //   @Ctx() { req, updootLoader }: MyContext
  // ) {
  //   if (!req.sessions.userId) {
  //     return null;
  //   }

  //   const updoot = await updootLoader.load({
  //     postId: post.id,
  //     userId: req.session.userId,
  //   });

  //   return updoot ? updoot.value : null;
  // }

  @Mutation(() => Boolean)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value != -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // The user has voted on the post before
    // And they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId"=$2 and "userId"=$3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
          update post 
          set points = points + $1
          where id = $2;
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // Has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          insert into updoot ("userId","postId",value)
          values($1,$2,$3);
        `,
          [userId, postId, realValue]
        );
        await tm.query(
          `
          update post 
          set points = points + $1
          where id = $2;
        `,
          [realValue, postId]
        );
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  // Le contexte qu'on a mis au niveau du Context dans index.ts
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    // We fetch one extra post to get if there's more posts ahead or not
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }

    const posts = await getConnection().query(
      `
    select p.*
    from post p
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1;
    `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  // Pour cette query, on peut retrouver un objet nul
  @Query(() => Post, { nullable: true })
  post(
    // L'argument GraphQL
    // Le premier type est pour GraphQL, le second est pour typescript
    @Arg("id", () => Int) id: number
  ): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({ ...input, creatorId: req.session.userId }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    // Pour renvoyer un nul il faut expliciter le type graphql
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId"= :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    try {
      // NOT CASCADE WAY
      // const post = await Post.findOne(id);
      // if (!post) {
      //   return false;
      // }
      // if (post.creatorId !== req.session.userId) {
      //   throw new Error("Not authorized");
      // }
      // await Updoot.delete({ postId: id });
      // await Post.delete({ id });

      // CASCADE WAY, check Post Updoot entity
      await Post.delete({ id, creatorId: req.session.userId });
    } catch (error) {
      return false;
    }
    return true;
  }
}
