package com.nihilanthrope.stickupnotes.overlay

import android.content.Context
import android.content.Intent
import android.webkit.JavascriptInterface
import com.nihilanthrope.stickupnotes.MainActivity

/**
 * JavaScript Bridge exposed to the React web core on Android as window.__STICK_UP_ANDROID_BRIDGE__.
 */
class StickUpNativeBridgeInterface(private val context: Context) {

    @JavascriptInterface
    fun isAvailable(): Boolean = true

    @JavascriptInterface
    fun canDrawOverlays(): Boolean {
        return OverlayPermissionHelper.canDrawOverlays(context)
    }

    @JavascriptInterface
    fun requestOverlayPermission(): Boolean {
        if (OverlayPermissionHelper.canDrawOverlays(context)) {
            return true
        }
        val intent = OverlayPermissionHelper.createPermissionIntent(context)
        context.startActivity(intent)
        return false
    }

    @JavascriptInterface
    fun showOverlay(noteId: String?): Boolean {
        val intent = Intent(context, StickUpOverlayService::class.java).apply {
            action = StickUpOverlayService.ACTION_SHOW
            putExtra(StickUpOverlayService.EXTRA_NOTE_ID, noteId)
        }
        context.startService(intent)
        return true
    }

    @JavascriptInterface
    fun hideOverlay(): Boolean {
        val intent = Intent(context, StickUpOverlayService::class.java).apply {
            action = StickUpOverlayService.ACTION_HIDE
        }
        context.startService(intent)
        return true
    }

    @JavascriptInterface
    fun setMinimized(minimized: Boolean): Boolean {
        val intent = Intent(context, StickUpOverlayService::class.java).apply {
            action = if (minimized) {
                StickUpOverlayService.ACTION_MINIMIZE
            } else {
                StickUpOverlayService.ACTION_RESTORE
            }
        }
        context.startService(intent)
        return true
    }

    @JavascriptInterface
    fun openApp(): Boolean {
        val intent = Intent(context, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        context.startActivity(intent)
        return true
    }
}
