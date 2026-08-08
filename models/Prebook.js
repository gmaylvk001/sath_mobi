// models/Prebook.js
import mongoose from 'mongoose';

const PrebookSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: String,
    phone: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    store: String,
    product: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Prebook || mongoose.model('Prebook', PrebookSchema);
