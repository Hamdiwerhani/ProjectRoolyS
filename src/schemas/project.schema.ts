import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop([String])
  tags: string[];

  @Prop({ enum: ['todo', 'in-progress', 'done'], default: 'todo' })
  status: string;

  @Prop([
    { user: { type: Types.ObjectId, ref: 'User' }, permissions: [String] },
  ])
  sharedWith: { user: Types.ObjectId; permissions: string[] }[];
}

export type ProjectDocument = Project & Document;
export const ProjectSchema = SchemaFactory.createForClass(Project);
