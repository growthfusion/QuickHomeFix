// components/LeaveConfirmationDialog.jsx
import React from 'react';
import { useFormStore } from '@/lib/store';

const LeaveConfirmationDialog = ({ onConfirm }) => {
  const { showLeaveDialog, cancelLeave, confirmLeave, saveAndLeave } = useFormStore();

  if (!showLeaveDialog) return null;

  const handleSaveAndLeave = () => {
    // This will save progress and navigate
    saveAndLeave(onConfirm);
  };

  const handleLeave = () => {
    // This will discard changes and navigate
    confirmLeave(onConfirm);
  };

  const handleCancel = () => {
    // Stay on current page
    cancelLeave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-start pt-20">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Leave site?
            </h3>
            <p className="text-sm text-gray-600">
              Changes you made may not be saved.
            </p>
          </div>
          
          {/* Buttons */}
          <div className="space-y-3">
            {/* Save & Leave - Primary Action */}
            <button
              onClick={handleSaveAndLeave}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Save & Leave
            </button>
            
            {/* Bottom row - Leave and Cancel */}
            <div className="flex space-x-3">
              <button
                onClick={handleLeave}
                className="flex-1 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Leave
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveConfirmationDialog;
