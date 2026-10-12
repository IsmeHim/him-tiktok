import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITikTokAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  openId: string;
  unionId?: string;
  avatarUrl?: string;
  displayName?: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  refreshTokenExpiresAt?: Date;
  scope: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TikTokAccountSchema: Schema<ITikTokAccount> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    openId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    unionId: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    displayName: {
      type: String,
      default: 'TikTok Creator',
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    refreshTokenExpiresAt: {
      type: Date,
    },
    scope: {
      type: [String],
      default: ['user.info.basic', 'video.upload'],
    },
  },
  {
    timestamps: true,
  }
);

export const TikTokAccount: Model<ITikTokAccount> =
  mongoose.models.TikTokAccount ||
  mongoose.model<ITikTokAccount>('TikTokAccount', TikTokAccountSchema);
