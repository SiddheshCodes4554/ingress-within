import { ExerciseAnalysisWorker } from '../../exercises/exerciseAnalysisWorker';

export async function processExercise(jobData: {
  instance_id: string;
  exercise_id: string;
  user_id: string;
  cycle_id: string | null;
  orchestrator_job_id?: string;
}) {
  console.log(`[Exercise Worker Wrapper] Delegating processing for instance ${jobData.instance_id} to ExerciseAnalysisWorker...`);
  await ExerciseAnalysisWorker.execute({
    instance_id: jobData.instance_id,
    exercise_id: jobData.exercise_id,
    user_id: jobData.user_id,
    cycle_id: jobData.cycle_id,
    orchestrator_job_id: jobData.orchestrator_job_id
  });
}
