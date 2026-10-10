import { useState } from 'react';
import Modal from './Modal.jsx';

const DELETE_PHRASE = 'DELETE';

export default function DeleteAccountModal({ isCloudMode, userEmail, onConfirm, onCancel }) {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const canDelete = confirmText.trim().toUpperCase() === DELETE_PHRASE;

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || 'Could not delete account.');
      setDeleting(false);
    }
  }

  if (step === 1) {
    return (
      <Modal
        title="Delete your account?"
        body={
          <div className="delete-account-body">
            <p>This permanently removes your Acad account and all associated data. This cannot be undone.</p>
            <ul className="delete-account-list">
              <li>Your academic profile and semester history</li>
              <li>Courses, flashcards, and study progress</li>
              <li>Portfolio projects and forge workspaces</li>
              <li>Habit tracking and wellness records</li>
              {isCloudMode && <li>All cloud-synced data tied to {userEmail || 'your email'}</li>}
            </ul>
            <p className="ob-hint">
              {isCloudMode
                ? 'If you only want to sign out, use Sign out instead — your data stays in your cloud account.'
                : 'Your data is stored locally on this device. Deleting clears everything on this browser.'}
            </p>
          </div>
        }
        confirmLabel="Continue"
        confirmClass="btn-danger"
        onConfirm={() => setStep(2)}
        onCancel={onCancel}
      />
    );
  }

  return (
    <Modal
      title="Confirm permanent deletion"
      body={
        <div className="delete-account-body">
          <p>
            Type <strong>{DELETE_PHRASE}</strong> below to confirm you want to permanently delete
            {isCloudMode ? ' your account and all cloud data' : ' all local data on this device'}.
          </p>
          <input
            className="form-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type ${DELETE_PHRASE} to confirm`}
            aria-label="Type DELETE to confirm account deletion"
            autoFocus
          />
          {error && <p className="form-error" role="alert">{error}</p>}
        </div>
      }
      confirmLabel={deleting ? 'Deleting…' : 'Delete permanently'}
      confirmClass="btn-danger"
      confirmDisabled={!canDelete || deleting}
      onConfirm={handleDelete}
      onCancel={onCancel}
    />
  );
}
