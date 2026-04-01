'use client'

import { useState } from 'react'
import MaterialsPanel from './MaterialsPanel'
import ObjectivesPanel from './ObjectivesPanel'
import TopicCourseBuilder from './TopicCourseBuilder'
import SubtopicsList from './SubtopicsList'

interface Objective {
  exam:      string
  objective: string
}

interface Subtopic {
  id:             string
  name:           string
  subtopic_order: number
}

interface Submission {
  id:          string
  subtopic_id: string
  status:      string
  feedback:    string | null
}

interface Props {
  assignmentId:     string
  topicId:          string
  topicName:        string
  topicOverview:    string
  materials:        any
  objectives:       Objective[]
  assignmentStatus: string
  subtopics:        Subtopic[]
  submissions:      Submission[]
}

export default function BuilderStudio({
  assignmentId,
  topicId,
  topicName,
  topicOverview,
  materials,
  objectives,
  assignmentStatus,
  subtopics,
  submissions,
}: Props) {
  const [activeSection, setActiveSection] = useState<'topic' | 'subtopics'>('topic')
  const topicApproved = assignmentStatus === 'approved'

  return (
    <div className="flex flex-col gap-6">

      {/* Materials */}
      <MaterialsPanel materials={materials} />

      {/* Objectives */}
      {objectives.length > 0 && (
        <ObjectivesPanel objectives={objectives} />
      )}

      {/* Section tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('topic')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
            activeSection === 'topic'
              ? 'text-gray-900 border-gray-900'
              : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          Topic Course
        </button>
        <button
          onClick={() => setActiveSection('subtopics')}
          disabled={!topicApproved}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
            activeSection === 'subtopics' && topicApproved
              ? 'text-gray-900 border-gray-900'
              : topicApproved
              ? 'text-gray-400 border-transparent hover:text-gray-600'
              : 'text-gray-300 border-transparent cursor-not-allowed'
          }`}
        >
          Subtopics
          {!topicApproved && (
            <span className="ml-1.5 text-gray-300">— locked</span>
          )}
        </button>
      </div>

      {/* Topic course builder */}
      {activeSection === 'topic' && (
        <TopicCourseBuilder
          assignmentId={assignmentId}
          topicId={topicId}
          assignmentStatus={assignmentStatus}
        />
      )}

      {/* Subtopics */}
      {activeSection === 'subtopics' && topicApproved && (
        <SubtopicsList
          assignmentId={assignmentId}
          topicId={topicId}
          subtopics={subtopics}
          submissions={submissions}
        />
      )}

    </div>
  )
}
