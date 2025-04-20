import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Shield, ShieldOff, Trash2, Eye, UserX, RefreshCw, XCircle } from 'lucide-react';
import { getUsers, getAdminList, addAdmin, removeAdmin } from '../../lib/supabaseClient';

type User = {
  id: string;
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
};

const UserManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const observer = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lastUserElementRef = useCallback((node: HTMLElement | null) => {
    if (loadingRef.current || loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        // Set loading flag to prevent multiple calls
        loadingRef.current = true;

        // Clear any existing timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        // Debounce the loadMore call
        timerRef.current = setTimeout(() => {
          loadMoreUsers();
          // Reset loading flag after a delay to prevent rapid consecutive calls
          setTimeout(() => {
            loadingRef.current = false;
          }, 1000);
        }, 300);
      }
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px 500px 0px' // Load earlier before reaching the end
    });

    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const fetchData = async (refresh = false) => {
    // Prevent excessive fetching by requiring at least 10 seconds between fetches
    // unless refresh=true is specified
    const now = Date.now();
    if (!refresh && lastFetchTime && now - lastFetchTime < 10000) {
      return;
    }

    try {
      if (refresh) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      // Get users with pagination
      const usersResponse = await getUsers(20, refresh ? 0 : page * 20);
      if (usersResponse.error) throw new Error(usersResponse.error.message);

      // Get admin list
      const adminsResponse = await getAdminList();
      if (adminsResponse.error) throw new Error(adminsResponse.error.message);

      // Process the admin list data to extract user IDs
      const processAdminData = (adminResponse: any) => {
        if (!adminResponse.data) return [];

        // Extract user_id from each admin object
        return adminResponse.data.map((admin: {user_id: string}) => admin.user_id);
      };

      // Extract admin user IDs
      const adminUserIds = processAdminData(adminsResponse);

      // Update the admin IDs
      setAdminIds(adminUserIds);

      const newUsers = usersResponse.data || [];

      // If we received fewer items than requested, there are no more items
      setHasMore(newUsers.length === 20);

      if (refresh) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }

      if (!refresh) {
        setPage(prev => prev + 1);
      }

      setLastFetchTime(now);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreUsers = () => {
    if (!loadingMore && hasMore && !loadingRef.current) {
      fetchData(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, []);

  useEffect(() => {
    // Set up visibility change detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('UserManager: Tab became visible, refreshing data');
        fetchData(true);
      }
    };

    // Handle page focus/visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleMakeAdmin = async (userId: string) => {
    try {
      setActionLoading(userId);
      setError(null);
      const response = await addAdmin(userId);

      if (response.error) throw new Error(response.error.message);

      // Add user to local adminIds state
      setAdminIds([...adminIds, userId]);
    } catch (err: any) {
      console.error('Error making user admin:', err);
      setError(err.message || 'Failed to update admin status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      setActionLoading(userId);
      setError(null);
      const response = await removeAdmin(userId);

      if (response.error) throw new Error(response.error.message);

      // Remove user from local adminIds state
      setAdminIds(adminIds.filter(id => id !== userId));
    } catch (err: any) {
      console.error('Error removing admin:', err);
      setError(err.message || 'Failed to update admin status');
    } finally {
      setActionLoading(null);
    }
  };

  // In a real app, this would call a proper user delete function
  const handleDeleteUser = async (userId: string) => {
    try {
      alert(`User deletion for ID: ${userId} would be implemented in a production environment`);
      // Here you would call the actual delete user API
      // const { error } = await deleteUser(userId);
      // if (error) throw new Error(error.message);

      // Remove from local state after successful deletion
      setUsers(prev => prev.filter(user => user.id !== userId));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="manga-panel-outer relative h-full overflow-hidden">
      <div className="h-full overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold manga-title">User Management</h2>
            <button 
              onClick={() => fetchData(true)}
              className="manga-border px-4 py-2 hover:text-blue-500 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-md pl-10 py-2 focus:manga-border focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="manga-panel p-6 bg-black/30 text-center">
            <p className="manga-title text-xl">Loading users...</p>
            <RefreshCw className="w-8 h-8 mx-auto mt-4 animate-spin" />
          </div>
        ) : error ? (
          <div className="manga-panel p-6 bg-black/30 text-center">
            <p className="manga-title text-xl text-red-500 mb-4">Error Loading Users</p>
            <p className="mb-6">{error}</p>
            <button 
              onClick={() => fetchData(true)}
              className="manga-border px-4 py-2 hover:text-blue-500"
              type="button"
            >
              Try Again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="manga-panel p-8 bg-black/30 text-center">
            {searchTerm ? (
              <>
                <p className="manga-title text-xl mb-4">No users match your search</p>
                <p className="mb-6">Try a different search term or clear the search.</p>
              </>
            ) : (
              <>
                <p className="manga-title text-xl mb-4">No users found</p>
                <p className="mb-6">There are no users registered in the system.</p>
              </>
            )}
          </div>
        ) : (
          <div className="manga-panel bg-black/20 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/40">
                  <th className="p-4">User</th>
                  <th className="p-4 hidden md:table-cell">Email</th>
                  <th className="p-4 hidden sm:table-cell">Status</th>
                  <th className="p-4 hidden lg:table-cell">Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className="border-t border-white/10 hover:bg-black/30 transition-colors relative"
                    ref={index === filteredUsers.length - 1 ? lastUserElementRef : null}
                  >
                    <td className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-700 overflow-hidden">
                        {user.avatar_url ? (
                          <img 
                            src={user.avatar_url} 
                            alt={user.username || user.email} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-900">
                            <span className="text-white text-sm font-bold">
                              {(user.username?.substring(0, 1) || user.email?.substring(0, 1) || "U").toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-white">
                          {user.username || "Anonymous User"}
                        </div>
                        <div className="text-sm text-gray-400 md:hidden truncate">
                          {user.email}
                        </div>
                        {adminIds.includes(user.id) && (
                          <span className="inline-block sm:hidden bg-red-500/30 text-red-400 text-xs px-2 py-1 rounded mt-1">
                            Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-300 hidden md:table-cell">
                      <span className="truncate max-w-[220px] inline-block">{user.email}</span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {adminIds.includes(user.id) ? (
                        <span className="bg-red-500/30 text-red-400 text-xs px-2 py-1 rounded">
                          Admin
                        </span>
                      ) : (
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 hidden lg:table-cell">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {!adminIds.includes(user.id) ? (
                          <button 
                            onClick={() => handleMakeAdmin(user.id)}
                            className="p-2 hover:text-blue-500 transition-colors"
                            title="Make admin"
                            disabled={actionLoading === user.id}
                            type="button"
                          >
                            {actionLoading === user.id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Shield className="w-5 h-5" />
                            )}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRemoveAdmin(user.id)}
                            className="p-2 hover:text-yellow-500 transition-colors"
                            title="Remove admin"
                            disabled={actionLoading === user.id}
                            type="button"
                          >
                            {actionLoading === user.id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <ShieldOff className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <button 
                          onClick={() => setDeleteConfirm(user.id)}
                          className="p-2 hover:text-red-500 transition-colors"
                          title="Delete user"
                          type="button"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2 hover:text-green-500 transition-colors hidden sm:inline-block"
                          title="View user profile"
                          type="button"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {deleteConfirm === user.id && (
                          <div className="absolute right-4 top-full mt-2 p-4 bg-gray-900 manga-border z-50">
                            <p className="mb-2 text-left">Delete this user?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center gap-1 text-sm"
                                type="button"
                              >
                                <UserX className="w-4 h-4" />
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded flex items-center gap-1 text-sm"
                                type="button"
                              >
                                <XCircle className="w-4 h-4" />
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loadingMore && (
              <div className="p-4 text-center">
                <div className="inline-block manga-border px-4 py-2">
                  <RefreshCw className="w-5 h-5 inline-block mr-2 animate-spin" />
                  Loading more users...
                </div>
              </div>
            )}
            
            {!hasMore && filteredUsers.length > 10 && (
              <div className="p-4 text-center text-gray-400">
                You've reached the end of the user list
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
