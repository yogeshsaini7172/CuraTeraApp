package com.yojnamitra.app

import android.speech.tts.TextToSpeech
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.util.Locale

@ReactModule(name = "NativeTts")
class TtsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private var pendingSpeakText: String? = null
    private var pendingLang: String = "hi"
    private var pendingRate: Float = 0.95f
    private var pendingPitch: Float = 1.0f

    init {
        try {
            tts = TextToSpeech(reactContext.applicationContext, this)
            Log.i("NativeTts", "Initializing TextToSpeech engine...")
        } catch (e: Exception) {
            Log.e("NativeTts", "Error instantiating TextToSpeech", e)
        }
    }

    override fun getName(): String = "NativeTts"

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true
            Log.i("NativeTts", "TextToSpeech initialized successfully")
            val pending = pendingSpeakText
            if (!pending.isNullOrBlank()) {
                pendingSpeakText = null
                speakInternal(pending, pendingLang, pendingRate, pendingPitch)
            }
        } else {
            Log.e("NativeTts", "TextToSpeech init failed with status: $status")
        }
    }

    private fun speakInternal(text: String, lang: String, rate: Float, pitch: Float) {
        val ttsInstance = tts ?: return
        try {
            val desiredLocale = if (lang.startsWith("en", ignoreCase = true)) {
                Locale.ENGLISH
            } else {
                Locale("hi", "IN")
            }

            val availability = ttsInstance.isLanguageAvailable(desiredLocale)
            if (availability >= TextToSpeech.LANG_AVAILABLE) {
                ttsInstance.language = desiredLocale
            } else {
                Log.w("NativeTts", "Locale $desiredLocale not fully available ($availability), falling back to default")
                ttsInstance.language = Locale.getDefault()
            }

            ttsInstance.setSpeechRate(rate)
            ttsInstance.setPitch(pitch)
            val utteranceId = "CuraTera_${System.currentTimeMillis()}"
            val res = ttsInstance.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
            Log.i("NativeTts", "tts.speak called for text: '$text', result code: $res")
        } catch (e: Exception) {
            Log.e("NativeTts", "Exception during speakInternal", e)
        }
    }

    @ReactMethod
    fun speak(text: String, lang: String, rate: Double, pitch: Double) {
        val safeRate = if (rate > 0) rate.toFloat() else 0.95f
        val safePitch = if (pitch > 0) pitch.toFloat() else 1.0f

        Log.i("NativeTts", "speak called from JS: '$text', isInitialized=$isInitialized")
        if (!isInitialized || tts == null) {
            Log.i("NativeTts", "TTS not ready yet, queuing text: '$text'")
            pendingSpeakText = text
            pendingLang = lang
            pendingRate = safeRate
            pendingPitch = safePitch
            if (tts == null) {
                tts = TextToSpeech(reactContext.applicationContext, this)
            }
            return
        }

        speakInternal(text, lang, safeRate, safePitch)
    }

    @ReactMethod
    fun stop() {
        try {
            tts?.stop()
            pendingSpeakText = null
            Log.i("NativeTts", "TTS stopped")
        } catch (e: Exception) {
            Log.e("NativeTts", "Exception stopping TTS", e)
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            tts?.stop()
            tts?.shutdown()
            tts = null
        } catch (e: Exception) {
            Log.e("NativeTts", "Exception shutting down TTS", e)
        }
    }
}

