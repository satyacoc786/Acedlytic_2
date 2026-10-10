import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import { Calendar as CalendarIcon, Filter, Search, BookOpen, Clock } from 'lucide-react';

export const StudentCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setEvents(data.events);
          setFilteredEvents(data.events);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = [...events];
    if (selectedType !== 'ALL') {
      list = list.filter(e => e.event_type === selectedType);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(e => e.day_allocation.toLowerCase().includes(q) || e.date.includes(q) || e.day_count.toLowerCase().includes(q));
    }
    setFilteredEvents(list);
  }, [searchTerm, selectedType, events]);

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'Holiday':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Exam':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'WorkingDay':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-sky-600" />
            <h1 className="text-xl font-bold text-slate-900">Academic Calendar & Examination Schedule</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official institutional calendar containing 290 scheduled instructional days, holidays, and semester examinations.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search events or dates..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition w-48"
            />
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
            {['ALL', 'Exam', 'Holiday', 'WorkingDay'].map(t => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  selectedType === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'ALL' ? 'All' : t === 'WorkingDay' ? 'Working Days' : `${t}s`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
          <span>Showing {filteredEvents.length} scheduled calendar entries</span>
          <span>Semester Working Days & Examinations</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading academic calendar...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No events found matching your filter criteria.</div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Sl. No.</th>
                  <th className="px-4 py-3">Scheduled Date</th>
                  <th className="px-4 py-3">Day Allocation / Academic Activity</th>
                  <th className="px-4 py-3 text-center">Day Count</th>
                  <th className="px-4 py-3 text-center">Week</th>
                  <th className="px-4 py-3 text-center">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-2.5 font-mono text-slate-400">{evt.sl_no}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{evt.date}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{evt.day_allocation}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-slate-600">{evt.day_count}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-slate-600">{evt.week_count}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeClass(evt.event_type)}`}>
                        {evt.event_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
