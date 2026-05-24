import React, { useState } from "react";
import { Button } from "./button";

interface ConfirmDialogInputProps {
  isOpen: boolean;
  title: string;
  description: string;
  expectedInput: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmDialogInput({
  isOpen,
  title,
  description,
  expectedInput,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel"
}: ConfirmDialogInputProps) {
  const [input, setInput] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (input === expectedInput) {
      onConfirm();
      setInput("");
    }
  };

  const handleCancel = () => {
    setInput("");
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200 dark:bg-slate-900 dark:border dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Type <strong>{expectedInput}</strong> to confirm:
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-red-500"
            placeholder={expectedInput}
            autoFocus
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={input !== expectedInput}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
