import React from 'react';
import './App.css';
import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Modal from 'react-modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';

const localizer = momentLocalizer(moment);

function App() {
  const [events, setEvents] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [eventName, setEventName] = useState('');
  const [eventDuration, setEventDuration] = useState(15);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState('Work');
  const [viewMode, setViewMode] = useState(Views.WEEK);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Modal.setAppElement('body');
    }
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('http://localhost:5000/events');
    const data = await res.json();
    const parsedEvents = data.map(e => ({
      ...e,
      start: new Date(e.time),
      end: new Date(new Date(e.time).getTime() + e.duration * 60000),
    }));
    setEvents(parsedEvents);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSelectSlot = ({ start }) => {
    const now = new Date();
    const selected = new Date(start);
    selected.setSeconds(0, 0);

    if (selected < new Date(now.setSeconds(0, 0))) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot create events in the past.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    setSelectedSlot(selected);
    setEventName('');
    setEventDuration(15);
    setEventDescription('');
    setEventType('Work');
    setSelectedEvent(null);
    setModalIsOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setSelectedSlot(null);
    setEventName(event.name);
    setEventDuration((event.end - event.start) / 60000);
    setEventDescription(event.description || '');
    setEventType(event.type || 'Work');
    setModalIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!eventName.trim()) {
      Swal.fire('Event name is required', '', 'warning');
      return;
    }

    if (!eventDuration || isNaN(eventDuration) || eventDuration <= 0) {
      Swal.fire('Please enter a valid duration in minutes', '', 'warning');
      return;
    }

    const payload = {
      name: eventName,
      time: selectedSlot.toISOString(),
      duration: parseInt(eventDuration),
      description: eventDescription,
      type: eventType,
    };

    const res = await fetch('http://localhost:5000/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await fetchEvents();
      setModalIsOpen(false);
      setEventName('');
      setEventDuration(15);
      setEventDescription('');
      setSelectedSlot(null);
    } else {
      const err = await res.json();
      Swal.fire('Error', err.error, 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    const result = await Swal.fire({
      title: 'Are you sure you want to delete this event?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`http://localhost:5000/events/${selectedEvent._id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      await fetchEvents();
      setModalIsOpen(false);
      setSelectedEvent(null);
      setEventName('');
      setEventDuration(15);
      setEventDescription('');
      setEventType('Work');
    }
  };

  const customEventStyleGetter = (event) => {
    const backgroundColor = '#4e73df';
    const style = {
      backgroundColor,
      borderRadius: '5px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
      display: 'block',
      padding: '2px 5px'
    };
    return { style };
  };

  const handleViewChange = (newView) => {
    setViewMode(newView);
  };
  

  return (
    <div className="container mt-3">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={viewMode}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        step={15}
        timeslots={1}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        startAccessor="start"
        endAccessor="end"
        date={viewDate}
        onNavigate={date => setViewDate(date)}
        onView={handleViewChange}
        view={viewMode}
        style={{ height: 600 }}
        eventPropGetter={customEventStyleGetter}
      />

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: 'auto',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }
        }}
      >
        <div className="modal-dialog modal-md">
          <div className="modal-content p-3">
            <h4>{selectedEvent ? 'Event Details' : 'Create Event'}</h4>
            <input
              type="text"
              placeholder="Event Name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="form-control mb-2"
            />
            {!selectedEvent && (
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={eventDuration}
                onChange={(e) => setEventDuration(e.target.value)}
                className="form-control mb-2"
              />
            )}

            {selectedEvent ? (
              <>
                <p><strong>Time:</strong> {moment(selectedEvent.start).format('MMMM Do YYYY, h:mm A')}</p>
                <p><strong>Duration:</strong> {eventDuration} minutes</p>
                <button onClick={handleDelete} className="btn btn-danger">Delete Event</button>
              </>
            ) : (
              <button onClick={handleSubmit} className="btn btn-primary">Save</button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default App;
