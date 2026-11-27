import { useLocalSearchParams } from 'expo-router';
import { Workspace } from '../../src/workspace';

export default function MeetupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Workspace key={id} meetupId={id} />;
}
