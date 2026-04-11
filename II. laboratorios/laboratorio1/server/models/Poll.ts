import { Schema, model, type InferSchemaType } from "mongoose";

const PollOptionSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    votes: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const PollSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    options: { type: [PollOptionSchema], required: true, validate: [(value: unknown[]) => value.length >= 2, "Se requieren al menos 2 opciones"] },
    status: { type: String, enum: ["active", "closed"], default: "active", index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, minlength: 6, maxlength: 6, index: true },
    closedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export type PollDocument = InferSchemaType<typeof PollSchema>;

export const Poll = model("Poll", PollSchema);
