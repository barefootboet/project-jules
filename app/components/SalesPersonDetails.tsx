'use client';

import { useState, useEffect } from 'react';
import { SalesPerson, Meeting, Deal } from '../types';
import { useRouter } from 'next/navigation';
import DashboardLayout from './DashboardLayout';

interface SalesPersonDetailsProps {
  id: string;
}

interface StoredData {
  salesPeople: SalesPerson[];
  meetings: Meeting[];
  deals: Deal[];
}

const getStoredData = <T extends keyof StoredData>(key: T): StoredData[T] => {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as StoredData[T]) : ([] as StoredData[T]);
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return [] as StoredData[T];
  }
};

const setStoredData = <T extends keyof StoredData>(key: T, data: StoredData[T]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

const handleDeleteSalesPerson = async (
  id: string,
  router: ReturnType<typeof useRouter>
) => {
  if (!window.confirm('Are you sure you want to delete this sales person? This will also delete all their meetings and deals.')) {
    return;
  }

  try {
    // Delete meetings
    const savedMeetings = localStorage.getItem('meetings') || '[]';
    const allMeetings: Meeting[] = JSON.parse(savedMeetings);
    const updatedMeetings = allMeetings.filter(m => m.salesPersonId !== id);
    localStorage.setItem('meetings', JSON.stringify(updatedMeetings));

    // Delete deals
    const savedDeals = localStorage.getItem('deals') || '[]';
    const allDeals: Deal[] = JSON.parse(savedDeals);
    const updatedDeals = allDeals.filter(d => d.salesPersonId !== id);
    localStorage.setItem('deals', JSON.stringify(updatedDeals));

    // Delete sales person
    const savedSalesPeople = localStorage.getItem('salesPeople') || '[]';
    const allSalesPeople: SalesPerson[] = JSON.parse(savedSalesPeople);
    const updatedSalesPeople = allSalesPeople.filter(p => p.id !== id);
    localStorage.setItem('salesPeople', JSON.stringify(updatedSalesPeople));

    await router.push('/sales-people');
  } catch (error) {
    console.error('Error deleting sales person:', error);
  }
};

export default function SalesPersonDetails({ id }: SalesPersonDetailsProps) {
  const router = useRouter();
  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      if (typeof window === 'undefined') return;

      try {
        const allSalesPeople = getStoredData('salesPeople');
        const person = allSalesPeople.find(p => p.id === id);
        if (!person) {
          router.push('/sales-people');
          return;
        }

        // Get all meetings for this sales person
        const allMeetings = getStoredData('meetings').filter(m => m.salesPersonId === id);
        
        // Count only this week's meetings for the current count
        const thisWeekMeetingsCount = allMeetings.filter(meeting => 
          isThisWeek(new Date(meeting.date))
        ).length;

        // Update the sales person with the correct current meetings count
        const updatedPerson = {
          ...person,
          current: {
            ...person.current,
            meetings: thisWeekMeetingsCount
          }
        };

        setSalesPerson(updatedPerson);
        setMeetings(allMeetings);
        setDeals(getStoredData('deals').filter(d => d.salesPersonId === id));

        // Update the stored sales person data
        const updatedSalesPeople = allSalesPeople.map(p => 
          p.id === id ? updatedPerson : p
        );
        setStoredData('salesPeople', updatedSalesPeople);
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/sales-people');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  const isThisWeek = (date: Date): boolean => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay() + 1); // This Monday
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 4); // This Friday
    thisWeekEnd.setHours(23, 59, 59, 999);
    
    return date >= thisWeekStart && date <= thisWeekEnd;
  };

  const handleAddMeeting = () => {
    if (!salesPerson) return;

    try {
      const clientName = window.prompt('Enter client name:')?.trim();
      if (!clientName) return;

      const meetingDate = window.prompt('Enter meeting date (YYYY-MM-DD):', new Date().toISOString().split('T')[0])?.trim();
      if (!meetingDate || !isValidDate(meetingDate)) {
        alert('Please enter a valid date in YYYY-MM-DD format');
        return;
      }

      const date = new Date(meetingDate);
      if (isWeekend(date)) {
        alert('Meetings can only be scheduled Monday through Friday. Please select a different date.');
        return;
      }

      const isFutureMeeting = new Date(meetingDate) > new Date();
      const notesPrompt = isFutureMeeting ? 'What is the meeting agenda?' : 'Enter meeting notes (optional):';
      const notes = window.prompt(notesPrompt)?.trim() ?? '';

      const newMeeting: Meeting = {
        id: `meeting-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        salesPersonId: id,
        clientName,
        date: meetingDate,
        notes,
      };

      const allMeetings = getStoredData('meetings');
      const updatedMeetings = [...allMeetings, newMeeting];
      setStoredData('meetings', updatedMeetings);
      setMeetings(prev => [...prev, newMeeting]);

      // Only increment the current meetings count if the meeting is this week
      if (isThisWeek(new Date(meetingDate))) {
        const allSalesPeople = getStoredData('salesPeople');
        const updatedSalesPeople = allSalesPeople.map(p => 
          p.id === id 
            ? { ...p, current: { ...p.current, meetings: p.current.meetings + 1 } }
            : p
        );
        setStoredData('salesPeople', updatedSalesPeople);
        const updatedPerson = updatedSalesPeople.find(p => p.id === id);
        if (updatedPerson) setSalesPerson(updatedPerson);
      }
    } catch (error) {
      console.error('Error adding meeting:', error);
    }
  };

  // Helper function to validate date format
  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleAddDeal = () => {
    if (!salesPerson) return;

    try {
      const clientName = window.prompt('Enter client name:');
      if (!clientName?.trim()) return;

      const valueStr = window.prompt('Enter deal value:');
      if (!valueStr?.trim()) return;
      
      const value = parseInt(valueStr.trim());
      if (isNaN(value)) {
        alert('Please enter a valid number for the deal value');
        return;
      }

      const status = window.confirm('Was the deal won?') ? 'won' : 'lost';

      const newDeal: Deal = {
        id: `deal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        salesPersonId: id,
        clientName: clientName.trim(),
        value,
        closedDate: new Date().toISOString().split('T')[0],
        status,
      };

      // Update deals
      const savedDeals = localStorage.getItem('deals') || '[]';
      const allDeals = JSON.parse(savedDeals);
      const updatedDeals = [...allDeals, newDeal];
      localStorage.setItem('deals', JSON.stringify(updatedDeals));
      setDeals(prev => [...prev, newDeal]);

      // Update sales person's current deals count if won
      if (status === 'won') {
        const savedSalesPeople = localStorage.getItem('salesPeople');
        if (savedSalesPeople) {
          const allSalesPeople = JSON.parse(savedSalesPeople);
          const updatedSalesPeople = allSalesPeople.map((p: SalesPerson) => {
            if (p.id === id) {
              return {
                ...p,
                current: {
                  ...p.current,
                  deals: p.current.deals + 1,
                },
              };
            }
            return p;
          });
          localStorage.setItem('salesPeople', JSON.stringify(updatedSalesPeople));
          const updatedPerson = updatedSalesPeople.find((p: SalesPerson) => p.id === id);
          if (updatedPerson) setSalesPerson(updatedPerson);
        }
      }
    } catch (error) {
      console.error('Error adding deal:', error);
    }
  };

  // Update handleEditMeeting to include outcome for past meetings
  const handleEditMeeting = (meeting: Meeting) => {
    try {
      const clientName = window.prompt('Enter client name:', meeting.clientName)?.trim();
      if (!clientName) return;

      const meetingDate = window.prompt('Enter meeting date (YYYY-MM-DD):', meeting.date)?.trim();
      if (!meetingDate || !isValidDate(meetingDate)) {
        alert('Please enter a valid date in YYYY-MM-DD format');
        return;
      }

      const date = new Date(meetingDate);
      if (isWeekend(date)) {
        alert('Meetings can only be scheduled Monday through Friday. Please select a different date.');
        return;
      }

      const isFutureMeeting = new Date(meetingDate) > new Date();
      let notes;
      let outcome;

      if (isFutureMeeting) {
        notes = window.prompt('What is the meeting agenda?', meeting.notes || '')?.trim() ?? '';
      } else {
        notes = window.prompt('Enter meeting notes (optional):', meeting.notes || '')?.trim() ?? '';
        outcome = window.prompt('What was the outcome of this meeting?', meeting.outcome || '')?.trim() ?? '';
      }

      const updatedMeeting: Meeting = {
        ...meeting,
        clientName,
        date: meetingDate,
        notes,
        outcome: isFutureMeeting ? undefined : outcome,
      };

      const allMeetings = getStoredData('meetings');
      const updatedMeetings = allMeetings.map(m => m.id === meeting.id ? updatedMeeting : m);
      setStoredData('meetings', updatedMeetings);
      setMeetings(prev => prev.map(m => m.id === meeting.id ? updatedMeeting : m));

      // Update the meetings count if needed
      const wasThisWeek = isThisWeek(new Date(meeting.date));
      const isNowThisWeek = isThisWeek(new Date(meetingDate));

      if (wasThisWeek !== isNowThisWeek) {
        const allSalesPeople = getStoredData('salesPeople');
        const updatedSalesPeople = allSalesPeople.map(p => {
          if (p.id === id) {
            return {
              ...p,
              current: {
                ...p.current,
                meetings: p.current.meetings + (isNowThisWeek ? 1 : -1)
              }
            };
          }
          return p;
        });
        setStoredData('salesPeople', updatedSalesPeople);
        const updatedPerson = updatedSalesPeople.find(p => p.id === id);
        if (updatedPerson) setSalesPerson(updatedPerson);
      }
    } catch (error) {
      console.error('Error editing meeting:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!salesPerson) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">Sales person not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {salesPerson.name}
                  </h1>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {salesPerson.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteSalesPerson(id, router)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Delete sales person"
                >
                  <svg 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
              <button
                type="button"
                onClick={handleAddMeeting}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:w-auto"
              >
                Add meeting
              </button>
              <button
                type="button"
                onClick={handleAddDeal}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 sm:w-auto"
              >
                Add deal
              </button>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Weekly Meetings Progress
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {salesPerson.current.meetings} / {salesPerson.target.meetings}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Deals Progress
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                          {salesPerson.current.deals} / {salesPerson.target.deals}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Meetings Attended This Week */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Meetings Attended This Week</h2>
            <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {meetings
                  .filter(meeting => {
                    const meetingDate = new Date(meeting.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return isThisWeek(meetingDate) && !isWeekend(meetingDate) && meetingDate < today;
                  })
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((meeting) => (
                    <li 
                      key={meeting.id}
                      className={!meeting.outcome ? 'bg-red-50 dark:bg-red-900/10' : ''}
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                            {meeting.clientName}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {new Date(meeting.date).toLocaleDateString()}
                            </p>
                            {!meeting.outcome && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Needs Outcome
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEditMeeting(meeting)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              aria-label="Edit meeting"
                            >
                              <svg 
                                className="h-4 w-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {meeting.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Notes: {meeting.notes}
                            </p>
                          </div>
                        )}
                        {meeting.outcome && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Outcome: {meeting.outcome}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                {!meetings.some(meeting => {
                  const meetingDate = new Date(meeting.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return isThisWeek(meetingDate) && !isWeekend(meetingDate) && meetingDate < today;
                }) && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-gray-500 dark:text-gray-400 text-sm">
                      No meetings attended this week
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Meetings to Attend This Week */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Meetings to Attend This Week</h2>
            <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {meetings
                  .filter(meeting => {
                    const meetingDate = new Date(meeting.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    // Only show meetings that are this week, not on weekends, and not in the past
                    return isThisWeek(meetingDate) && !isWeekend(meetingDate) && meetingDate >= today;
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((meeting) => (
                    <li key={meeting.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                            {meeting.clientName}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {new Date(meeting.date).toLocaleDateString()}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleEditMeeting(meeting)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              aria-label="Edit meeting"
                            >
                              <svg 
                                className="h-4 w-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {meeting.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {meeting.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                {!meetings.some(meeting => {
                  const meetingDate = new Date(meeting.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return isThisWeek(meetingDate) && !isWeekend(meetingDate) && meetingDate >= today;
                }) && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-gray-500 dark:text-gray-400 text-sm">
                      No meetings to attend this week
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Next Week's Meetings */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Meetings Next Week and Beyond</h2>
            <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {meetings
                  .filter(meeting => {
                    const meetingDate = new Date(meeting.date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return meetingDate > today && !isThisWeek(meetingDate) && !isWeekend(meetingDate);
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((meeting) => (
                    <li key={meeting.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-600 dark:text-green-400 truncate">
                            {meeting.clientName}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {new Date(meeting.date).toLocaleDateString()}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleEditMeeting(meeting)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              aria-label="Edit meeting"
                            >
                              <svg 
                                className="h-4 w-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {meeting.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {meeting.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                {!meetings.some(meeting => {
                  const meetingDate = new Date(meeting.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return meetingDate > today && !isThisWeek(meetingDate) && !isWeekend(meetingDate);
                }) && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-gray-500 dark:text-gray-400 text-sm">
                      No future meetings scheduled
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Meetings Needing Rescheduling */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Meetings Needing Rescheduling</h2>
            <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {meetings
                  .filter(meeting => {
                    const meetingDate = new Date(meeting.date);
                    return isWeekend(meetingDate);
                  })
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((meeting) => (
                    <li key={meeting.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-red-600 dark:text-red-400 truncate">
                            {meeting.clientName}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              {new Date(meeting.date).toLocaleDateString()} (Weekend)
                            </p>
                            <button
                              type="button"
                              onClick={() => handleEditMeeting(meeting)}
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              aria-label="Reschedule meeting"
                            >
                              <svg 
                                className="h-4 w-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {meeting.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {meeting.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                {!meetings.some(meeting => isWeekend(new Date(meeting.date))) && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-gray-500 dark:text-gray-400 text-sm">
                      No meetings need rescheduling
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Recent Deals */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Deals</h2>
            <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {deals.map((deal) => (
                  <li key={deal.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                          {deal.clientName}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex space-x-2">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ${deal.value.toLocaleString()}
                          </p>
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            deal.status === 'won' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {deal.status.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Closed on {new Date(deal.closedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                {deals.length === 0 && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-gray-500 dark:text-gray-400 text-sm">
                      No deals recorded yet
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 