'use client';

import { useState, useEffect } from 'react';
import { SalesPerson, Meeting } from '../types';
import Link from 'next/link';
import AddSalesPersonModal from '../components/AddSalesPersonModal';
import DashboardLayout from '../components/DashboardLayout';

// Initial mock data
const initialSalesPeople: SalesPerson[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    target: { meetings: 20, deals: 10 },
    current: { meetings: 15, deals: 7 },
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    target: { meetings: 20, deals: 10 },
    current: { meetings: 18, deals: 9 },
  },
];

const ProgressBar = ({ current, target }: { current: number; target: number }) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div 
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Add this helper function
const getSalesPersonAlerts = (meetings: Meeting[] | undefined) => {
  const alerts = {
    hasIncompleteOutcomes: false,
    hasWeekendMeetings: false
  };

  if (!meetings) return alerts;

  meetings.forEach(meeting => {
    const meetingDate = new Date(meeting.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for past meetings without outcomes
    if (meetingDate < today && !meeting.outcome) {
      alerts.hasIncompleteOutcomes = true;
    }

    // Check for weekend meetings
    if (meetingDate.getDay() === 0 || meetingDate.getDay() === 6) {
      alerts.hasWeekendMeetings = true;
    }
  });

  return alerts;
};

export default function SalesPeople() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Load sales people
        const savedSalesPeople = localStorage.getItem('salesPeople');
        if (savedSalesPeople) {
          setSalesPeople(JSON.parse(savedSalesPeople));
        } else {
          setSalesPeople(initialSalesPeople);
          localStorage.setItem('salesPeople', JSON.stringify(initialSalesPeople));
        }

        // Load meetings
        const savedMeetings = localStorage.getItem('meetings');
        if (savedMeetings) {
          setMeetings(JSON.parse(savedMeetings));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setSalesPeople(initialSalesPeople);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const handleAddSalesPerson = (newSalesPerson: Omit<SalesPerson, 'id'>) => {
    try {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const updatedSalesPeople = [...salesPeople, { ...newSalesPerson, id }];
      setSalesPeople(updatedSalesPeople);
      localStorage.setItem('salesPeople', JSON.stringify(updatedSalesPeople));
    } catch (error) {
      console.error('Error adding sales person:', error);
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Sales People
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                A list of all sales people and their current performance against KPIs.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Add sales person
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                  <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Meetings Progress
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Deals Progress
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {salesPeople.map((person) => {
                        const personMeetings = meetings.filter(m => m.salesPersonId === person.id);
                        const alerts = getSalesPersonAlerts(personMeetings);
                        
                        return (
                          <tr key={person.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {person.name}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    {person.email}
                                  </div>
                                </div>
                                {(alerts.hasIncompleteOutcomes || alerts.hasWeekendMeetings) && (
                                  <div className="flex gap-1">
                                    {alerts.hasIncompleteOutcomes && (
                                      <span 
                                        className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700"
                                        title="Has meetings without outcomes"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </span>
                                    )}
                                    {alerts.hasWeekendMeetings && (
                                      <span 
                                        className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700"
                                        title="Has meetings that need rescheduling"
                                      >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex flex-col gap-1">
                                <span>
                                  {person.current.meetings} / {person.target.meetings} meetings
                                </span>
                                <ProgressBar 
                                  current={person.current.meetings} 
                                  target={person.target.meetings} 
                                />
                              </div>
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex flex-col gap-1">
                                <span>
                                  {person.current.deals} / {person.target.deals} deals
                                </span>
                                <ProgressBar 
                                  current={person.current.deals} 
                                  target={person.target.deals} 
                                />
                              </div>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Link
                                href={`/sales-people/${person.id}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                View details
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <AddSalesPersonModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleAddSalesPerson}
          />
        </div>
      </div>
    </DashboardLayout>
  );
} 