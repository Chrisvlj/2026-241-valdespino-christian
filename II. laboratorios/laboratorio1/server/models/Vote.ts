import { Schema, model, type InferSchemaType } from "mongoose";

const VoteSchema = new Schema(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true, index: true },
    optionIndex: { type: Number, required: true, min: 0 },
    voterName: { type: String, required: true, trim: true },
    voterKey: { type: String, required: true, trim: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

VoteSchema.index({ pollId: 1, voterKey: 1 }, { unique: true });

export type VoteDocument = InferSchemaType<typeof VoteSchema>;

export const Vote = model("Vote", VoteSchema);
