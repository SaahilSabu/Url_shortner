var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CounterSchema = Schema({
    _id: {type: String, required: true},
    seq: { type: Number, default: 0 }
});

var counter = mongoose.model('counter', CounterSchema);

// create a schema for our links
var urlSchema = new Schema({
  _id: Number, // Remove index: true
  long_url: String,
  created_at: Date
});


urlSchema.pre('save', async function (next) {
  var doc = this;
  try {
    if (!doc._id) {
      const counterDoc = await counter.findByIdAndUpdate(
        {_id: 'url_count'},
        {$inc: {seq: 1}},
        { upsert: true, new: true }
      ).exec();
      
      if (counterDoc) {
        doc._id = counterDoc.seq;
      } else {
        throw new Error('Counter document not found or could not be created.');
      }
    }
  } catch (error) {
    return next(error);
  }
  next();
});



var Url = mongoose.model('Url', urlSchema);

module.exports = Url;
