const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/calendarApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

const EventSchema = new mongoose.Schema({
    name: String,
    time: Date,
    duration: Number,
    type: String,
});

const Event = mongoose.model('Event', EventSchema);

app.get('/events', async (req, res) => {
    const events = await Event.find();
    res.json(events);
});

app.get('/summary', async (req, res) => {
    const { range } = req.query;
    const now = new Date();
    let startDate;

    if (range === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (range === 'monthly') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    } else {
        return res.status(400).json({ error: 'Invalid range. Use weekly or monthly.' });
    }

    const events = await Event.find({ time: { $gte: startDate, $lte: now } });
    res.json(events);
});

app.post('/events', async (req, res) => {
    const { name, time, duration, type } = req.body;
    if (!name || !time || !duration || !type) {
        return res.status(400).json({ error: 'Missing name, time, duration, or type' });
    }
    const newEvent = new Event({ name, time, duration, type });
    await newEvent.save();
    res.status(201).json(newEvent);
});

app.delete('/events/:id', async (req, res) => {
    await Event.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

app.listen(5000, () => console.log('Server running on port 5000'));