import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GoLiveModal from '../components/GoLiveModal'

// /live/start — directly opens the Go Live modal on top of the feed.
// If the user cancels, navigate back.
export default function LiveStart() {
  const navigate = useNavigate()
  const [open] = useState(true)

  if (!open) return null

  return (
    <GoLiveModal onClose={() => navigate(-1)} />
  )
}
