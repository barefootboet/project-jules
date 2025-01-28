import DashboardLayout from './components/DashboardLayout';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Welcome to the home of keeping up to date with your activity
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Select an option from the sidebar to get started.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
