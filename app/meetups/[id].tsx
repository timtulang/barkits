import { useLocalSearchParams } from 'expo-router';
import { PlannerScreen } from '../../src/planner-screen';

export default function MeetupRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PlannerScreen key={id} meetupId={id} />;
}
