import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, PlayCircle, ExternalLink } from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevMonthLastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const daysInPrevMonth = prevMonthLastDay.getDate();
  const startDay = firstDay.getDay();
  const matrix = [];
  let day = 1;
  let nextMonthDay = 1;
  for (let i = 0; i < 6; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < startDay) {
        week.push({
          day: daysInPrevMonth - startDay + j + 1,
          isCurrentMonth: false,
          date: new Date(year, month - 1, daysInPrevMonth - startDay + j + 1),
        });
      } else if (day > daysInMonth) {
        week.push({
          day: nextMonthDay,
          isCurrentMonth: false,
          date: new Date(year, month + 1, nextMonthDay++),
        });
      } else {
        week.push({
          day,
          isCurrentMonth: true,
          date: new Date(year, month, day++),
        });
      }
    }
    matrix.push(week);
    if (day > daysInMonth && nextMonthDay > 7) break;
  }
  return matrix;
}

export default function CustomCalendar() {
  const [current, setCurrent] = useState(new Date()); 
  const [today] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalEvents, setModalEvents] = useState([]);

  const year = current.getFullYear();
  const month = current.getMonth();
  const matrix = getMonthMatrix(year, month);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      // Fetch Syllabus (contains chapters and topics with start_time)
      const syllabusRes = await axios.get(`${API}/v1/students/syllabus`, { withCredentials: true });
      
      // Fetch User Bookings to get scheduled live sessions
      const profileRes = await axios.get(`${API}/v1/individual/profile-valid`, { withCredentials: true });
      const email = profileRes.data?.user?.email;
      
      let liveBookings = [];
      if (email) {
        const bookingsRes = await axios.get(`${API}/bookings?by=${email}`, { withCredentials: true });
        liveBookings = bookingsRes.data?.filter(b => b.status === "booked" && (b.category === "live" || b.category === "onsite")) || [];
      }

      const newEvents = [];

      // Process Syllabus for Chapter/Topic dates
      if (syllabusRes.data?.success && syllabusRes.data.courses) {
        syllabusRes.data.courses.forEach(course => {
          if (course.chapters) {
            course.chapters.forEach(chapter => {
              if (chapter.start_time) {
                newEvents.push({
                  date: new Date(chapter.start_time).toISOString().slice(0, 10),
                  time: new Date(chapter.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  title: `${chapter.title}`,
                  type: 'chapter',
                  isNew: true,
                  link: `/digital-hub?courseId=${course.courseId}` // Navigate to digital hub
                });
              }
              
              if (chapter.topics) {
                chapter.topics.forEach(topic => {
                  if (topic.start_time) {
                    newEvents.push({
                      date: new Date(topic.start_time).toISOString().slice(0, 10),
                      time: new Date(topic.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      title: `${topic.title}`,
                      type: 'topic',
                      link: `/digital-hub?courseId=${course.courseId}` 
                    });
                  }
                });
              }
            });
          }
        });
      }

      // Process Live Sessions from Bookings
      liveBookings.forEach(b => {
        if (b.start) {
          newEvents.push({
            date: new Date(b.start).toISOString().slice(0, 10),
            time: new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            title: b.title,
            type: 'live',
            link: b.link || null, // Join link
          });
        }
      });

      setEvents(newEvents);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    setCurrent(new Date(year, month - 1, 1));
  };
  const handleNext = () => {
    setCurrent(new Date(year, month + 1, 1));
  };

  const openModal = (dateStr, dayEvents) => {
    setSelectedDate(dateStr);
    setModalEvents(dayEvents);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setModalEvents([]);
  };

  return (
    <div className="custom-calendar-container relative">
      <div className="calendar-header">
        <button onClick={handlePrev} className="nav-btn">
          &#8592;
        </button>
        <h2>
          {current.toLocaleString("default", { month: "long" })} {year}
        </h2>
        <button onClick={handleNext} className="nav-btn">
          &#8594;
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-blue-600">Loading schedule...</div>
      ) : (
        <div className="calendar-grid">
          {WEEKDAYS.map((d) => (
            <div key={d} className="weekday">
              {d}
            </div>
          ))}
          {matrix.flat().map((cell, idx) => {
            // Local offset handling to avoid off-by-one errors with ISOString
            const cellDateLocal = new Date(cell.date.getTime() - (cell.date.getTimezoneOffset() * 60000));
            const dateStr = cellDateLocal.toISOString().slice(0, 10);
            
            const dayEvents = events.filter((e) => e.date === dateStr);
            const isToday =
              cell.isCurrentMonth &&
              cell.date.toDateString() === today.toDateString();
            
            return (
              <div
                key={idx}
                onClick={() => openModal(dateStr, dayEvents)}
                className={`calendar-cell cursor-pointer transition-colors hover:bg-blue-50 ${
                  cell.isCurrentMonth ? "" : " not-current"
                }${isToday ? " today" : ""}`}
              >
                <div className="flex justify-between items-start">
                    <div className="cell-date">{cell.day}</div>
                    {dayEvents.length > 0 && <div className="text-[10px] font-bold text-white bg-blue-500 rounded-full px-1.5 py-0.5">{dayEvents.length}</div>}
                </div>
                
                <div className="cell-events-text overflow-hidden h-full">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div key={i} className="event-text-line truncate">
                      <span className={`event-dot ${ev.type === 'live' ? 'text-green-500' : 'text-blue-500'}`}>●</span>
                      <span className="event-time">{ev.time}</span>
                      <span className="event-title-text truncate">{ev.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400 mt-1 pl-1">+{dayEvents.length - 3} more...</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Overlay */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold">Schedule</h3>
                <p className="text-blue-100 text-sm mt-1">
                  {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {modalEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No schedule for this day.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalEvents.map((ev, i) => (
                    <div key={i} className="border border-gray-100 bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-700">{ev.time}</span>
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            ev.type === 'live' ? 'bg-green-100 text-green-700' : 
                            ev.type === 'chapter' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {ev.type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{ev.title}</h4>
                      </div>
                      
                      {ev.link ? (
                        ev.type === 'live' ? (
                            <a href={ev.link} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                <PlayCircle size={16} /> Join Session
                            </a>
                        ) : (
                            <a href={ev.link} className="shrink-0 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                <ExternalLink size={16} /> View Content
                            </a>
                        )
                      ) : (
                          <span className="text-xs text-gray-400 italic">No link available</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-calendar-container {
          max-width: 950px;
          margin: 40px auto;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 32px #0001;
          padding: 32px 18px 24px 18px;
        }
        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin-bottom: 18px;
        }
        .calendar-header h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #1e40af;
          margin: 0 18px;
        }
        .nav-btn {
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1.3rem;
          padding: 6px 16px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .nav-btn:hover {
          background: #1e40af;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .weekday {
          font-weight: 700;
          color: #2563eb;
          text-align: center;
          padding: 8px 0 10px 0;
          background: #f1f5ff;
          border-radius: 8px;
          font-size: 1.1rem;
        }
        .calendar-cell {
          min-height: 100px;
          background: #f8fafc;
          border-radius: 10px;
          box-shadow: 0 1px 4px #2563eb11;
          padding: 8px;
          position: relative;
          font-size: 1.05rem;
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }
        .calendar-cell.not-current {
          background: #f3f4f6;
          color: #b6b6b6;
          opacity: 0.7;
        }
        .calendar-cell.today {
          border: 2px solid #2563eb;
          box-shadow: 0 0 0 2px #60a5fa33;
        }
        .cell-date {
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .cell-events-text {
          margin-top: 2px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .event-text-line {
          display: flex;
          align-items: center;
          font-size: 0.85em;
          font-weight: 500;
        }
        .event-dot {
          font-size: 1.1em;
          margin-right: 4px;
        }
        .event-time {
          font-weight: 700;
          color: #475569;
          margin-right: 4px;
        }
        .event-title-text {
          color: #1e293b;
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        @media (max-width: 900px) {
          .custom-calendar-container {
            padding: 10px 2px 18px 2px;
          }
          .calendar-header h2 {
            font-size: 1.2rem;
          }
          .calendar-cell {
            min-height: 80px;
            font-size: 0.95rem;
            padding: 4px;
          }
        }
        @media (max-width: 600px) {
          .custom-calendar-container {
            padding: 2px 0 8px 0;
          }
          .calendar-header h2 {
            font-size: 1rem;
          }
          .calendar-cell {
            min-height: 60px;
            font-size: 0.85rem;
          }
          .event-text-line {
             font-size: 0.75em;
          }
        }
      `}</style>
    </div>
  );
}
