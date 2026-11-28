import { useState } from 'react';
import { AccountSettingsFields } from './account-settings-fields';
import { useAccountSettings } from './account-settings-context';
import { settingsProblem, type AccountSettings } from './account-settings';
import { EditorDialog } from './editor-dialog';
import { readSettings, saveSettings } from './services/account';
import { Button, Feedback, LoadingState } from './ui';

export function AccountSettingsDialog({ close }: { close: () => void }) {
  const state = useAccountSettings();
  if (!state.data) return <EditorDialog title="Profile and preferences" close={close}>
    {state.loading ? <LoadingState label="Loading your settings…" /> : <Feedback tone="error"
      action={<Button secondary onPress={state.refresh}>Try again</Button>}>{state.error || 'Couldn’t load your settings.'}</Feedback>}
  </EditorDialog>;
  return <SettingsEditor initial={state.data} close={close} refresh={state.refresh} />;
}
function SettingsEditor({ initial, close, refresh }: { initial: AccountSettings; close: () => void; refresh: () => void }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [budget, setBudget] = useState(initial.budget?.toString() ?? '');
  const [duration, setDuration] = useState(initial.max_minutes?.toString() ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [discard, setDiscard] = useState<'close' | 'reload' | null>(null);
  const changed = JSON.stringify(draft) !== JSON.stringify(saved) || budget !== (saved.budget?.toString() ?? '') || duration !== (saved.max_minutes?.toString() ?? '');
  function install(next: AccountSettings) {
    setSaved(next); setDraft(next); setBudget(next.budget?.toString() ?? ''); setDuration(next.max_minutes?.toString() ?? '');
  }
  async function save() {
    if (busy) return;
    const next = { ...draft, budget: budget.trim() ? Number(budget) : null, max_minutes: duration.trim() ? Number(duration) : null };
    const issue = budget.trim() && !/^\d+(\.\d{1,2})?$/.test(budget.trim()) ? 'Enter a fare with up to two decimal places.' :
      duration.trim() && !/^\d+$/.test(duration.trim()) ? 'Enter a whole number of minutes.' : settingsProblem(next);
    setError(issue || ''); setNotice('');
    if (issue) return;
    setBusy(true);
    try { install(await saveSettings(next)); setNotice('Profile and preferences saved.'); refresh(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t save your settings.'); }
    finally { setBusy(false); }
  }
  async function reload() {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try { install(await readSettings()); refresh(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t reload your settings.'); }
    finally { setBusy(false); }
  }
  if (discard) return <EditorDialog title="Unsaved account changes" close={() => setDiscard(null)} actions={<>
    <Button onPress={() => setDiscard(null)}>Keep editing</Button><Button secondary onPress={() => { setDiscard(null); if (discard === 'reload') void reload(); else close(); }}>Discard changes</Button>
  </>}><Feedback>Save your profile and preferences before leaving.</Feedback></EditorDialog>;
  return <EditorDialog title="Profile and preferences" busy={busy} close={() => changed ? setDiscard('close') : close()} actions={<>
    <Button busy={busy} busyLabel="Saving settings…" disabled={!changed} onPress={save}>Save preferences</Button>
    <Button secondary disabled={busy} onPress={() => changed ? setDiscard('close') : close()}>Back to account</Button>
  </>}>
    <AccountSettingsFields value={draft} change={next => { setDraft(next); setNotice(''); }} disabled={busy}
      budget={budget} setBudget={value => { setBudget(value); setNotice(''); }} duration={duration} setDuration={value => { setDuration(value); setNotice(''); }} />
    {!!notice && <Feedback tone="success">{notice}</Feedback>}
    {!!error && <Feedback tone="error">{error}</Feedback>}
    {!!error && <Button secondary disabled={busy} onPress={() => changed ? setDiscard('reload') : reload()}>Reload saved settings</Button>}
  </EditorDialog>;
}
