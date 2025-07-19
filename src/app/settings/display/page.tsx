"use client";
import { Box, Typography, Button, Divider, ToggleButton, ToggleButtonGroup, Switch, FormControlLabel, Slider, Card, CardContent } from "@mui/material";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowBack, Palette, TextFields, Visibility, Brightness4, Brightness7 } from "@mui/icons-material";

export default function DisplaySettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [autoTheme, setAutoTheme] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' || 'medium';
    const savedAutoTheme = localStorage.getItem('autoTheme') === 'true';
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    const savedReducedMotion = localStorage.getItem('reducedMotion') === 'true';

    setTheme(savedTheme);
    setFontSize(savedFontSize);
    setAutoTheme(savedAutoTheme);
    setHighContrast(savedHighContrast);
    setReducedMotion(savedReducedMotion);

    // 設定を実際に適用
    const root = document.documentElement;
    root.setAttribute('data-theme', savedTheme);
    root.setAttribute('data-font-size', savedFontSize);
    
    if (savedAutoTheme) {
      root.setAttribute('data-auto-theme', 'true');
    }
    
    if (savedHighContrast) {
      root.setAttribute('data-high-contrast', 'true');
    }
    
    if (savedReducedMotion) {
      root.setAttribute('data-reduced-motion', 'true');
    }
  }, []);

  // テーマ変更時の処理
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // 実際のテーマ適用（ダミー実装）
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // フォントサイズ変更時の処理
  const handleFontSizeChange = (newFontSize: 'small' | 'medium' | 'large') => {
    setFontSize(newFontSize);
    localStorage.setItem('fontSize', newFontSize);
    
    // 実際のフォントサイズ適用
    const root = document.documentElement;
    root.setAttribute('data-font-size', newFontSize);
  };

  // 自動テーマ切り替え
  const handleAutoThemeChange = (checked: boolean) => {
    setAutoTheme(checked);
    localStorage.setItem('autoTheme', checked.toString());
    
    if (checked) {
      // システムのカラーモードを検出
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const newTheme = prefersDark ? 'dark' : 'light';
      handleThemeChange(newTheme);
      document.documentElement.setAttribute('data-auto-theme', 'true');
    } else {
      document.documentElement.removeAttribute('data-auto-theme');
    }
  };

  // 高コントラストモード
  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked);
    localStorage.setItem('highContrast', checked.toString());
    
    // 高コントラストモードの適用
    if (checked) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  };

  // アニメーション軽減
  const handleReducedMotionChange = (checked: boolean) => {
    setReducedMotion(checked);
    localStorage.setItem('reducedMotion', checked.toString());
    
    // アニメーション軽減の適用
    if (checked) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  };

  const handleSave = () => {
    // 設定を保存
    localStorage.setItem('theme', theme);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('autoTheme', autoTheme.toString());
    localStorage.setItem('highContrast', highContrast.toString());
    localStorage.setItem('reducedMotion', reducedMotion.toString());
    
    alert("表示設定を保存しました");
  };

  return (
    <Box sx={{ background: '#f5f5f5', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <Box sx={{ 
        background: '#fff', 
        borderBottom: '1px solid #e0e0e0',
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ color: '#666' }}
        >
          戻る
        </Button>
        <Typography variant="h6" fontWeight="bold" color="#222">
          表示設定
        </Typography>
      </Box>

      {/* コンテンツ */}
      <Box sx={{ p: 2 }}>
        {/* テーマ設定 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Palette sx={{ color: '#666' }} />
              <Typography variant="h6" fontWeight="bold" color="#222">
                テーマ設定
              </Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoTheme}
                  onChange={(e) => handleAutoThemeChange(e.target.checked)}
                />
              }
              label="システム設定に合わせる"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              テーマ
            </Typography>
            <ToggleButtonGroup
              value={theme}
              exclusive
              onChange={(_, val) => val && handleThemeChange(val)}
              disabled={autoTheme}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="light" sx={{ px: 3 }}>
                <Brightness7 sx={{ mr: 1 }} />
                ライト
              </ToggleButton>
              <ToggleButton value="dark" sx={{ px: 3 }}>
                <Brightness4 sx={{ mr: 1 }} />
                ダーク
              </ToggleButton>
            </ToggleButtonGroup>
          </CardContent>
        </Card>

        {/* フォント設定 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TextFields sx={{ color: '#666' }} />
              <Typography variant="h6" fontWeight="bold" color="#222">
                フォント設定
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              フォントサイズ
            </Typography>
            <ToggleButtonGroup
              value={fontSize}
              exclusive
              onChange={(_, val) => val && handleFontSizeChange(val)}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="small" sx={{ px: 3 }}>小</ToggleButton>
              <ToggleButton value="medium" sx={{ px: 3 }}>標準</ToggleButton>
              <ToggleButton value="large" sx={{ px: 3 }}>大</ToggleButton>
            </ToggleButtonGroup>
          </CardContent>
        </Card>

        {/* アクセシビリティ設定 */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Visibility sx={{ color: '#666' }} />
              <Typography variant="h6" fontWeight="bold" color="#222">
                アクセシビリティ
              </Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={highContrast}
                  onChange={(e) => handleHighContrastChange(e.target.checked)}
                />
              }
              label="高コントラストモード"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={reducedMotion}
                  onChange={(e) => handleReducedMotionChange(e.target.checked)}
                />
              }
              label="アニメーション軽減"
              sx={{ mb: 2 }}
            />
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth
          onClick={handleSave}
          sx={{ mt: 2 }}
        >
          設定を保存
        </Button>
      </Box>
    </Box>
  );
} 