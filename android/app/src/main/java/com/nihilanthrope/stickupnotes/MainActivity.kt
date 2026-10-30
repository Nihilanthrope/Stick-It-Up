package com.nihilanthrope.stickupnotes

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import com.nihilanthrope.stickupnotes.overlay.StickUpNativeBridgeInterface

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                url: String
            ): android.webkit.WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(android.net.Uri.parse(url))
            }
        }

        // Inject the typed native bridge for Android overlay operations
        val bridge = StickUpNativeBridgeInterface(this)
        webView.addJavascriptInterface(bridge, "__STICK_UP_ANDROID_BRIDGE__")

        // Load the Stick Up Notes application
        // In release builds, loads local assets (file:///android_asset/dist/index.html)
        // In local development, can point to local dev server
        webView.loadUrl("https://appassets.androidplatform.net/dist/index.html")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
