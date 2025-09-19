'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Note } from '@/types'

export default function DashboardPage() {
  const { user, logout, token } = useAuth()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '' })
  const [creating, setCreating] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [error, setError] = useState('')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editNote, setEditNote] = useState({ title: '', content: '' })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchNotes()
  }, [user, router]) // eslint-disable-line react-hooks/exhaustive-deps

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
          {user.tenant.subscription === 'free' && user.role === 'admin' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Free Plan Active</h3>
                  <p className="text-sm text-yellow-700">
                    You&apos;re on the free plan (limited to 3 notes). Upgrade to Pro for unlimited notes.
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

          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Your Notes ({notes.length}{user.tenant.subscription === 'free' ? '/3' : ''})
                </h3>
                {canCreateNote && (
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
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