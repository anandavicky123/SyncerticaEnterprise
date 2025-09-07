'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  project: {
    name: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function WorkerDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      // For now, we'll use mock data since we haven't implemented the tasks API yet
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Design user interface for login page',
          description: 'Create a modern, responsive login page design with proper accessibility features.',
          status: 'todo',
          priority: 'high',
          dueDate: '2024-01-15',
          estimatedHours: 8,
          project: {
            name: 'Authentication System',
            description: 'User authentication and authorization system'
          },
          createdAt: '2024-01-10T10:00:00Z',
          updatedAt: '2024-01-10T10:00:00Z'
        },
        {
          id: '2',
          title: 'Implement password validation',
          description: 'Add client-side and server-side password validation with strength indicators.',
          status: 'doing',
          priority: 'medium',
          dueDate: '2024-01-20',
          estimatedHours: 4,
          actualHours: 2,
          project: {
            name: 'Authentication System',
            description: 'User authentication and authorization system'
          },
          createdAt: '2024-01-08T14:30:00Z',
          updatedAt: '2024-01-12T09:15:00Z'
        },
        {
          id: '3',
          title: 'Write unit tests for API endpoints',
          description: 'Create comprehensive unit tests for all authentication-related API endpoints.',
          status: 'done',
          priority: 'medium',
          estimatedHours: 6,
          actualHours: 5,
          project: {
            name: 'Authentication System',
            description: 'User authentication and authorization system'
          },
          createdAt: '2024-01-05T11:00:00Z',
          updatedAt: '2024-01-11T16:45:00Z'
        }
      ];

      setTasks(mockTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      // Update local state immediately for better UX
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date().toISOString() } : task
      ));

      // Here you would make an API call to update the task status
      // const response = await fetch(`/api/tasks/${taskId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // });
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert the change if API call fails
      fetchTasks();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'doing':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    doing: tasks.filter(t => t.status === 'doing').length,
    done: tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage your assigned tasks and project work.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Task Filter Tabs */}
      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: 'All Tasks', count: taskCounts.all },
              { key: 'todo', label: 'To Do', count: taskCounts.todo },
              { key: 'doing', label: 'In Progress', count: taskCounts.doing },
              { key: 'done', label: 'Completed', count: taskCounts.done },
              { key: 'blocked', label: 'Blocked', count: taskCounts.blocked },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    filter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tasks List */}
      <div className="mt-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? "You don't have any tasks assigned yet."
                : `No tasks with status "${filter}".`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white shadow rounded-lg border border-gray-200">
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {task.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          {task.project.name}
                        </span>
                        
                        {task.dueDate && (
                          <span className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}

                        {task.estimatedHours && (
                          <span className="flex items-center">
                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {task.actualHours ? `${task.actualHours}/${task.estimatedHours}h` : `${task.estimatedHours}h estimated`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                      >
                        <option value="todo">To Do</option>
                        <option value="doing">In Progress</option>
                        <option value="done">Completed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      Updated {new Date(task.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Summary */}
      {tasks.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Task Summary</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{taskCounts.todo}</div>
                <div className="text-sm text-gray-500">To Do</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{taskCounts.doing}</div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{taskCounts.done}</div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{taskCounts.blocked}</div>
                <div className="text-sm text-gray-500">Blocked</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}