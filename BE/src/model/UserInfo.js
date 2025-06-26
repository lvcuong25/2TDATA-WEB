import mongoose from 'mongoose';

const userInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  }
},

{ timestamps: true, versionKey: false });

const UserInfo = mongoose.model('UserInfo', userInfoSchema);

export default UserInfo; 