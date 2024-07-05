const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
// for parsing the body.
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//connecting to the  mongodb server
mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
//creating schema 
const userSchema = new mongoose.Schema({
  username: {type: String ,unique: true, required: true},
}, { versionKey: false }); //disable version key in response

const exerciseSchema=new mongoose.Schema({
  userId: { type: String, required: true },
	description: { type: String, required: true },
	duration: { type: Number, min: 1, required: true },
	date: { type: Date, default: Date.now }
});

let User = mongoose.model('User', userSchema);
let exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  try {
    const inputUsername = req.body.username;
    if (!inputUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const newUser = new User({ username: inputUsername });
    const savedUser = await newUser.save();
    res.status(201).json({ username: savedUser.username, _id: savedUser._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, { __v: 0 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const id=req.params._id;
    const { description, date } = req.body; //object destructuring
    const duration = parseInt(req.body.duration);
    const users = await User.findOne({ _id:id }, { __v: 0 });
    const nameOfUser =users.username; 
     // Validate required fields
     if (!description || !duration) {
      return res.status(400).json({ error: 'Description and Duration are required' });
    }
        // Format date (use current date if not provided)
        const exerciseDate = date ? new Date(date) : new Date();

    // Create new Exercise instance
    const newExercise = new exercise({
      userId: id,
      description,
      duration: parseInt(duration),
      date: exerciseDate
    });

    // Save exercise to database
    const savedExercise = await newExercise.save();

    res.status(201).json({
      _id: savedExercise.userId,
      username:nameOfUser,
      date: savedExercise.date.toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description,
      
      
    });

  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }

});

app.get('/api/users/:_id/logs', async (req, res) => {
try{
  const userId=req.params._id;
  const {from,to,limit}=req.query;
  const exercises = await exercise.find(
    { userId, date: { $gte: from, $lte: to } }, 
    { __v: 0 }
  ).limit(limit);
  console.log(from,to,limit);
  const users = await User.findOne({ _id:userId }, { __v: 0 });
  const nameOfUser =users.username; 

  res.status(200).json({
    id:userId,
    username:nameOfUser,
    count:exercises.length,
    log: exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()  
    }))

  });


}
catch (err) {
  res.status(500).json({ error: err.message });

}
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
