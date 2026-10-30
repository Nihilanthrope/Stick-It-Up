package com.nihilanthrope.stickupnotes.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.core.app.NotificationCompat
import androidx.webkit.WebViewAssetLoader
import com.nihilanthrope.stickupnotes.MainActivity

/**
 * Real Android OS-level floating overlay.
 *
 * The overlay hosts the same React FloatingOverlayView as the main app rather
 * than maintaining a second native note editor. This keeps notes, themes,
 * checklists and localStorage in one data model.
 */
class StickUpOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var rootView: FrameLayout? = null
    private var webView: WebView? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    companion object {
        const val ACTION_SHOW = "com.nihilanthrope.stickupnotes.ACTION_SHOW"
        const val ACTION_HIDE = "com.nihilanthrope.stickupnotes.ACTION_HIDE"
        const val ACTION_MINIMIZE = "com.nihilanthrope.stickupnotes.ACTION_MINIMIZE"
        const val ACTION_RESTORE = "com.nihilanthrope.stickupnotes.ACTION_RESTORE"
        const val EXTRA_NOTE_ID = "extra_note_id"
        private const val CHANNEL_ID = "stick_up_overlay"
        private const val NOTIFICATION_ID = 4101

        fun moveActiveOverlay(context: Context, deltaX: Int, deltaY: Int): Boolean {
            val service = context as? StickUpOverlayService ?: return false
            return service.moveOverlay(deltaX, deltaY)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action ?: ACTION_SHOW) {
            ACTION_SHOW -> showOverlay()
            ACTION_HIDE -> hideOverlay()
            ACTION_MINIMIZE -> setMinimized(true)
            ACTION_RESTORE -> setMinimized(false)
        }
        return START_STICKY
    }

    private fun showOverlay() {
        if (!Settings.canDrawOverlays(this)) return

        if (rootView == null) {
            createOverlayWindow()
        } else {
            rootView?.visibility = View.VISIBLE
        }
    }

    private fun hideOverlay() {
        // Non-destructive: hiding the OS window never deletes or mutates a note.
        rootView?.visibility = View.GONE
    }

    private fun setMinimized(minimized: Boolean) {
        val params = layoutParams ?: return
        params.width = dpToPx(if (minimized) 260 else 320)
        params.height = dpToPx(if (minimized) 56 else 380)
        rootView?.let { view ->
            try {
                windowManager.updateViewLayout(view, params)
            } catch (_: Exception) {
                // Window may already be gone during service shutdown.
            }
        }
    }

    private fun createOverlayWindow() {
        val windowType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        layoutParams = WindowManager.LayoutParams(
            dpToPx(320),
            dpToPx(380),
            windowType,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = dpToPx(40)
            y = dpToPx(120)
        }

        val frame = FrameLayout(this).apply {
            setBackgroundColor(Color.TRANSPARENT)
        }

        val view = WebView(this).apply {
            setBackgroundColor(Color.TRANSPARENT)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
            val assetLoader = WebViewAssetLoader.Builder()
                .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this@StickUpOverlayService))
                .build()
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    url: String
                ): android.webkit.WebResourceResponse? {
                    return assetLoader.shouldInterceptRequest(android.net.Uri.parse(url))
                }
            }
            addJavascriptInterface(StickUpNativeBridgeInterface(this@StickUpOverlayService), "__STICK_UP_ANDROID_BRIDGE__")
            loadUrl("https://appassets.androidplatform.net/dist/index.html?mode=overlay")
        }

        frame.addView(
            view,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        )

        rootView = frame
        webView = view

        try {
            windowManager.addView(frame, layoutParams)
        } catch (e: Exception) {
            rootView = null
            webView = null
            throw e
        }
    }

    fun moveOverlay(deltaX: Int, deltaY: Int): Boolean {
        val view = rootView ?: return false
        val params = layoutParams ?: return false
        params.x += deltaX
        params.y += deltaY
        return try {
            windowManager.updateViewLayout(view, params)
            true
        } catch (_: Exception) {
            false
        }
    }

    private fun openMainApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
    }

    private fun buildNotification(): Notification {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setContentTitle("Stick Up Notes")
            .setContentText("Floating note overlay is active")
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Stick Up Notes overlay",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the Stick Up Notes floating overlay active."
            }
            getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
        }
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        rootView?.let {
            try {
                windowManager.removeView(it)
            } catch (_: Exception) {
                // Already removed.
            }
        }
        rootView = null
        super.onDestroy()
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
