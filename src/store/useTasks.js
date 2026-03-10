import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '@clerk/react';
import {
  fetchTasks as fetchTasksAction,
  addTask as addTaskAction,
  updateTask as updateTaskAction,
  deleteTask as deleteTaskAction,
  toggleTask as toggleTaskAction,
  selectTasks,
  selectTasksLoading,
  selectTasksError,
} from './tasksSlice';

export function useTasks() {
  const dispatch = useDispatch();
  const { getToken, isSignedIn } = useAuth();

  const tasks   = useSelector(selectTasks);
  const loading = useSelector(selectTasksLoading);
  const error   = useSelector(selectTasksError);

  // Fetch tasks when user signs in
  useEffect(() => {
    if (isSignedIn) {
      dispatch(fetchTasksAction(getToken));
    }
  }, [isSignedIn, getToken, dispatch]);

  const addTask = (taskData) =>
    dispatch(addTaskAction({ taskData, getToken })).unwrap();

  const updateTask = (id, updates) =>
    dispatch(updateTaskAction({ id, updates, getToken })).unwrap();

  const deleteTask = (id) =>
    dispatch(deleteTaskAction({ id, getToken })).unwrap();

  const toggleTask = (id) =>
    dispatch(toggleTaskAction({ id, getToken })).unwrap();

  const refetch = () => dispatch(fetchTasksAction(getToken));

  return { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask, refetch };
}
