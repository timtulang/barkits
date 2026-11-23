import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { EditorDialog } from './editor-dialog';
import type { Point } from './geo';
import { GoogleMapsLink } from './google-maps-link';
import { Kits } from './kits';
import type { Member } from './services/shared-meetups';
import { rateMeetup, readMemories, writeRecap, type Recap } from './services/shared-memories';
import { Button, Chip, Field, Label, Panel, layout } from './ui';
import { palette } from './theme';
import { WorkspaceColumns } from './workspace-layout';

function RecapEditor({ group, post, close, refresh }: { group: string; post?: Recap; close: () => void; refresh: () => void }) {
  const [title,setTitle] = useState(post?.title ?? '');
  const [caption,setCaption] = useState(post?.caption ?? '');
  const [busy,setBusy] = useState(false);
  const [validation,setValidation] = useState(false);
  const [error,setError] = useState('');
  const key = useRef(post?.id);
  const pending = useRef(false);
  async function save(audience: 'private' | 'group') {
    setValidation(true);
    if (!caption.trim() || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try {
      key.current ??= randomUUID();
      await writeRecap(group,key.current,post?.revision ?? 0,title,caption,audience);
      refresh(); close();
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Couldn’t save this recap.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return <EditorDialog title={post ? 'Edit recap' : 'Write a recap'} close={() => { if (!busy) close(); }}>
    <Field label="Title (optional)" maxLength={160} value={title} onChange={setTitle} />
    <Field label="Recap caption" placeholder="Anong kuwento ng lakad?" maxLength={2000} multiline value={caption} onChange={setCaption}
      error={validation && !caption.trim() ? 'Add a caption before saving.' : undefined} />
    <Label size={14}>Only meetup members can read a published recap. Keep personal addresses out of your caption.</Label>
    {!!error && <View accessibilityRole="alert"><Label>{error}</Label></View>}
    <View style={layout.wrap}><Button disabled={busy} onPress={() => save('private')}>Save privately</Button>
      <Button secondary disabled={busy} onPress={() => save('group')}>{post?.visibility === 'group' ? 'Update group recap' : 'Publish to group'}</Button>
      <Button secondary disabled={busy} onPress={close}>Cancel</Button></View>
  </EditorDialog>;
}

export function SharedMemories({ id, userId, venue, point, archived, members, data, refresh, busy, run, archiveAction }: {
  id: string; userId: string; venue: string; point?: Point; archived: boolean; members: Member[]; data: Awaited<ReturnType<typeof readMemories>>;
  refresh: () => void; busy: boolean; run: (action: () => Promise<void>) => Promise<boolean>; archiveAction?: React.ReactNode;
}) {
  const [editor,setEditor] = useState<Recap | 'new'>();
  const [removing,setRemoving] = useState('');
  const mine = data.ratings.find(r => r.user_id === userId)?.stars;
  const average = data.ratings.length ? (data.ratings.reduce((sum,r) => sum + r.stars,0) / data.ratings.length).toFixed(1) : null;
  return <WorkspaceColumns main={<>
    <View style={{ backgroundColor: palette.hero, borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}><Label kind="section" heading>Meetup memories</Label><Label>{venue}</Label></View>
      <Kits celebrate={!archived} style={{ width: 84, height: 72 }} />
    </View>
    {point && <GoogleMapsLink point={point} />}
    <View style={layout.between}><Label kind="item" heading>Recaps</Label>{!archived && <Button onPress={() => setEditor('new')} icon="edit-3">Write a recap</Button>}</View>
    {!data.recaps.length && <Label color={palette.muted}>No recaps yet.</Label>}
    {data.recaps.map(post => <Panel key={post.id}>
      <View style={layout.wrap}><Label weight="bold">{members.find(m => m.id === post.author_id)?.name ?? 'Group member'}</Label>
        <Label size={13} color={palette.muted}>{post.visibility === 'private' ? 'Only you' : 'Shared with group'}</Label></View>
      {!!post.title && <Label size={20} weight="title">{post.title}</Label>}<Label>{post.caption}</Label>
      {post.author_id === userId && <View style={layout.wrap}>
        {!archived && <Button secondary disabled={busy} onPress={() => setEditor(post)}>Edit recap</Button>}
        {post.visibility === 'group' && <Button secondary disabled={busy} onPress={() => run(() => writeRecap(id,post.id,post.revision,post.title ?? '',post.caption,'private'))}>Make private</Button>}
        <Button secondary disabled={busy} onPress={() => setRemoving(post.id)}>Remove recap</Button></View>}
      {removing === post.id && <><Label>Delete this recap permanently?</Label><View style={layout.wrap}>
        <Button disabled={busy} onPress={async () => { if (await run(() => writeRecap(id,post.id,post.revision,'','','delete'))) setRemoving(''); }}>Delete recap</Button>
        <Button secondary onPress={() => setRemoving('')}>Cancel</Button></View></>}
    </Panel>)}
    {editor && <RecapEditor group={id} post={editor === 'new' ? undefined : editor} close={() => setEditor(undefined)} refresh={refresh} />}
  </>} side={<><Panel>
    <Label size={21} weight="title">Group rating</Label>
    {average ? <Label weight="bold">{average} / 5 · {data.ratings.length} {data.ratings.length === 1 ? 'rating' : 'ratings'}</Label> : <Label color={palette.muted}>No ratings yet.</Label>}
    {!archived && <><Label>Your rating (optional)</Label><View style={layout.wrap}>{[1,2,3,4,5].map(stars =>
      <Chip key={stars} icon="star" selected={mine === stars} onPress={busy ? undefined : () => run(() => rateMeetup(id,stars))}>{stars}</Chip>)}</View></>}
    {mine !== undefined && <Button secondary disabled={busy} onPress={() => run(() => rateMeetup(id,null))}>Remove my rating</Button>}
  </Panel>{archiveAction}</>} />;
}
