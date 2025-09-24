import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Plus, Bell } from "lucide-react";
import { useSettings } from "../shared/contexts/SettingsContext";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "memo" | "alarm";
  time?: string;
  notified?: boolean;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState<"memo" | "alarm">("memo");
  const [eventTime, setEventTime] = useState("");

  const { formatDate: formatUserDate } = useSettings();

  // Localization removed; inline English strings from locales/en.json
  const t_calendar = "Calendar";
  const t_today = "Today";
  const t_hasEvents = "Has Events";
  const t_addEventFor = "Add Event for";
  const t_eventsFor = "Events for";
  const t_noEvents = "No events for this date.";
  const t_cancel = "Cancel";

  // Check for alarms and send notifications
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5);

      events.forEach((event) => {
        if (
          event.type === "alarm" &&
          event.date === today &&
          event.time === currentTime &&
          !event.notified
        ) {
          // Send notification
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Calendar Reminder", {
              body: event.title,
              icon: "/favicon.ico",
            });
          }

          // Mark as notified
          setEvents((prev) =>
            prev.map((e) => (e.id === event.id ? { ...e, notified: true } : e)),
          );
        }
      });
    };

    const interval = setInterval(checkAlarms, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [events]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getEvents = (date: string) => {
    return events.filter((event) => event.date === date);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    );
    setSelectedDate(clickedDate);
    setShowEventForm(true);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !eventTitle.trim()) return;

    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      date: formatDate(selectedDate),
      title: eventTitle.trim(),
      type: eventType,
      time: eventType === "alarm" ? eventTime : undefined,
      notified: false,
    };

    setEvents((prev) => [...prev, newEvent]);
    setEventTitle("");
    setEventTime("");
    setShowEventForm(false);
    setSelectedDate(null);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const dateStr = formatDate(date);
      const isToday = dateStr === formatDate(new Date());
      const dayEvents = getEvents(dateStr);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-10 w-full flex items-center justify-center text-sm cursor-pointer rounded transition-colors relative ${
            isToday
              ? "bg-blue-500 text-white"
              : dayEvents.length > 0
                ? "bg-yellow-300 text-gray-900 font-bold"
                : "hover:bg-gray-100"
          }`}
          title={dayEvents.map((e) => e.title).join(", ")}
        >
          {day}
        </div>,
      );
    }

    return days;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t_calendar}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                  ),
                )
              }
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                  ),
                )
              }
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center font-medium text-gray-600 text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>

          <div className="mt-6 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>{t_today}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
              <span>{t_hasEvents}</span>
            </div>
          </div>
        </div>

        {showEventForm && selectedDate && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h4 className="font-medium mb-4">
              {t_addEventFor} {formatUserDate(selectedDate)}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(e.target.value as "memo" | "alarm")
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="memo">Memo</option>
                  <option value="alarm">Alarm</option>
                </select>
              </div>

              {eventType === "alarm" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alarm Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleAddEvent}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={!eventTitle.trim()}
                >
                  Add Event
                </button>
                <button
                  onClick={() => {
                    setShowEventForm(false);
                    setSelectedDate(null);
                    setEventTitle("");
                    setEventTime("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  {t_cancel}
                </button>
              </div>
            </div>

            {/* Show events for selected date below the form */}
            <div className="mt-6">
              <h5 className="font-medium mb-2">
                {t_eventsFor} {formatUserDate(selectedDate)}:
              </h5>
              {getEvents(formatDate(selectedDate)).length === 0 ? (
                <div className="text-gray-500">{t_noEvents}</div>
              ) : (
                <ul className="space-y-2">
                  {getEvents(formatDate(selectedDate)).map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center gap-2 p-2 bg-white rounded shadow"
                    >
                      {event.type === "alarm" ? (
                        <Bell className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Plus className="w-4 h-4 text-blue-500" />
                      )}
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-600">
                          {event.time ? `Alarm at ${event.time}` : "Memo"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="border-t border-gray-200 p-6">
            <h4 className="font-medium mb-4">Upcoming Events</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {events
                .filter((event) => event.date >= formatDate(new Date()))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                  >
                    {event.type === "alarm" ? (
                      <Bell className="w-4 h-4 text-orange-500" />
                    ) : (
                      <Plus className="w-4 h-4 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString()}
                        {event.time && ` at ${event.time}`}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarModal;
