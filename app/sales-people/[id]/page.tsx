'use client';

import { useState, useEffect } from 'react';
import { SalesPerson, Meeting, Deal } from '../../types';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';

interface PageProps {
  params: {
    id: string;
  };
}

export default function SalesPersonDetail({ params }: PageProps) {
  const router = useRouter();
  const [salesPerson, setSalesPerson] = useState<SalesPerson | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = () => {
      if (typeof window === 'undefined') return;

      try {
        // Load sales person data
        const savedSalesPeople = localStorage.getItem('salesPeople');
        if (!savedSalesPeople) {
          router.push('/sales-people');
          return;
        }

        const allSalesPeople = JSON.parse(savedSalesPeople);
        const person = allSalesPeople.find((p: SalesPerson) => p.id === params.id);
        if (!person) {
          router.push('/sales-people');
          return;
        }

        setSalesPerson(person);

        // Initialize meetings array if it doesn't exist
        const savedMeetings = localStorage.getItem('meetings');
        if (!savedMeetings) {
          localStorage.setItem('meetings', JSON.stringify([]));
        }
        const allMeetings = savedMeetings ? JSON.parse(savedMeetings) : [];
        setMeetings(allMeetings.filter((m: Meeting) => m.salesPersonId === params.id));

        // Initialize deals array if it doesn't exist
        const savedDeals = localStorage.getItem('deals');
        if (!savedDeals) {
          localStorage.setItem('deals', JSON.stringify([]));
        }
        const allDeals = savedDeals ? JSON.parse(savedDeals) : [];
        setDeals(allDeals.filter((d: Deal) => d.salesPersonId === params.id));
      } catch (error) {
        console.error('Error loading data:', error);
        router.push('/sales-people');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id, router]);

  const handleAddMeeting = () => {
    if (!salesPerson || typeof window === 'undefined') return;

    try {
      const clientName = window.prompt('Enter client name:');
      if (!clientName) return;

      const notes = window.prompt('Enter meeting notes (optional):') || '';

      const newMeeting: Meeting = {
        id: `meeting-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        salesPersonId: salesPerson.id,
        clientName,
        date: new Date().toISOString().split('T')[0],
        notes,
      };

      // Update meetings
      const savedMeetings = localStorage.getItem('meetings') || '[]';
      const allMeetings = JSON.parse(savedMeetings);
      const updatedMeetings = [...allMeetings, newMeeting];
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
      setMeetings(prev => [...prev, newMeeting]);

      // Update sales person's current meetings count
      const savedSalesPeople = localStorage.getItem('salesPeople');
      if (savedSalesPeople) {
        const allSalesPeople = JSON.parse(savedSalesPeople);
        const updatedSalesPeople = allSalesPeople.map((p: SalesPerson) => {
          if (p.id === salesPerson.id) {
            return {
              ...p,
              current: {
                ...p.current,
                meetings: (p.current.meetings || 0) + 1,
              },
            };
          }
          return p;
        });
        localStorage.setItem('salesPeople', JSON.stringify(updatedSalesPeople));
        const updatedPerson = updatedSalesPeople.find((p: SalesPerson) => p.id === params.id);
        if (updatedPerson) setSalesPerson(updatedPerson);
      }
    } catch (error) {
      console.error('Error adding meeting:', error);
    }
  };

  const handleAddDeal = () => {
    if (!salesPerson) return;

    try {
      const clientName = window.prompt('Enter client name:');
      if (!clientName) return;

      const valueStr = window.prompt('Enter deal value:');
      if (!valueStr) return;
      
      const value = parseInt(valueStr);
      if (isNaN(value)) {
        alert('Please enter a valid number for the deal value');
        return;
      }

      const status = window.confirm('Was the deal won?') ? 'won' : 'lost';

      const newDeal: Deal = {
        id: `deal-${Date.now()}`,
        salesPersonId: salesPerson.id,
        clientName,
        value,
        closedDate: new Date().toISOString().split('T')[0],
        status,
      };

      // Update deals
      const savedDeals = localStorage.getItem('deals');
      const allDeals = savedDeals ? JSON.parse(savedDeals) : [];
      const updatedDeals = [...allDeals, newDeal];
      localStorage.setItem('deals', JSON.stringify(updatedDeals));
      setDeals(prev => [...prev, newDeal]);

      // Update sales person's current deals count if won
      if (status === 'won') {
        const savedSalesPeople = localStorage.getItem('salesPeople');
        if (savedSalesPeople) {
          const allSalesPeople = JSON.parse(savedSalesPeople);
          const updatedSalesPeople = allSalesPeople.map((p: SalesPerson) => {
            if (p.id === salesPerson.id) {
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
          const updatedPerson = updatedSalesPeople.find((p: SalesPerson) => p.id === params.id);
          if (updatedPerson) setSalesPerson(updatedPerson);
        }
      }
    } catch (error) {
      console.error('Error adding deal:', error);
    }
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (!salesPerson || !window.confirm('Are you sure you want to delete this meeting?')) return;

    try {
      // Update meetings in localStorage
      const savedMeetings = localStorage.getItem('meetings') || '[]';
      const allMeetings = JSON.parse(savedMeetings);
      const updatedMeetings = allMeetings.filter((m: Meeting) => m.id !== meetingId);
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));
      
      // Update meetings state
      setMeetings(updatedMeetings.filter((m: Meeting) => m.salesPersonId === params.id));

      // Update sales person's current meetings count
      const savedSalesPeople = localStorage.getItem('salesPeople');
      if (savedSalesPeople) {
        const allSalesPeople = JSON.parse(savedSalesPeople);
        const updatedSalesPeople = allSalesPeople.map((p: SalesPerson) => {
          if (p.id === salesPerson.id) {
            return {
              ...p,
              current: {
                ...p.current,
                meetings: p.current.meetings - 1,
              },
            };
          }
          return p;
        });
        localStorage.setItem('salesPeople', JSON.stringify(updatedSalesPeople));
        setSalesPerson(updatedSalesPeople.find((p: SalesPerson) => p.id === params.id) || null);
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const handleDeleteDeal = (dealId: string) => {
    if (!salesPerson || !window.confirm('Are you sure you want to delete this deal?')) return;

    try {
      // Get the deal to check if it was won before deleting
      const savedDeals = localStorage.getItem('deals') || '[]';
      const allDeals = JSON.parse(savedDeals);
      const dealToDelete = allDeals.find((d: Deal) => d.id === dealId);
      
      // Update deals in localStorage
      const updatedDeals = allDeals.filter((d: Deal) => d.id !== dealId);
      localStorage.setItem('deals', JSON.stringify(updatedDeals));
      
      // Update deals state
      setDeals(updatedDeals.filter((d: Deal) => d.salesPersonId === params.id));

      // If the deal was won, update the sales person's current deals count
      if (dealToDelete && dealToDelete.status === 'won') {
        const savedSalesPeople = localStorage.getItem('salesPeople');
        if (savedSalesPeople) {
          const allSalesPeople = JSON.parse(savedSalesPeople);
          const updatedSalesPeople = allSalesPeople.map((p: SalesPerson) => {
            if (p.id === salesPerson.id) {
              return {
                ...p,
                current: {
                  ...p.current,
                  deals: p.current.deals - 1,
                },
              };
            }
            return p;
          });
          localStorage.setItem('salesPeople', JSON.stringify(updatedSalesPeople));
          setSalesPerson(updatedSalesPeople.find((p: SalesPerson) => p.id === params.id) || null);
        }
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  const handleDeleteSalesPerson = () => {
    if (!salesPerson || typeof window === 'undefined' || 
        !window.confirm('Are you sure you want to delete this sales person? This will also delete all their meetings and deals.')) {
      return;
    }

    try {
      // Delete all meetings for this sales person
      const savedMeetings = localStorage.getItem('meetings') || '[]';
      const allMeetings = JSON.parse(savedMeetings);
      const updatedMeetings = allMeetings.filter((m: Meeting) => m.salesPersonId !== params.id);
      localStorage.setItem('meetings', JSON.stringify(updatedMeetings));

      // Delete all deals for this sales person
      const savedDeals = localStorage.getItem('deals') || '[]';
      const allDeals = JSON.parse(savedDeals);
      const updatedDeals = allDeals.filter((d: Deal) => d.salesPersonId !== params.id);
      localStorage.setItem('deals', JSON.stringify(updatedDeals));

      // Delete the sales person
      const savedSalesPeople = localStorage.getItem('salesPeople') || '[]';
      const allSalesPeople = JSON.parse(savedSalesPeople);
      const updatedSalesPeople = allSalesPeople.filter((p: SalesPerson) => p.id !== params.id);
      localStorage.setItem('salesPeople', JSON.stringify(updatedSalesPeople));

      router.push('/sales-people');
    } catch (error) {
      console.error('Error deleting sales person:', error);
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
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {salesPerson.name}
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                {salesPerson.email}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
              <button
                type="button"
                onClick={handleAddMeeting}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Add meeting
              </button>
              <button
                type="button"
                onClick={handleAddDeal}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
              >
                Add deal
              </button>
              <button
                type="button"
                onClick={handleDeleteSalesPerson}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
              >
                Delete sales person
              </button>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Meetings
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
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Deals Closed
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

          {/* Recent Meetings */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Meetings</h2>
            <div className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                {meetings.map((meeting) => (
                  <li key={meeting.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                            {meeting.clientName}
                          </p>
                          {meeting.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {meeting.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-4">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {new Date(meeting.date).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => handleDeleteMeeting(meeting.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
                {meetings.length === 0 && (
                  <li>
                    <div className="px-4 py-4 sm:px-6 text-gray-500 dark:text-gray-400 text-sm">
                      No meetings recorded yet
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
                        <div className="ml-2 flex-shrink-0 flex items-center space-x-4">
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
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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