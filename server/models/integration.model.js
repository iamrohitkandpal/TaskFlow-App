import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['github', 'gitlab']
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenExpiry: {
    type: Date
  },
  username: {
    type: String
  },
  repositories: [{
    id: String,
    name: String,
    fullName: String,
    url: String
  }],
  webhookSecret: {
    type: String
  },
  webhookId: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Integration = mongoose.model("Integration", integrationSchema);
export default Integration;