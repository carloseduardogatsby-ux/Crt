import JSZip from 'jszip';
import { CrtConfig } from '../types/crt';

export async function generateAndroidProjectZip(config: CrtConfig, appUrl: string): Promise<Blob> {
  const zip = new JSZip();

  // Root settings.gradle.kts
  zip.file(
    'settings.gradle.kts',
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "CRT-Overlay-Android"
include(":app")
`
  );

  // Root build.gradle.kts
  zip.file(
    'build.gradle.kts',
    `plugins {
    id("com.android.application") version "8.4.0" apply false
    id("org.jetbrains.kotlin.android") version "1.9.23" apply false
}
`
  );

  // gradle.properties
  zip.file(
    'gradle.properties',
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
`
  );

  // GitHub Actions CI Workflow to auto-build APK
  zip.file(
    '.github/workflows/build-apk.yml',
    `name: Compilar APK CRT Overlay

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configurar Java 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Configurar Gradle
        uses: gradle/actions/setup-gradle@v3

      - name: Compilar APK de Depuração
        run: |
          chmod +x gradlew || true
          ./gradlew assembleDebug || gradle assembleDebug

      - name: Disponibilizar APK para Download
        uses: actions/upload-artifact@v4
        with:
          name: CRT-Overlay-Android-APK
          path: app/build/outputs/apk/debug/*.apk
`
  );

  // app/build.gradle.kts
  zip.file(
    'app/build.gradle.kts',
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.crtoverlay.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.crtoverlay.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.12.0")
}
`
  );

  // app/src/main/AndroidManifest.xml
  zip.file(
    'app/src/main/AndroidManifest.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissão crítica para desenhar sobre o YouTube e outros apps -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="CRT Overlay"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/Theme.CRTOverlay">

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".OverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="specialUse" />

    </application>

</manifest>
`
  );

  // Shaders for Android OpenGL
  zip.file(
    'app/src/main/assets/shaders/crt_vert.glsl',
    `attribute vec4 a_Position;
varying vec2 v_TexCoord;

void main() {
    gl_Position = a_Position;
    v_TexCoord = (a_Position.xy + 1.0) * 0.5;
}
`
  );

  zip.file(
    'app/src/main/assets/shaders/crt_frag.glsl',
    `precision mediump float;
varying vec2 v_TexCoord;
uniform float u_Time;
uniform float u_Curvature;
uniform float u_ScanlineIntensity;
uniform float u_ScanlineCount;
uniform float u_Opacity;

vec2 curve(vec2 uv) {
    if (u_Curvature <= 0.001) return uv;
    vec2 coord = uv * 2.0 - 1.0;
    vec2 offset = coord.yx / (3.2 / u_Curvature);
    coord = coord + coord * offset * offset;
    return coord * 0.5 + 0.5;
}

void main() {
    vec2 uv = curve(v_TexCoord);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.8 * u_Opacity);
        return;
    }

    // Scanlines
    float scanline = sin(uv.y * u_ScanlineCount * 3.14159265);
    scanline = (scanline + 1.0) * 0.5;
    float dark = mix(1.0, scanline, u_ScanlineIntensity);

    // Vignette
    vec2 vuv = uv * (1.0 - uv);
    float vig = vuv.x * vuv.y * 15.0;
    vig = clamp(pow(vig, 0.4), 0.0, 1.0);

    // Transparent overlay tint with scanlines
    float alpha = (1.0 - dark * vig) * u_Opacity;
    gl_FragColor = vec4(0.0, 0.0, 0.0, clamp(alpha, 0.0, 0.9));
}
`
  );

  // Kotlin MainActivity with simple toggle
  zip.file(
    'app/src/main/java/com/crtoverlay/app/MainActivity.kt',
    `package com.crtoverlay.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.SeekBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnToggle = findViewById<Button>(R.id.btn_toggle_overlay)
        val textStatus = findViewById<TextView>(R.id.text_status)

        updateButtonState(btnToggle, textStatus)

        btnToggle.setOnClickListener {
            if (!checkOverlayPermission()) {
                requestOverlayPermission()
            } else {
                if (OverlayService.isRunning) {
                    stopService(Intent(this, OverlayService::class.java))
                    Toast.makeText(this, "Efeito CRT desativado da tela", Toast.LENGTH_SHORT).show()
                } else {
                    val intent = Intent(this, OverlayService::class.java)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(intent)
                    } else {
                        startService(intent)
                    }
                    Toast.makeText(this, "CRT Ativado! Abra o YouTube para ver o efeito.", Toast.LENGTH_LONG).show()
                }
                updateButtonState(btnToggle, textStatus)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        val btnToggle = findViewById<Button>(R.id.btn_toggle_overlay)
        val textStatus = findViewById<TextView>(R.id.text_status)
        updateButtonState(btnToggle, textStatus)
    }

    private fun updateButtonState(btn: Button, status: TextView) {
        if (OverlayService.isRunning) {
            btn.text = "■ DESATIVAR SOBREPOSIÇÃO CRT"
            btn.setBackgroundColor(0xFFE11D48.toInt()) // Rose
            status.text = "Status: CRT ATIVO SOBRE O YOUTUBE E APPS"
            status.setTextColor(0xFF10B981.toInt()) // Emerald
        } else {
            btn.text = "▶ ATIVAR CRT SOBRE O YOUTUBE E APPS"
            btn.setBackgroundColor(0xFF10B981.toInt()) // Emerald
            status.text = "Status: Desativado"
            status.setTextColor(0xFF94A3B8.toInt()) // Slate
        }
    }

    private fun checkOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:$packageName")
            )
            startActivity(intent)
            Toast.makeText(
                this,
                "Ative a permissão 'Aparecer sobre outros apps' para o CRT cobrir o YouTube",
                Toast.LENGTH_LONG
            ).show()
        }
    }
}
`
  );

  // OverlayService with FLAG_NOT_TOUCHABLE so YouTube touches pass through
  zip.file(
    'app/src/main/java/com/crtoverlay/app/OverlayService.kt',
    `package com.crtoverlay.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.WindowManager
import androidx.core.app.NotificationCompat

class OverlayService : Service() {

    companion object {
        var isRunning = false
    }

    private var windowManager: WindowManager? = null
    private var crtView: CrtEffectGlView? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        startForegroundNotification()

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        crtView = CrtEffectGlView(this)

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        // FLAG_NOT_TOUCHABLE e FLAG_NOT_FOCUSABLE permitem tocar e usar o YouTube livremente!
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        windowManager?.addView(crtView, params)
    }

    private fun startForegroundNotification() {
        val channelId = "crt_overlay_service_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Sobreposição CRT",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }

        val openIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("CRT Overlay Ativo")
            .setContentText("Efeito de tubo CRT cobrindo a tela do celular")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(1001, notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        if (crtView != null) {
            windowManager?.removeView(crtView)
            crtView = null
        }
    }
}
`
  );

  // CrtEffectGlView.kt
  zip.file(
    'app/src/main/java/com/crtoverlay/app/CrtEffectGlView.kt',
    `package com.crtoverlay.app

import android.content.Context
import android.graphics.PixelFormat
import android.opengl.GLSurfaceView

class CrtEffectGlView(context: Context) : GLSurfaceView(context) {

    init {
        setEGLContextClientVersion(2)
        setZOrderOnTop(true)
        holder.setFormat(PixelFormat.TRANSLUCENT)
        setRenderer(CrtGlRenderer(context))
        renderMode = RENDERMODE_CONTINUOUSLY
    }
}
`
  );

  // CrtGlRenderer.kt
  zip.file(
    'app/src/main/java/com/crtoverlay/app/CrtGlRenderer.kt',
    `package com.crtoverlay.app

import android.content.Context
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10

class CrtGlRenderer(private val context: Context) : GLSurfaceView.Renderer {

    private var program: Int = 0
    private var uTimeLoc: Int = 0
    private var uCurvatureLoc: Int = 0
    private var uScanlineLoc: Int = 0
    private var uScanlineCountLoc: Int = 0
    private var uOpacityLoc: Int = 0

    private val quadVertices = floatArrayOf(
        -1.0f, -1.0f,
         1.0f, -1.0f,
        -1.0f,  1.0f,
         1.0f,  1.0f
    )

    private val vertexBuffer: FloatBuffer = ByteBuffer.allocateDirect(quadVertices.size * 4)
        .order(ByteOrder.nativeOrder())
        .asFloatBuffer()
        .apply {
            put(quadVertices)
            position(0)
        }

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        GLES20.glClearColor(0f, 0f, 0f, 0f)
        val vSrc = context.assets.open("shaders/crt_vert.glsl").bufferedReader().use { it.readText() }
        val fSrc = context.assets.open("shaders/crt_frag.glsl").bufferedReader().use { it.readText() }

        val vs = GLES20.glCreateShader(GLES20.GL_VERTEX_SHADER).also {
            GLES20.glShaderSource(it, vSrc)
            GLES20.glCompileShader(it)
        }
        val fs = GLES20.glCreateShader(GLES20.GL_FRAGMENT_SHADER).also {
            GLES20.glShaderSource(it, fSrc)
            GLES20.glCompileShader(it)
        }

        program = GLES20.glCreateProgram().also {
            GLES20.glAttachShader(it, vs)
            GLES20.glAttachShader(it, fs)
            GLES20.glLinkProgram(it)
        }

        uTimeLoc = GLES20.glGetUniformLocation(program, "u_Time")
        uCurvatureLoc = GLES20.glGetUniformLocation(program, "u_Curvature")
        uScanlineLoc = GLES20.glGetUniformLocation(program, "u_ScanlineIntensity")
        uScanlineCountLoc = GLES20.glGetUniformLocation(program, "u_ScanlineCount")
        uOpacityLoc = GLES20.glGetUniformLocation(program, "u_Opacity")
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        GLES20.glViewport(0, 0, width, height)
    }

    override fun onDrawFrame(gl: GL10?) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT)
        GLES20.glUseProgram(program)

        GLES20.glUniform1f(uCurvatureLoc, ${config.curvature.toFixed(2)}f)
        GLES20.glUniform1f(uScanlineLoc, ${config.scanlineIntensity.toFixed(2)}f)
        GLES20.glUniform1f(uScanlineCountLoc, ${config.scanlineCount.toFixed(1)}f)
        GLES20.glUniform1f(uOpacityLoc, ${config.overlayOpacity.toFixed(2)}f)

        val aPos = GLES20.glGetAttribLocation(program, "a_Position")
        GLES20.glEnableVertexAttribArray(aPos)
        GLES20.glVertexAttribPointer(aPos, 2, GLES20.GL_FLOAT, false, 0, vertexBuffer)

        GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
        GLES20.glDisableVertexAttribArray(aPos)
    }
}
`
  );

  // app layout activity_main.xml
  zip.file(
    'app/src/main/res/layout/activity_main.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#090D16"
    android:gravity="center"
    android:orientation="vertical"
    android:padding="28dp">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="CRT OVERLAY YOUTUBE"
        android:textColor="#10B981"
        android:textSize="22sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/text_status"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="10dp"
        android:text="Status: Desativado"
        android:textColor="#94A3B8"
        android:textSize="14sp" />

    <Button
        android:id="@+id/btn_toggle_overlay"
        android:layout_width="match_parent"
        android:layout_height="64dp"
        android:layout_marginTop="36dp"
        android:text="▶ ATIVAR CRT SOBRE O YOUTUBE E APPS"
        android:textColor="#000000"
        android:textSize="15sp"
        android:textStyle="bold" />

    <TextView
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_marginTop="24dp"
        android:text="Ao ativar, o efeito de tubo CRT cobrirá a tela inteira com transparência. O toque passa normalmente para o YouTube, TikTok e outros aplicativos."
        android:textColor="#64748B"
        android:textSize="12sp"
        android:gravity="center" />

</LinearLayout>
`
  );

  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>\n    <string name="app_name">CRT Overlay YouTube</string>\n</resources>\n`
  );

  zip.file(
    'app/src/main/res/values/themes.xml',
    `<resources>\n    <style name="Theme.CRTOverlay" parent="Theme.MaterialComponents.DayNight.NoActionBar">\n        <item name="android:statusBarColor">#090D16</item>\n    </style>\n</resources>\n`
  );

  zip.file(
    'README.md',
    `# CRT Overlay para YouTube no Android

Este aplicativo Android adiciona uma camada de tubo CRT (scanlines + curvatura + fósforo) sobre **toda a tela do celular**.

## Como funciona:
1. Usa o serviço \`OverlayService.kt\` com a permissão \`SYSTEM_ALERT_WINDOW\`.
2. A tela do YouTube, vídeos e jogos continuam funcionando e recebendo toques normalmente (\`FLAG_NOT_TOUCHABLE\`).
3. O efeito fica visível por cima de qualquer app que você abrir!

## Como compilar o APK:
### Opção 1: GitHub Actions (Grátis na Nuvem)
Basta subir este repositório para o seu GitHub. A aba **Actions** compila o APK automaticamente em 2 minutos!

### Opção 2: Linha de comando com Gradle
\`\`\`bash
./gradlew assembleDebug
\`\`\`
O APK pronto estará em: \`app/build/outputs/apk/debug/app-debug.apk\`.
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
