import mongoose, { Schema, Document, Model } from 'mongoose';

export type PostStatus = 'PENDING' | 'PROCESSING' | 'UPLOADED_TO_DRAFT' | 'FAILED';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  videoFileName: string;
  videoFileSize?: number;
  publishId?: string;
  status: PostStatus;
  privacyLevel?: string;
  disableDuet?: boolean;
  disableComment?: boolean;
  disableStitch?: boolean;
  isAigc?: boolean;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Caption and hashtags are required'],
      trim: true,
      maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    },
    videoFileName: {
      type: String,
      required: true,
    },
    videoFileSize: {
      type: Number,
      default: 0,
    },
    publishId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'UPLOADED_TO_DRAFT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    privacyLevel: {
      type: String,
      default: 'SELF_ONLY',
    },
    disableDuet: {
      type: Boolean,
      default: false,
    },
    disableComment: {
      type: Boolean,
      default: false,
    },
    disableStitch: {
      type: Boolean,
      default: false,
    },
    isAigc: {
      type: Boolean,
      default: false,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
