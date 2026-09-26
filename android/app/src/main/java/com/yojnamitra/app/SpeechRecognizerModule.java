package com.yojnamitra.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;

import java.util.ArrayList;

@ReactModule(name = "NativeSpeechRecognizer")
public class SpeechRecognizerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "NativeSpeechRecognizer";
    private Promise speechPromise = null;
    private SpeechRecognizer speechRecognizer;

    public SpeechRecognizerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "NativeSpeechRecognizer";
    }

    @ReactMethod
    public void startSpeech(String language, Promise promise) {
        Log.i(TAG, "startSpeech requested silently with language: " + language);

        if (speechPromise != null) {
            promise.reject("E_BUSY", "Speech recognition is already running");
            return;
        }

        speechPromise = promise;

        // SpeechRecognizer MUST be instantiated and used on the main UI thread!
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                if (speechRecognizer != null) {
                    speechRecognizer.destroy();
                }

                Activity currentActivity = getCurrentActivity();
                if (currentActivity == null) {
                    rejectPromise("E_NO_ACTIVITY", "Current activity is null");
                    return;
                }

                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getReactApplicationContext());
                speechRecognizer.setRecognitionListener(new RecognitionListener() {
                    @Override
                    public void onReadyForSpeech(Bundle params) {
                        Log.i(TAG, "onReadyForSpeech");
                        getReactApplicationContext()
                            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onSpeechState", "listening");
                    }

                    @Override
                    public void onBeginningOfSpeech() {
                        Log.i(TAG, "onBeginningOfSpeech");
                        getReactApplicationContext()
                            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onSpeechState", "speaking_detected");
                    }

                    @Override
                    public void onRmsChanged(float rmsdB) {
                    }

                    @Override
                    public void onBufferReceived(byte[] buffer) {
                    }

                    @Override
                    public void onEndOfSpeech() {
                        Log.i(TAG, "onEndOfSpeech");
                        getReactApplicationContext()
                            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onSpeechState", "processing");
                    }

                    @Override
                    public void onError(int error) {
                        Log.e(TAG, "Speech recognition error code: " + error);
                        getReactApplicationContext()
                            .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                            .emit("onSpeechState", "error");
                        // 7 is ERROR_NO_MATCH, 6 is ERROR_SPEECH_TIMEOUT
                        if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                            rejectPromise("E_NO_MATCH", "No speech recognized or timed out");
                        } else {
                            rejectPromise("E_SPEECH_ERROR", "Error code: " + error);
                        }
                    }

                    @Override
                    public void onResults(Bundle results) {
                        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (matches != null && !matches.isEmpty()) {
                            String recognizedText = matches.get(0);
                            Log.i(TAG, "Recognized text: " + recognizedText);
                            resolvePromise(recognizedText);
                        } else {
                            rejectPromise("E_NO_MATCH", "No speech recognized");
                        }
                    }

                    @Override
                    public void onPartialResults(Bundle partialResults) {
                        ArrayList<String> matches = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (matches != null && !matches.isEmpty()) {
                            String partialText = matches.get(0);
                            getReactApplicationContext()
                                .getJSModule(com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("onSpeechPartialResult", partialText);
                        }
                    }

                    @Override
                    public void onEvent(int eventType, Bundle params) {
                    }
                });

                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                
                String langTag = (language != null && language.startsWith("en")) ? "en-IN" : "hi-IN";
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, langTag);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, langTag);
                intent.putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, langTag);

                speechRecognizer.startListening(intent);
                Log.i(TAG, "Silent background speech recognition started");
            } catch (Exception e) {
                Log.e(TAG, "Error starting speech recognition: " + e.getMessage());
                rejectPromise("E_SPEECH_ERROR", e.getMessage());
            }
        });
    }

    private void resolvePromise(String result) {
        if (speechPromise != null) {
            speechPromise.resolve(result);
            speechPromise = null;
        }
        cleanupRecognizer();
    }

    private void rejectPromise(String code, String message) {
        if (speechPromise != null) {
            speechPromise.reject(code, message);
            speechPromise = null;
        }
        cleanupRecognizer();
    }

    private void cleanupRecognizer() {
        new Handler(Looper.getMainLooper()).post(() -> {
            if (speechRecognizer != null) {
                speechRecognizer.destroy();
                speechRecognizer = null;
            }
        });
    }
}
