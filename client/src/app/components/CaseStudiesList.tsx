"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Trash2, Plus } from "lucide-react";
import { getApiBase } from "@/lib/apiBase";

interface CaseStudiesListProps {
  chapterId: string;
  onEdit?: (caseStudy: CaseStudy) => void;
  onAdd?: () => void;
}

interface CaseStudy {
  _id: string;
  title: string;
  description: string;
  tasks: Task[];
  content: Content[];
  simulations: Simulation[];
  questionSets: QuestionSet[];
  createdAt: string;
  updatedAt: string;
}

interface Task {
  _id: string;
  taskName: string;
  instructions: string;
  order: number;
}

interface Content {
  _id: string;
  type: "video" | "text" | "rich";
  videoBase64?: string;
  textContent?: string;
  richTextContent?: string;
  order: number;
}

interface Simulation {
  _id: string;
  type: string;
  title: string;
  description: string;
  config: Record<string, unknown>;
  isOptional: boolean;
  order: number;
}

interface QuestionSet {
  _id: string;
  name: string;
  description: string;
  excelBase64?: string;
  questions: Question[];
  order: number;
}

interface Question {
  _id: string;
  question: string;
  context: string;
  type: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function CaseStudiesList({
  chapterId,
  onEdit,
  onAdd,
}: CaseStudiesListProps) {
  const API_BASE = getApiBase();
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCaseStudies();
  }, [chapterId]);

  const fetchCaseStudies = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API_BASE}/case-studies/chapter/${chapterId}`);
      if (response.data.success) {
        setCaseStudies(response.data.data || []);
      } else {
        setError("Failed to fetch case studies");
      }
    } catch (error: unknown) {
      console.error("Error fetching case studies:", error);
      setError("Error fetching case studies");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (caseStudyId: string, caseStudyTitle: string) => {
    // Sweet Alert confirmation
    if (
      confirm(
        `Are you sure you want to delete "${caseStudyTitle}"? This action cannot be undone.`
      )
    ) {
      try {
        const response = await axios.delete(
          `${API_BASE}/case-studies/${caseStudyId}`
        );
        if (response.data.success) {
          alert("Case Study deleted successfully!");
          fetchCaseStudies(); // Refresh the list
        } else {
          alert("Failed to delete case study");
        }
      } catch (error: unknown) {
        console.error("Error deleting case study:", error);
        alert("Error deleting case study");
      }
    }
  };

  const handleEdit = (caseStudy: CaseStudy) => {
    if (onEdit) {
      onEdit(caseStudy);
    }
  };

  const getTotalComponents = (caseStudy: CaseStudy) => {
    return (
      caseStudy.tasks.length +
      caseStudy.content.length +
      caseStudy.simulations.length +
      caseStudy.questionSets.length
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading case studies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-red-600 mb-2">{error}</p>
        <button
          onClick={fetchCaseStudies}
          className="text-green-600 hover:text-green-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header with Add Button */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Case Studies</h3>
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Case Study
            </button>
          )}
        </div>
      </div>

      {caseStudies.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">
            No case studies created yet
          </p>
          <p className="text-gray-400 text-sm">
            Get started by creating your first case study
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Case Study Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Components
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {caseStudies.map((caseStudy, index) => (
                <tr
                  key={caseStudy._id}
                  className={`hover:bg-gray-50 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200">
                    {caseStudy.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-200 max-w-xs truncate">
                    {caseStudy.description || "No description"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTotalComponents(caseStudy)} total
                      </span>
                      <div className="flex space-x-1">
                        {caseStudy.tasks.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-800">
                            {caseStudy.tasks.length} tasks
                          </span>
                        )}
                        {caseStudy.content.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                            {caseStudy.content.length} content
                          </span>
                        )}
                        {caseStudy.simulations.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">
                            {caseStudy.simulations.length} sims
                          </span>
                        )}
                        {caseStudy.questionSets.length > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                            {caseStudy.questionSets.length} Q&A
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-200">
                    {formatDate(caseStudy.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEdit(caseStudy)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                        title="Edit Case Study"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(caseStudy._id, caseStudy.title)
                        }
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete Case Study"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
