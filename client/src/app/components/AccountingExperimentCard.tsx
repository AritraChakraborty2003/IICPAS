"use client";
import React, { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  Play,
} from "lucide-react";

const formatDateForInput = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return dateStr;
};

const formatDateForStorage = (dateStr: string) => {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
};

interface JournalEntry {
  id: string;
  date: string;
  type: string;
  particulars: string;
  debit: string;
  credit: string;
}

interface AccountingExperimentCardProps {
  experimentNumber: number;
  statement: string;
  correctEntries: JournalEntry[];
  onComplete?: (isCorrect: boolean) => void;
}

export default function AccountingExperimentCard({
  experimentNumber,
  statement,
  correctEntries,
  onComplete,
}: AccountingExperimentCardProps) {
  const [isStarted, setIsStarted] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "1",
      date: "",
      type: "",
      particulars: "",
      debit: "",
      credit: "",
    },
  ]);
  const [narration, setNarration] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const accountTypes = ["Debit", "Credit"];
  const accountOptions = [
    "Cash A/c",
    "Bank A/c",
    "Furniture A/c",
    "Capital A/c",
    "Purchase A/c",
    "Sales A/c",
    "Creditors A/c",
    "Debtors A/c",
  ];

  const startExperiment = () => {
    setIsStarted(true);
  };

  const addRow = () => {
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: "",
      type: "",
      particulars: "",
      debit: "",
      credit: "",
    };
    setEntries([...entries, newEntry]);
  };

  const removeRow = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  const updateEntry = (
    id: string,
    field: keyof JournalEntry,
    value: string
  ) => {
    setEntries(
      entries.map((entry) => {
        if (entry.id === id) {
          const updatedEntry = { ...entry, [field]: value };

          // Clear the opposite field when type changes
          if (field === "type") {
            if (value === "Debit") {
              updatedEntry.credit = "";
            } else if (value === "Credit") {
              updatedEntry.debit = "";
            }
          }

          return updatedEntry;
        }
        return entry;
      })
    );
  };

  const validateEntries = () => {
    // Extract date from problem statement
    const extractDateFromStatement = (statement: string) => {
      // First try DD/MM/YYYY format
      const ddMMyyyyMatch = statement.match(/(?:Date:\s*)?(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
      if (ddMMyyyyMatch) {
        const day = ddMMyyyyMatch[1].padStart(2, "0");
        const month = ddMMyyyyMatch[2].padStart(2, "0");
        const year = ddMMyyyyMatch[3];
        return `${day}/${month}/${year}`;
      }

      const dateMatch = statement.match(
        /(\d+)(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i
      );
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, "0");
        const month = dateMatch[2];
        const monthMap: { [key: string]: string } = {
          january: "01",
          february: "02",
          march: "03",
          april: "04",
          may: "05",
          june: "06",
          july: "07",
          august: "08",
          september: "09",
          october: "10",
          november: "11",
          december: "12",
        };
        const monthNum = monthMap[month.toLowerCase()];
        return `${day}/${monthNum}/2025`;
      }
      return null;
    };

    const expectedDate = extractDateFromStatement(statement);

    // Validate date
    if (expectedDate && entries[0].date !== expectedDate) {
      alert(
        `Please enter the correct date: ${expectedDate} (as mentioned in the problem statement)`
      );
      return;
    }

    // Validate each row has either debit OR credit (not both)
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry.type) {
        alert(`Row ${i + 1}: Please select a Type (Debit or Credit)`);
        return;
      }
      if (!entry.particulars) {
        alert(`Row ${i + 1}: Please select an Account`);
        return;
      }

      if (entry.type === "Debit" && !entry.debit) {
        alert(`Row ${i + 1}: Please enter a Debit amount`);
        return;
      }
      if (entry.type === "Credit" && !entry.credit) {
        alert(`Row ${i + 1}: Please enter a Credit amount`);
        return;
      }

      // Check that opposite field is empty
      if (entry.type === "Debit" && entry.credit) {
        alert(`Row ${i + 1}: Credit field should be empty for Debit entries`);
        return;
      }
      if (entry.type === "Credit" && entry.debit) {
        alert(`Row ${i + 1}: Debit field should be empty for Credit entries`);
        return;
      }
    }

    // Validate total debits = total credits
    const totalDebits = entries.reduce(
      (sum, entry) => sum + (parseFloat(entry.debit) || 0),
      0
    );
    const totalCredits = entries.reduce(
      (sum, entry) => sum + (parseFloat(entry.credit) || 0),
      0
    );

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      // Using small tolerance for floating point
      alert(
        `Total Debits (${totalDebits}) must equal Total Credits (${totalCredits}). Please balance your entries.`
      );
      return;
    }

    // Original validation logic
    const isCorrectEntries = entries.every((entry, index) => {
      const correctEntry = correctEntries[index];
      if (!correctEntry) return false;

      return (
        entry.type === correctEntry.type &&
        entry.particulars === correctEntry.particulars &&
        entry.debit === correctEntry.debit &&
        entry.credit === correctEntry.credit
      );
    });

    setIsCorrect(isCorrectEntries);
    setShowValidation(true);
    setIsSubmitted(true);
    onComplete?.(isCorrectEntries);
  };

  const retry = () => {
    setEntries([
      {
        id: "1",
        date: "",
        type: "",
        particulars: "",
        debit: "",
        credit: "",
      },
    ]);
    setNarration("");
    setIsSubmitted(false);
    setShowValidation(false);
    setIsStarted(false); // Reset to Start Experiment state
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      {/* Experiment Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Experiment {experimentNumber}:
        </h3>
        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
          {statement}
        </p>
      </div>

      {/* Initial State - Start Experiment */}
      {!isStarted && (
        <div className="relative">
          {/* Hazy overlay that makes background content visible but blurred */}
          <div className="absolute inset-0 bg-white bg-opacity-70 backdrop-blur-sm rounded-lg"></div>

          {/* Background content - visible but blurred */}
          <div className="relative z-0 opacity-30">
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-green-50">
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                      Date
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                      Type
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                      Particulars
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                      Debit
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                      Credit
                    </th>
                    <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                      Add Row
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="dd/mm/yyyy"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                        <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <select
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      >
                        <option value="">Select Type</option>
                      </select>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="space-y-2">
                        <input
                          type="text"
                          disabled
                          placeholder="Select or enter Account"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                        <input
                          type="text"
                          placeholder="Type narration here"
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                        />
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <input
                        type="number"
                        placeholder="0"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <input
                        type="number"
                        placeholder="0"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <button
                        disabled
                        className="bg-gray-400 text-white px-3 py-2 rounded-md cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Start Experiment overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="text-center">
              <Play className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <button
                onClick={startExperiment}
                className="bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition-colors font-semibold text-lg shadow-lg"
              >
                Start Experiment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Experiment State */}
      {isStarted && (
        <div className="relative">
          {/* Hazy overlay for validation feedback - very transparent */}
          {showValidation && (
            <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg z-20"></div>
          )}

          {/* Unified Journal Entry Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-green-50">
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                    Date
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                    Type
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                    Particulars
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                    Debit
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                    Credit
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-green-800">
                    Add Row
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-3">
                      {index === 0 ? (
                        // First row - editable date input
                        <div className="relative">
                          <input
                            type="date"
                            value={formatDateForInput(entry.date)}
                            onChange={(e) =>
                              updateEntry(entry.id, "date", formatDateForStorage(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      ) : (
                        // Subsequent rows - no date field
                        <div className="text-gray-400 text-sm italic">
                          Same date
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <select
                        value={entry.type}
                        onChange={(e) =>
                          updateEntry(entry.id, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Select Type</option>
                        {accountTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="space-y-2">
                        <input
                          type="text"
                          list={`account-options-${entry.id}`}
                          placeholder="Select or enter Account"
                          value={entry.particulars}
                          onChange={(e) =>
                            updateEntry(entry.id, "particulars", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <datalist id={`account-options-${entry.id}`}>
                          {accountOptions.map((account) => (
                            <option key={account} value={account} />
                          ))}
                        </datalist>
                        <input
                          type="text"
                          placeholder="Type narration here"
                          value={narration}
                          onChange={(e) => setNarration(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <input
                        type="number"
                        placeholder="0"
                        value={entry.debit}
                        onChange={(e) =>
                          updateEntry(entry.id, "debit", e.target.value)
                        }
                        disabled={entry.type === "Credit"}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          entry.type === "Credit"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <input
                        type="number"
                        placeholder="0"
                        value={entry.credit}
                        onChange={(e) =>
                          updateEntry(entry.id, "credit", e.target.value)
                        }
                        disabled={entry.type === "Debit"}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          entry.type === "Debit"
                            ? "bg-gray-100 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-3">
                      <div className="flex space-x-2">
                        {entries.length > 1 && (
                          <button
                            onClick={() => removeRow(entry.id)}
                            className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition-colors"
                            title="Remove Row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {index === entries.length - 1 && (
                          <button
                            onClick={addRow}
                            className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition-colors"
                            title="Add Row"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validation Feedback Overlay */}
          {showValidation && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
              <div className="text-center bg-white bg-opacity-80 rounded-lg p-6 shadow-lg">
                {isCorrect ? (
                  <div className="flex flex-col items-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                    <h4 className="text-xl font-semibold text-green-600">
                      Correct! Well done!
                    </h4>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <XCircle className="w-16 h-16 text-red-500" />
                    <h4 className="text-xl font-semibold text-red-600">
                      Incorrect. Please try again.
                    </h4>
                  </div>
                )}
                <button
                  onClick={retry}
                  className="mt-4 bg-red-500 text-white px-6 py-3 rounded-md hover:bg-red-600 transition-colors font-semibold flex items-center space-x-2 mx-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isSubmitted && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={validateEntries}
                className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition-colors font-semibold"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
