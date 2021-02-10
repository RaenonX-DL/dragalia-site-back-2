import {Document, Model, model, Schema} from 'mongoose';

const UserSchema = new Schema({
  em: {
    type: Schema.Types.String,
    required: true,
  },
  uid: {
    type: Schema.Types.String,
    required: true,
  },
  a: {
    type: Schema.Types.Boolean,
    default: false,
  },
  lc: {
    type: Schema.Types.Number,
    default: 0,
  },
  lr: Schema.Types.Date,
});

type User = {
  googleEmail: string,
  googleUid: string,
  isAdmin: boolean,
  loginCount: number,
  lastLogin: Date,
}

interface UserDocument extends User, Document {
}

export type UserModel = Model<UserDocument>

export const UserCollection = model<UserDocument, UserModel>('Google', UserSchema);
