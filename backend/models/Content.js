const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['blog', 'video'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  tags: [String],
  grade: {
    type: Number,
  }
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;
