package com.portal

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    createDefaultNotificationChannel()
    loadReactNative(this)
  }

  /**
   * Required before any FCM "notification" payload can show while the app is backgrounded or
   * killed — JS/Notifee may not run yet. Must match [R.string.default_notification_channel_id].
   */
  private fun createDefaultNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val channelId = getString(R.string.default_notification_channel_id)
    val channel =
            NotificationChannel(
                            channelId,
                            "Portal Alerts",
                            NotificationManager.IMPORTANCE_HIGH,
                    )
                    .apply {
                      description = "Membership and portal alerts"
                      enableLights(true)
                      enableVibration(true)
                      setShowBadge(true)
                      setSound(
                              RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                              AudioAttributes.Builder()
                                      .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                                      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                      .build(),
                      )
                    }
    val nm = getSystemService(NotificationManager::class.java)
    nm.createNotificationChannel(channel)
  }
}
