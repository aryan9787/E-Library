const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      unique: true,
    },
    summaryText: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: 'gpt-3.5-turbo',
    },
    source: {
      type: String,
      default: 'generated',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Summary = mongoose.model('Summary', summarySchema);

module.exports = Summary;
