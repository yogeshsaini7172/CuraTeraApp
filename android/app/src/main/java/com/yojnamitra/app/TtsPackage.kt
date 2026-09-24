package com.yojnamitra.app

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class TtsPackage : BaseReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        android.util.Log.i("NativeTts", "TtsPackage.getModule requested: '$name'")
        return when (name) {
            "NativeTts" -> TtsModule(reactContext)
            "NativeDocumentPicker" -> DocumentPickerModule(reactContext)
            "NativeSpeechRecognizer" -> SpeechRecognizerModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val moduleInfos = HashMap<String, ReactModuleInfo>()
            moduleInfos["NativeTts"] = ReactModuleInfo(
                "NativeTts",
                "com.yojnamitra.app.TtsModule",
                false, // canOverrideExistingModule
                false, // needsEagerInit
                false, // isCxxModule
                false  // isTurboModule: false because it is a ReactContextBaseJavaModule
            )
            moduleInfos["NativeDocumentPicker"] = ReactModuleInfo(
                "NativeDocumentPicker",
                "com.yojnamitra.app.DocumentPickerModule",
                false,
                false,
                false,
                false
            )
            moduleInfos["NativeSpeechRecognizer"] = ReactModuleInfo(
                "NativeSpeechRecognizer",
                "com.yojnamitra.app.SpeechRecognizerModule",
                false,
                false,
                false,
                false
            )
            moduleInfos
        }
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}

