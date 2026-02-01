import React, { useState, useEffect } from 'react';

interface SectionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  allSections: string[];
  selectedSections: string[];
  onSave: (newSelectedSections: string[]) => void;
}

const SectionSelectorModal: React.FC<SectionSelectorModalProps> = ({ isOpen, onClose, allSections, selectedSections, onSave }) => {
  const [currentSelection, setCurrentSelection] = useState<Set<string>>(new Set(selectedSections));

  useEffect(() => {
    setCurrentSelection(new Set(selectedSections));
  }, [selectedSections, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleToggleSection = (section: string) => {
    const newSelection = new Set(currentSelection);
    if (newSelection.has(section)) {
      newSelection.delete(section);
    } else {
      newSelection.add(section);
    }
    setCurrentSelection(newSelection);
  };

  const handleSelectAll = () => {
    setCurrentSelection(new Set(allSections));
  };

  const handleDeselectAll = () => {
    setCurrentSelection(new Set());
  };

  const handleSave = () => {
    onSave(Array.from(currentSelection));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Customize Report Sections</h2>
        <p className="text-sm text-gray-500 mb-4">Select the sections you want to include in the generated report(s).</p>
        
        <div className="flex justify-between items-center mb-3">
            <button onClick={handleSelectAll} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Select All</button>
            <button onClick={handleDeselectAll} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Deselect All</button>
        </div>
        
        <div className="overflow-y-auto space-y-2 border border-gray-200 rounded-md p-3">
          {allSections.map((section) => (
            <label key={section} className="flex items-center p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={currentSelection.has(section)}
                onChange={() => handleToggleSection(section)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-3 text-gray-700">{section}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-4">
          <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            Save ({currentSelection.size} Sections)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SectionSelectorModal;
