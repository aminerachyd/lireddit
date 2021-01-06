import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";

// Entité à la fois pour postgres et pour GraphQL
// Les premiers sont pour GraphQL
// Les deuxièmes sont pour postgres
@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  // Si je ne spécifie pas le Field, je ne peux pas accéder à cet attribut depuis GraphQL
  @Field()
  @Column()
  title!: string;
}
