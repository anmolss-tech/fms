package expo.modules.procrastinationtracker

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

class PandaMoodWorker(
  appContext: Context,
  workerParams: WorkerParameters
) : Worker(appContext, workerParams) {
  override fun doWork(): Result {
    val context = applicationContext
    if (PandaScheduler.isAppForeground(context)) return Result.success()

    val actualState = PandaScheduler.calculateCurrentState(context)
    PandaIconManager.setState(context, actualState)
    return Result.success()
  }
}
