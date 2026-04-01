'use client'

interface Props {
  assignmentId:  string
  subtopicId:    string | null
  isTopicLevel:  boolean
  currentStatus: string
}

export default function ReviewSubtopicButton({
  assignmentId, subtopicId, isTopicLevel, currentStatus,
}: Props) {
  // This is just a link — ReviewActions handles the actual logic
  return null
}