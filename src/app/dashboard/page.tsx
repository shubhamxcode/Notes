'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Note } from '@/types'

interface User {
  id: string
  email: string
  role: 'admin' | 'member'
  createdAt: string
}

interface UpgradeInvitation {
  id: string
  message: string
  fromUser: { email: string }
  createdAt: string
  status: string
}

export default function DashboardPage() {
  const { user, logout, token } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [upgradeInvitations, setUpgradeInvitations] = useState<UpgradeInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [creating, setCreating] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editNote, setEditNote] = useState({ title: '', content: '' })
  
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showUsersList, setShowUsersList] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', role: 'member' as 'admin' | 'member', password: 'password' })
  const [inviting, setInviting] = useState(false)

  const [showUpgradeInviteForm, setShowUpgradeInviteForm] = useState(false)
  const [selectedUserForUpgrade, setSelectedUserForUpgrade] = useState<string>('')
  const [upgradeMessage, setUpgradeMessage] = useState('Your admin suggests upgrading to Pro for unlimited notes!')
  const [sendingUpgradeInvite, setSendingUpgradeInvite] = useState(false)

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch('/api/notes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
      }
    } catch (error) {
      console.error('Fetch notes error:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Fetch users error:', error)
    }
  }, [token])

  const fetchUpgradeInvitations = useCallback(async () => {
    try {
      const response = await fetch('/api/upgrade-invitations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUpgradeInvitations(data.invitations)
      }
    } catch (error) {
      console.error('Fetch upgrade invitations error:', error)
    }
  }, [token])

  const sendUpgradeInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForUpgrade) return

    setSendingUpgradeInvite(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${selectedUserForUpgrade}/invite-upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: upgradeMessage })
      })

      if (response.ok) {
        setShowUpgradeInviteForm(false)
        setSelectedUserForUpgrade('')
        setUpgradeMessage('Your admin suggests upgrading to Pro for unlimited notes!')
        setError('')
        const data = await response.json()
        alert(`Upgrade invitation sent to ${data.invitation.targetUser}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch {
      setError('Failed to send upgrade invitation')
    } finally {
      setSendingUpgradeInvite(false)
    }
  }

  const respondToUpgradeInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch('/api/upgrade-invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invitationId, action })
      })

      if (response.ok) {
        await fetchUpgradeInvitations()
        if (action === 'accept') {
          location.reload()
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch {
      setError('Failed to respond to upgrade invitation')
    }
  }

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNote)
      })

      if (response.ok) {
        await fetchNotes()
        setNewNote({ title: '', content: '' })
        setShowCreateForm(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch {
      setError('Failed to create note')
    } finally {
      setCreating(false)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchNotes()
      }
    } catch (error) {
      console.error('Delete note error:', error)
    }
  }

  const startEditNote = (note: Note) => {
    setEditingNote(note)
    setEditNote({ title: note.title, content: note.content })
    setShowEditForm(true)
    setShowCreateForm(false)
    setShowInviteForm(false)
    setShowUpgradeInviteForm(false)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setShowEditForm(false)
    setEditNote({ title: '', content: '' })
    setError('')
  }

  const updateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return
    
    setCreating(true)
    setError('')

    try {
      const response = await fetch(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editNote)
      })

      if (response.ok) {
        await fetchNotes()
        cancelEdit()
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch {
      setError('Failed to update note')
    } finally {
      setCreating(false)
    }
  }

  const inviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        await fetchUsers()
        setNewUser({ email: '', role: 'member', password: 'password' })
        setShowInviteForm(false)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch {
      setError('Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch {
      setError('Failed to delete user')
    }
  }

  const upgradeTenant = async () => {
    setUpgrading(true)
    setError('')

    try {
      const response = await fetch(`/api/tenants/${user?.tenant.slug}/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        location.reload()
      } else {
        const errorData = await response.json()
        setError(errorData.error)
      }
    } catch {
      setError('Failed to upgrade subscription')
    } finally {
      setUpgrading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchNotes()
    fetchUpgradeInvitations()
    if (user.role === 'admin') {
      fetchUsers()
    }
  }, [user, router, fetchNotes, fetchUpgradeInvitations, fetchUsers])

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const canCreateNote = user.tenant.subscription === 'pro' || notes.length < 3
  const isAtLimit = user.tenant.subscription === 'free' && notes.length >= 3

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notes Dashboard</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user.email} ({user.role}) - {user.tenant.name} ({user.tenant.subscription})
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {upgradeInvitations.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium text-purple-800 mb-3">Upgrade Invitations</h3>
              {upgradeInvitations.map((invitation) => (
                <div key={invitation.id} className="bg-white p-3 rounded border border-purple-200 mb-2">
                  <p className="text-sm text-gray-700 mb-2">{invitation.message}</p>
                  <p className="text-xs text-gray-500 mb-3">From: {invitation.fromUser.email}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => respondToUpgradeInvitation(invitation.id, 'accept')}
                      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                    >
                      Accept Upgrade
                    </button>
                    <button
                      onClick={() => respondToUpgradeInvitation(invitation.id, 'decline')}
                      className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user.tenant.subscription === 'free' && user.role === 'admin' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Free Plan Active</h3>
                  <p className="text-sm text-yellow-700">
                    You&apos;re on the free plan (limited to 3 notes per user). Upgrade to Pro for unlimited notes.
                  </p>
                </div>
                <button
                  onClick={upgradeTenant}
                  disabled={upgrading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {upgrading ? 'Upgrading...' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {user.role === 'admin' && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    User Management ({users.length} users)
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowUsersList(!showUsersList)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {showUsersList ? 'Hide Users' : 'View Users'}
                    </button>
                    <button
                      onClick={() => {
                        setShowUpgradeInviteForm(!showUpgradeInviteForm)
                        setShowInviteForm(false)
                        setShowCreateForm(false)
                        setShowEditForm(false)
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                    >
                      {showUpgradeInviteForm ? 'Cancel' : 'Invite to Upgrade'}
                    </button>
                    <button
                      onClick={() => {
                        setShowInviteForm(!showInviteForm)
                        setShowCreateForm(false)
                        setShowEditForm(false)
                        setShowUpgradeInviteForm(false)
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      {showInviteForm ? 'Cancel' : 'Invite User'}
                    </button>
                  </div>
                </div>

                {showUpgradeInviteForm && (
                  <form onSubmit={sendUpgradeInvitation} className="mb-6 p-4 border border-purple-200 bg-purple-50 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Invite User to Upgrade</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Select User</label>
                        <select
                          value={selectedUserForUpgrade}
                          onChange={(e) => setSelectedUserForUpgrade(e.target.value)}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Choose a user...</option>
                          {users.filter(u => u.id !== user.id).map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.email} ({u.role})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Invitation Message</label>
                        <textarea
                          rows={3}
                          value={upgradeMessage}
                          onChange={(e) => setUpgradeMessage(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Your upgrade invitation message..."
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={sendingUpgradeInvite || !selectedUserForUpgrade}
                          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                          {sendingUpgradeInvite ? 'Sending...' : 'Send Invitation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUpgradeInviteForm(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {showInviteForm && (
                  <form onSubmit={inviteUser} className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Invite New User</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          required
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Enter user email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'member' })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                        <input
                          type="text"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Temporary password for the user"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={inviting}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {inviting ? 'Inviting...' : 'Send Invitation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowInviteForm(false)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {showUsersList && (
                  <div className="space-y-2">
                    <h4 className="text-md font-medium text-gray-900">Current Users</h4>
                    {users.length === 0 ? (
                      <p className="text-gray-500">No users found.</p>
                    ) : (
                      <div className="space-y-2">
                        {users.map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50">
                            <div>
                              <span className="font-medium">{u.email}</span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {u.role}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                Joined {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {u.id !== user.id && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Your Notes ({notes.length}{user.tenant.subscription === 'free' ? '/3' : ''})
                </h3>
                {canCreateNote && (
                  <button
                    onClick={() => {
                      setShowCreateForm(!showCreateForm)
                      setShowInviteForm(false)
                      setShowEditForm(false)
                      setShowUpgradeInviteForm(false)
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {showCreateForm ? 'Cancel' : 'Create Note'}
                  </button>
                )}
              </div>

              {isAtLimit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-600">
                    You&apos;ve reached the 3-note limit for free accounts. Upgrade to Pro to create more notes.
                  </p>
                </div>
              )}

              {showCreateForm && (
                <form onSubmit={createNote} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Note</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter note title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        required
                        rows={4}
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter note content"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={creating}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {creating ? 'Creating...' : 'Create Note'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {showEditForm && editingNote && (
                <form onSubmit={updateNote} className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Edit Note</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        value={editNote.title}
                        onChange={(e) => setEditNote({ ...editNote, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter note title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Content</label>
                      <textarea
                        required
                        rows={4}
                        value={editNote.content}
                        onChange={(e) => setEditNote({ ...editNote, content: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter note content"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={creating}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {creating ? 'Updating...' : 'Update Note'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {notes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No notes yet. Create your first note!
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{note.title}</h4>
                          <p className="text-gray-600 mt-2">{note.content}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Created by {note.user.email} on {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4 flex space-x-2">
                          <button
                            onClick={() => startEditNote(note)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 