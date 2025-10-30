import mongoose, { Document, Schema, Types } from "mongoose";


export interface IToken extends Document {
  token: string;
  veterinarian: Types.ObjectId;
  createdAt: Date;
}   

const tokenSchema : Schema = new Schema({
  token: { type: String, required: true },
  veterinarian: { type: Schema.Types.ObjectId, ref: 'Veterinarian'},
  expiresAt: { type: Date, default: Date.now, expires: '10m' },
}, { timestamps: true });

const Token = mongoose.model<IToken>('Token', tokenSchema);
export default Token;