package com.yojnamitra.app;

import android.app.Activity;
import android.content.Intent;
import android.speech.RecognizerIntent;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.util.ArrayList;

@ReactModule(name = "NativeSpeechRecognizer")
public class SpeechRecognizerModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int SPEECH_REQUEST_CODE = 41250;
    private static final String TAG = "NativeSpeechRecognizer";
    private Promise speechPromise = null;

    public SpeechRecognizerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "NativeSpeechRecognizer";
    }

    @ReactMethod
    public void startSpeech(String language, Promise promise) {
        Log.i(TAG, "startSpeech requested with language: " + language);
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            promise.reject("E_NO_ACTIVITY", "Current activity is null");
            return;
        }

        if (speechPromise != null) {
            promise.reject("E_BUSY", "Speech recognition is already running");
            return;
        }

        speechPromise = promise;

        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);

            String langTag = (language != null && language.startsWith("en")) ? "en-IN" : "hi-IN";
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, langTag);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, langTag);
            intent.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, langTag);
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, (language != null && language.startsWith("en")) ? "Speak now..." : "बोलिए...");

            currentActivity.startActivityForResult(intent, SPEECH_REQUEST_CODE);
            Log.i(TAG, "Speech Recognizer intent launched successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error starting speech recognition intent: " + e.getMessage());
            speechPromise.reject("E_SPEECH_ERROR", e.getMessage());
            speechPromise = null;
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
        if (requestCode != SPEECH_REQUEST_CODE) {
            return;
        }

        if (speechPromise == null) {
            return;
        }

        try {
            if (resultCode == Activity.RESULT_OK && data != null) {
                ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (matches != null && !matches.isEmpty()) {
                    String recognizedText = matches.get(0);
                    Log.i(TAG, "Recognized text: " + recognizedText);
                    speechPromise.resolve(recognizedText);
                } else {
                    speechPromise.reject("E_NO_MATCH", "No speech recognized");
                }
            } else {
                Log.w(TAG, "Speech recognition cancelled or failed, resultCode=" + resultCode);
                speechPromise.reject("E_CANCELLED", "Speech recognition cancelled");
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception handling speech result: " + e.getMessage());
            speechPromise.reject("E_SPEECH_RESULT_ERROR", e.getMessage());
        } finally {
            speechPromise = null;
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
    }
}
