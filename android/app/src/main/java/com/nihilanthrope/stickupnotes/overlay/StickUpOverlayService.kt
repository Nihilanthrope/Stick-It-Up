package com.nihilanthrope.stickupnotes.overlay

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.*
import com.nihilanthrope.stickupnotes.MainActivity

/**
 * Native Android Floating Sticky Note Service.
 * Uses WindowManager with TYPE_APPLICATION_OVERLAY to render a real draggable,
 * editable, minimizable floating sticky note above other applications.
 */
class StickUpOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    private var isMinimized = false
    private var currentNoteId: String? = null
    private var currentTitle = "Floating Sticky Note 📌"
    private var currentContent = ""
    private var isPinned = false

    companion object {
        const val ACTION_SHOW = "com.nihilanthrope.stickupnotes.ACTION_SHOW"
        const val ACTION_HIDE = "com.nihilanthrope.stickupnotes.ACTION_HIDE"
        const val ACTION_MINIMIZE = "com.nihilanthrope.stickupnotes.ACTION_MINIMIZE"
        const val ACTION_RESTORE = "com.nihilanthrope.stickupnotes.ACTION_RESTORE"
        const val EXTRA_NOTE_ID = "extra_note_id"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_SHOW
        val noteId = intent?.getStringExtra(EXTRA_NOTE_ID)

        if (noteId != null) {
            currentNoteId = noteId
        }

        when (action) {
            ACTION_SHOW -> showOverlay()
            ACTION_HIDE -> hideOverlay()
            ACTION_MINIMIZE -> setMinimized(true)
            ACTION_RESTORE -> setMinimized(false)
        }

        return START_NOT_STICKY
    }

    private fun showOverlay() {
        if (!OverlayPermissionHelper.canDrawOverlays(this)) {
            return
        }

        if (overlayView == null) {
            createOverlayView()
        } else {
            overlayView?.visibility = View.VISIBLE
        }
    }

    private fun hideOverlay() {
        // Non-destructive: hiding overlay preserves all note data
        overlayView?.let {
            it.visibility = View.GONE
        }
    }

    private fun setMinimized(minimized: Boolean) {
        if (isMinimized == minimized) return
        isMinimized = minimized

        // Recreate layout with minimized bubble or full note
        removeOverlayView()
        createOverlayView()
    }

    private fun createOverlayView() {
        val windowType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val width = if (isMinimized) dpToPx(160) else dpToPx(300)
        val height = if (isMinimized) dpToPx(52) else dpToPx(340)

        layoutParams = WindowManager.LayoutParams(
            width,
            height,
            windowType,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 80
            y = 140
        }

        val root = if (isMinimized) buildMinimizedBubbleView() else buildFullNoteView()
        attachDragListener(root, layoutParams!!)

        overlayView = root
        try {
            windowManager.addView(overlayView, layoutParams)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun buildFullNoteView(): View {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#FFFDF5")) // Cream paper color
                setStroke(dpToPx(1), Color.parseColor("#E8DFC8"))
                cornerRadius = dpToPx(8).toFloat()
            }
            setPadding(dpToPx(12), dpToPx(8), dpToPx(12), dpToPx(12))
            elevation = dpToPx(10).toFloat()
        }

        // Header / Tape drag handle
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 0, 0, dpToPx(6))
        }

        val pinBadge = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_edit)
            setColorFilter(Color.parseColor("#9E1B32")) // Crimson accent
        }

        val titleView = TextView(this).apply {
            text = currentTitle
            setTextColor(Color.parseColor("#292524"))
            textSize = 14f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dpToPx(6)
            }
        }

        // Minimize Button (-)
        val minBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_more)
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.parseColor("#78716C"))
            setOnClickListener { setMinimized(true) }
        }

        // Open App Button
        val openAppBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_view)
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.parseColor("#78716C"))
            setOnClickListener { openMainApp() }
        }

        // Close Button (X) - Non destructive hide!
        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.parseColor("#9E1B32"))
            setOnClickListener { hideOverlay() }
        }

        header.addView(pinBadge, dpToPx(18), dpToPx(18))
        header.addView(titleView)
        header.addView(minBtn, dpToPx(28), dpToPx(28))
        header.addView(openAppBtn, dpToPx(28), dpToPx(28))
        header.addView(closeBtn, dpToPx(28), dpToPx(28))

        // Content EditText
        val contentInput = EditText(this).apply {
            setText(currentContent)
            hint = "Jot down your thoughts..."
            setTextColor(Color.parseColor("#292524"))
            setHintTextColor(Color.parseColor("#A8A29E"))
            textSize = 12f
            background = null
            gravity = Gravity.TOP or Gravity.START
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
            )
        }

        // Footer Toolbar
        val footer = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dpToPx(6), 0, 0)
        }

        val quickAddBtn = Button(this).apply {
            text = "+ Quick"
            textSize = 10f
            setTextColor(Color.parseColor("#9E1B32"))
            setBackgroundColor(Color.TRANSPARENT)
            setOnClickListener {
                contentInput.setText("")
                currentTitle = "Quick Note 📌"
                titleView.text = currentTitle
            }
        }

        val footerText = TextView(this).apply {
            text = "Stick Up Notes Overlay"
            setTextColor(Color.parseColor("#A8A29E"))
            textSize = 9f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            gravity = Gravity.END
        }

        footer.addView(quickAddBtn)
        footer.addView(footerText)

        layout.addView(header)
        layout.addView(contentInput)
        layout.addView(footer)

        return layout
    }

    private fun buildMinimizedBubbleView(): View {
        val bubble = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#FFFDF5"))
                setStroke(dpToPx(1), Color.parseColor("#9E1B32"))
                cornerRadius = dpToPx(20).toFloat()
            }
            setPadding(dpToPx(10), dpToPx(4), dpToPx(10), dpToPx(4))
            elevation = dpToPx(8).toFloat()
        }

        val icon = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_edit)
            setColorFilter(Color.parseColor("#9E1B32"))
        }

        val title = TextView(this).apply {
            text = currentTitle
            setTextColor(Color.parseColor("#292524"))
            textSize = 11f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            maxLines = 1
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                marginStart = dpToPx(6)
            }
        }

        val expandBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_always_landscape_portrait)
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.parseColor("#292524"))
            setOnClickListener { setMinimized(false) }
        }

        val closeBtn = ImageButton(this).apply {
            setImageResource(android.R.drawable.ic_menu_close_clear_cancel)
            setBackgroundColor(Color.TRANSPARENT)
            setColorFilter(Color.parseColor("#9E1B32"))
            setOnClickListener { hideOverlay() }
        }

        bubble.addView(icon, dpToPx(18), dpToPx(18))
        bubble.addView(title)
        bubble.addView(expandBtn, dpToPx(24), dpToPx(24))
        bubble.addView(closeBtn, dpToPx(24), dpToPx(24))

        return bubble
    }

    private fun attachDragListener(view: View, params: WindowManager.LayoutParams) {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f

        view.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - initialTouchX).toInt()
                    params.y = initialY + (event.rawY - initialTouchY).toInt()
                    windowManager.updateViewLayout(view, params)
                    true
                }
                else -> false
            }
        }
    }

    private fun openMainApp() {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
    }

    private fun removeOverlayView() {
        overlayView?.let {
            try {
                windowManager.removeView(it)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            overlayView = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        removeOverlayView()
    }

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
