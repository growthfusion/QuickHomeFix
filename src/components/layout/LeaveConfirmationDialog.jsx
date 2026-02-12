import React from 'react';
import { useFormStore } from '@/lib/store';

const LeaveConfirmationDialog = ({ onConfirm }) => {
  const { showLeaveDialog, cancelLeave, confirmLeave, saveAndLeave } = useFormStore();

  if (!showLeaveDialog) return null;

  const handleSaveAndLeave = () => {
    saveAndLeave(onConfirm);
  };

  const handleLeave = () => {
    confirmLeave(onConfirm);
  };

  const handleCancel = () => {
    cancelLeave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex justify-center items-start pt-24">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Leave site?
          </h3>
          <p className="text-sm text-gray-500">
            Changes you made may not be saved.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleSaveAndLeave}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm"
          >
            Save & Leave
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleLeave}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm"
            >
              Leave
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveConfirmationDialog;
