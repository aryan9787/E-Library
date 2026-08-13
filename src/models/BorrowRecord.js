const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    borrowedAt: {
      type: Date,
      default: Date.now,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed',
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

borrowRecordSchema.index({ userId: 1, status: 1 });
borrowRecordSchema.index({ bookId: 1 });

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);

module.exports = BorrowRecord;
