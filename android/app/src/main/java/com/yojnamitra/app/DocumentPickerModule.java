package com.yojnamitra.app;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = "NativeDocumentPicker")
public class DocumentPickerModule extends ReactContextBaseJavaModule implements ActivityEventListener {
    private static final int PICK_DOCUMENT_REQUEST_CODE = 41239;
    private Promise pickerPromise = null;

    public DocumentPickerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "NativeDocumentPicker";
    }

    @ReactMethod
    public void pickDocument(Promise promise) {
        android.util.Log.i("NativeDocumentPicker", "pickDocument requested");
        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            android.util.Log.e("NativeDocumentPicker", "currentActivity is null");
            promise.reject("E_NO_ACTIVITY", "Current activity is null");
            return;
        }

        if (pickerPromise != null) {
            promise.reject("E_BUSY", "Another document picker is already running");
            return;
        }

        pickerPromise = promise;

        try {
            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.setType("*/*");
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            Intent chooser = Intent.createChooser(intent, "Choose Document or File");
            currentActivity.startActivityForResult(chooser, PICK_DOCUMENT_REQUEST_CODE);
            android.util.Log.i("NativeDocumentPicker", "startActivityForResult called successfully");
        } catch (Exception e) {
            android.util.Log.e("NativeDocumentPicker", "Error launching chooser", e);
            if (pickerPromise != null) {
                pickerPromise.reject("E_FAILED_LAUNCH", e.getMessage(), e);
                pickerPromise = null;
            }
        }
    }

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, @Nullable Intent data) {
        android.util.Log.i("NativeDocumentPicker", "onActivityResult: req=" + requestCode + ", res=" + resultCode);
        if (requestCode == PICK_DOCUMENT_REQUEST_CODE) {
            if (pickerPromise == null) return;
            Promise promise = pickerPromise;
            pickerPromise = null;

            if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
                Uri uri = data.getData();
                android.util.Log.i("NativeDocumentPicker", "File picked URI: " + uri);
                WritableMap map = Arguments.createMap();
                map.putString("uri", uri.toString());

                String displayName = "Document";
                double size = 0.0;

                try {
                    Cursor cursor = getReactApplicationContext().getContentResolver().query(uri, null, null, null, null);
                    if (cursor != null) {
                        try {
                            if (cursor.moveToFirst()) {
                                int nameIdx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                                if (nameIdx != -1) {
                                    displayName = cursor.getString(nameIdx);
                                }
                                int sizeIdx = cursor.getColumnIndex(OpenableColumns.SIZE);
                                if (sizeIdx != -1) {
                                    size = (double) cursor.getLong(sizeIdx);
                                }
                            }
                        } finally {
                            cursor.close();
                        }
                    }
                } catch (Exception e) {
                    android.util.Log.e("NativeDocumentPicker", "Error querying cursor", e);
                }

                map.putString("name", displayName);
                map.putDouble("size", size);
                promise.resolve(map);
            } else {
                android.util.Log.i("NativeDocumentPicker", "Picker cancelled");
                WritableMap map = Arguments.createMap();
                map.putBoolean("cancelled", true);
                promise.resolve(map);
            }
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
    }
}
