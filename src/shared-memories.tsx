import { useAccountSettings } from './account-settings-context';
import { randomUUID } from 'expo-crypto';
import { type ReactNode, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import type { Point } from './geo';
import { GoogleMapsLink } from './google-maps-link';
import { MemoryHeading, RatingChoices } from './memory-ui';
import type { Member } from './services/shared-meetups';
import { rateMeetup, readMemories, writeRecap, type Recap } from './services/shared-memories';
import { colors, spacing } from './theme';
import { Button, Chip, EmptyState, Feedback, Field, Icon, Label, Panel, layout, StatusLine } from './ui';
import { WorkspaceColumns } from './workspace-layout';

function RecapEditor({ group, post, close, saved }: {
  group: string; post?: Recap; close: () => void; saved: (audience: Recap['visibility']) => void;
}) {
  const [title, setTitle] = useState(post?.title ?? '');
  const [caption, setCaption] = useState(post?.caption ?? '');
  const preferences = useAccountSettings().data;
  const [audience, setAudience] = useState<Recap['visibility']>(post?.visibility ?? preferences?.recap_audience ?? 'private');
  const [busy, setBusy] = useState(false);
  const [validation, setValidation] = useState(false);
  const [error, setError] = useState('');
  const key = useRef(post?.id);
  const pending = useRef(false);
  async function save() {
    setValidation(true);
    if (!caption.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      key.current ??= randomUUID();
      await writeRecap(group, key.current, post?.revision ?? 0, title, caption, audience);
      saved(audience);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t save this recap. Try again.'); }
    finally { pending.current = false; setBusy(false); }
  }
  const shared = audience === 'group';
  return <EditorDialog title={post ? 'Edit recap' : 'Write a recap'} close={close} busy={busy}
    actions={<Button busy={busy} busyLabel="Saving…" onPress={save}>
      {shared ? post?.visibility === 'group' ? 'Update group recap' : 'Publish to group' : 'Save privately'}
    </Button>}>
    <Field label="Title (optional)" maxLength={160} value={title} onChange={setTitle} disabled={busy} />
    <Field label="Recap caption" placeholder="Anong kuwento ng lakad?" maxLength={2000} multiline value={caption}
      onChange={setCaption} required disabled={busy} error={validation && !caption.trim() ? 'Add a caption before saving.' : undefined} />
    <View style={{ gap: spacing.sm }}>
      <Label kind="value">Who can read this?</Label>
      <View style={layout.wrap}>
        <Chip selected={!shared} icon="lock" disabled={busy} onPress={() => setAudience('private')}>Only me</Chip>
        <Chip selected={shared} icon="users" disabled={busy} onPress={() => setAudience('group')}>Meetup members</Chip>
      </View>
      <View accessibilityLiveRegion="polite" aria-live="polite">
        <Label kind="detail">{shared ? 'Everyone in this meetup can read it. Leave out personal addresses.' :
          post?.visibility === 'group' ? 'Saving privately will remove this recap from the group view.' : 'Only you can read this recap when signed in.'}</Label>
      </View>
    </View>
    {!!error && <Feedback tone="error">{error}</Feedback>}
  </EditorDialog>;
}

export function SharedMemories({ id, userId, venue, point, schedule, activity, description, archived, celebrate, members, data, refresh, busy, run, archiveAction }: {
  id: string; userId: string; venue?: string; point?: Point; schedule?: string; activity?: string | null; description?: string | null;
  archived: boolean; celebrate: boolean; members: Member[];
  data: Awaited<ReturnType<typeof readMemories>>; refresh: () => void; busy: boolean;
  run: (action: () => Promise<void>) => Promise<boolean>; archiveAction?: ReactNode;
}) {
  const [editor, setEditor] = useState<Recap | 'new'>();
  const [removing, setRemoving] = useState('');
  const [notice, setNotice] = useState('');
  const visible = data.recaps.filter(post => post.visibility === 'group' || post.author_id === userId);
  const mine = data.ratings.find(row => row.user_id === userId)?.stars;
  const count = data.ratings.length;
  const average = count ? (data.ratings.reduce((sum, row) => sum + row.stars, 0) / count).toFixed(1) : null;

  return <View style={layout.stack}>
    <MemoryHeading title="Meetup memories" venue={venue} schedule={schedule} celebrate={celebrate} />
    <WorkspaceColumns main={<>
      <View style={[layout.wrap, { justifyContent: 'space-between' }]}>
        <Label kind="item" heading>Recaps</Label>
        {!archived && <Button disabled={busy} onPress={() => { setNotice(''); setEditor('new'); }} icon="edit-3">Write a recap</Button>}
      </View>
      {!!notice && <StatusLine tone="success">{notice}</StatusLine>}
      {archived && <Label kind="detail">Published recaps stay visible to meetup members. Authors can still make them private or remove them.</Label>}
      {!visible.length && <EmptyState title="No recaps yet">
        {archived ? 'There are no recaps available to read in this archive.' : 'Save a detail you want to remember, or share it with the barkada.'}
      </EmptyState>}
      {visible.map(post => {
        const own = post.author_id === userId;
        const privatePost = post.visibility === 'private';
        return <View key={post.id} style={styles.post}>
          <View style={layout.wrap}>
            <Icon name={privatePost ? 'lock' : 'users'} size={16} color={colors.info} />
            <Label kind="label">{privatePost ? 'Only you' : 'Meetup members'}</Label>
            <Label kind="caption">{own ? 'You' : members.find(member => member.id === post.author_id)?.name ?? 'Group member'}</Label>
          </View>
          {!!post.title && <Label kind="item" heading>{post.title}</Label>}
          <Label>{post.caption}</Label>
          {own && removing !== post.id && <View style={layout.wrap}>
            {!archived && <Button quiet disabled={busy} onPress={() => { setNotice(''); setEditor(post); }}>Edit recap</Button>}
            {!privatePost && <Button quiet disabled={busy} onPress={async () => {
              setNotice('');
              if (await run(() => writeRecap(id, post.id, post.revision, post.title ?? '', post.caption, 'private'))) {
                setNotice('Recap is now private.');
              }
            }}>Make private</Button>}
            <Button quiet disabled={busy} onPress={() => { setNotice(''); setRemoving(post.id); }}>Remove recap</Button>
          </View>}
          {own && removing === post.id && <View style={layout.stack}>
            <Label kind="detail">Delete this recap permanently?</Label>
            <View style={layout.wrap}>
              <Button variant="danger" disabled={busy} onPress={async () => {
                if (await run(() => writeRecap(id, post.id, post.revision, '', '', 'delete'))) {
                  setRemoving('');
                  setNotice('Recap removed.');
                }
              }}>Delete recap</Button>
              <Button quiet disabled={busy} onPress={() => setRemoving('')}>Cancel</Button>
            </View>
          </View>}
        </View>;
      })}
    </>} side={<>
      <Panel>
        <Label kind="item" heading>Group rating</Label>
        {average ? <Label kind="value">{average} / 5 · {count} {count === 1 ? 'rating' : 'ratings'}</Label> :
          <Label kind="detail">No ratings yet.</Label>}
        {!archived && <>
          <Label kind="label">Your rating (optional)</Label>
          <RatingChoices value={mine} disabled={busy} change={stars => { void run(() => rateMeetup(id, stars)); }} />
        </>}
        {mine !== undefined && <Button quiet disabled={busy} onPress={() => run(() => rateMeetup(id, null))}>Remove my rating</Button>}
      </Panel>
      {archiveAction}
      {(activity || description || point) && <Panel>
        <Label kind="item" heading>Meetup details</Label>
        {!!activity && <Label weight="bold">{activity}</Label>}
        {!!description && <Label>{description}</Label>}
        {point && <GoogleMapsLink point={point} />}
      </Panel>}
    </>} />
    {!archived && editor && <RecapEditor group={id} post={editor === 'new' ? undefined : editor} close={() => setEditor(undefined)}
      saved={audience => {
        setNotice(audience === 'private' ? 'Recap saved privately.' : 'Recap shared with meetup members.');
        refresh();
        setEditor(undefined);
      }} />}
  </View>;
}

const styles = StyleSheet.create({
  post: { borderTopWidth: 1, borderColor: colors.divider, paddingVertical: spacing.md, gap: spacing.sm },
});
